'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useSignMessage } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { type Address, parseEther, parseGwei, decodeEventLog } from 'viem';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import { transferNFT } from '@/lib/solana/marketplace';
import { transferNFTPolygon } from '@/lib/polygon/marketplace';
import { wagmiConfig, NEXUS_NFT_CONTRACT, NEXUS_ESCROW_CONTRACT, polygonAmoy, ensurePolygonChain } from '@/lib/polygon/config';
import NexusEscrowABI from '@/lib/abi/NexusEscrow.json';
import { formatChainCurrency } from '@/types/chain';
import type { NFT } from '@/types/nft';

const ESCROW_GAS = {
  chainId: polygonAmoy.id,
  maxFeePerGas: parseGwei('30'),
  maxPriorityFeePerGas: parseGwei('26'),
  gas: BigInt(300_000),
} as const;

export function useMakeOffer() {
  const { publicKey, signMessage: solanaSignMessage } = useWallet();
  const { address: evmAddress } = useAccount();
  const { signMessageAsync: evmSignMessage } = useSignMessage();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const makeOffer = useCallback(
    async (nft: NFT, amount: number) => {
      const isPolygon = nft.chain === 'polygon';
      const walletAddress = isPolygon ? evmAddress : publicKey?.toBase58();

      if (!walletAddress) {
        addToast(`Connect ${isPolygon ? 'MetaMask' : 'Solana'} wallet first`, 'error');
        return null;
      }

      if (amount <= 0) {
        addToast('Offer amount must be greater than 0', 'warning');
        return null;
      }

      try {
        const currency = formatChainCurrency(amount, nft.chain);
        let escrowOfferId: string | undefined;
        let txHash: string | undefined;

        if (isPolygon && NEXUS_ESCROW_CONTRACT && NEXUS_NFT_CONTRACT) {
          // ─── Polygon: Escrow contract deposit ───
          addToast('Depositing POL into escrow...', 'info', undefined, 5000);
          await ensurePolygonChain();

          const hash = await writeContract(wagmiConfig, {
            address: NEXUS_ESCROW_CONTRACT as Address,
            abi: NexusEscrowABI,
            functionName: 'createOffer',
            args: [
              NEXUS_NFT_CONTRACT as Address,
              BigInt(nft.tokenId || '0'),
              nft.owner as Address,
            ],
            value: parseEther(amount.toString()),
            ...ESCROW_GAS,
          });

          txHash = hash;
          const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

          // Extract offerId from OfferCreated event
          const escrowAddr = NEXUS_ESCROW_CONTRACT.toLowerCase();
          for (const log of receipt.logs) {
            if (log.address.toLowerCase() !== escrowAddr) continue;
            try {
              const decoded = decodeEventLog({
                abi: NexusEscrowABI,
                data: log.data,
                topics: log.topics,
              });
              if (decoded.eventName === 'OfferCreated') {
                const args = decoded.args as unknown as { offerId: bigint };
                escrowOfferId = args.offerId.toString();
                break;
              }
            } catch {
              // Not our event, skip
            }
          }

          addToast(`${currency} deposited into escrow!`, 'success');
        } else {
          // ─── Solana: Sign message (off-chain offer) ───
          addToast('Signing offer...', 'info', undefined, 3000);

          const msgText = `NEXUS: Offer ${amount} SOL for ${nft.mint}`;
          if (!solanaSignMessage) throw new Error('Wallet does not support signing');
          const message = new TextEncoder().encode(msgText);
          await solanaSignMessage(message);
        }

        // Save offer to DB
        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nft_mint: nft.mint,
            bidder: walletAddress,
            amount,
            nft_name: nft.name,
            nft_image: nft.image,
            chain: nft.chain,
            escrow_offer_id: escrowOfferId,
            tx_signature: txHash,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create offer');
        }

        invalidateAll();
        addToast(`Offer of ${currency} placed on "${nft.name}"`, 'success');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to place offer';
        addToast(msg, 'error');
        return null;
      }
    },
    [publicKey, evmAddress, solanaSignMessage, evmSignMessage, addToast, invalidateAll]
  );

  return { makeOffer };
}

export function useRespondOffer() {
  const wallet = useWallet();
  const { publicKey, signMessage: solanaSignMessage } = wallet;
  const { address: evmAddress } = useAccount();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const respond = useCallback(
    async (offerId: string, action: 'accept' | 'reject', offerAmount?: number, nft?: NFT | null) => {
      const chain = nft?.chain || 'solana';
      const isPolygon = chain === 'polygon';
      const walletAddress = isPolygon ? evmAddress : publicKey?.toBase58();

      if (!walletAddress) {
        addToast(`Connect ${isPolygon ? 'MetaMask' : 'Solana'} wallet first`, 'error');
        return null;
      }

      try {
        const label = action === 'accept' ? 'Accepting' : 'Rejecting';
        addToast(`${label} offer...`, 'info', undefined, 3000);

        // Get offer details from DB (need escrow_offer_id and buyer address)
        const offerRes = await fetch(`/api/offers?nft_mint=${nft?.mint}&status=active`);
        const offerData = await offerRes.json();
        const currentOffer = (offerData.data || []).find((o: { id: string }) => o.id === offerId);
        const buyerAddress = currentOffer?.bidder;
        const escrowOfferId = currentOffer?.escrow_offer_id;

        if (action === 'accept') {
          if (isPolygon && NEXUS_ESCROW_CONTRACT && escrowOfferId !== undefined && escrowOfferId !== null) {
            // ─── Polygon Escrow: Accept → release POL to seller ───
            addToast('Releasing payment from escrow...', 'info', undefined, 5000);
            await ensurePolygonChain();

            const hash = await writeContract(wagmiConfig, {
              address: NEXUS_ESCROW_CONTRACT as Address,
              abi: NexusEscrowABI,
              functionName: 'acceptOffer',
              args: [BigInt(escrowOfferId)],
              ...ESCROW_GAS,
            });

            await waitForTransactionReceipt(wagmiConfig, { hash });
            addToast('Payment received from escrow!', 'success');
          } else if (!isPolygon) {
            // Solana: sign acceptance message
            if (!solanaSignMessage) throw new Error('Wallet does not support signing');
            const msgText = `NEXUS: Accept offer ${offerId} for ${offerAmount || 0} SOL`;
            const message = new TextEncoder().encode(msgText);
            await solanaSignMessage(message);
          }

          // Transfer NFT on-chain (seller → buyer)
          if (buyerAddress && nft) {
            addToast('Transferring NFT on-chain...', 'info', undefined, 5000);

            if (isPolygon && evmAddress && nft.tokenId) {
              const result = await transferNFTPolygon(evmAddress, buyerAddress, nft.tokenId);
              if (result.txHash !== 'already_transferred') {
                addToast('NFT transferred on-chain!', 'success');
              }
            } else if (!isPolygon && publicKey) {
              await transferNFT({
                wallet,
                mintAddress: nft.mint,
                recipientAddress: buyerAddress,
              });
            }
          }
        } else if (action === 'reject') {
          if (isPolygon && NEXUS_ESCROW_CONTRACT && escrowOfferId !== undefined && escrowOfferId !== null) {
            // ─── Polygon Escrow: Reject → refund POL to buyer ───
            addToast('Refunding buyer from escrow...', 'info', undefined, 5000);
            await ensurePolygonChain();

            const hash = await writeContract(wagmiConfig, {
              address: NEXUS_ESCROW_CONTRACT as Address,
              abi: NexusEscrowABI,
              functionName: 'rejectOffer',
              args: [BigInt(escrowOfferId)],
              ...ESCROW_GAS,
            });

            await waitForTransactionReceipt(wagmiConfig, { hash });
            addToast('Buyer refunded!', 'success');
          }
        }

        // Update offer status in DB
        const res = await fetch(`/api/offers/${offerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to ${action} offer`);
        }

        invalidateAll();
        const msg = action === 'accept'
          ? 'Offer accepted! Payment received & NFT transferred.'
          : 'Offer rejected. Buyer has been refunded.';
        addToast(msg, action === 'accept' ? 'success' : 'info');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Failed to ${action} offer`;
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, publicKey, evmAddress, solanaSignMessage, addToast, invalidateAll]
  );

  return { respond };
}

export function useCancelOffer() {
  const { address: evmAddress } = useAccount();
  const { publicKey, signMessage: solanaSignMessage } = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const cancel = useCallback(
    async (offerId: string, escrowOfferId?: string | null, chain?: string) => {
      const isPolygon = chain === 'polygon';
      const walletAddress = isPolygon ? evmAddress : publicKey?.toBase58();

      if (!walletAddress) {
        addToast(`Connect ${isPolygon ? 'MetaMask' : 'Solana'} wallet first`, 'error');
        return null;
      }

      try {
        addToast('Cancelling offer...', 'info', undefined, 3000);

        if (isPolygon && NEXUS_ESCROW_CONTRACT && escrowOfferId !== undefined && escrowOfferId !== null) {
          // Cancel on escrow contract → refund POL
          await ensurePolygonChain();

          const hash = await writeContract(wagmiConfig, {
            address: NEXUS_ESCROW_CONTRACT as Address,
            abi: NexusEscrowABI,
            functionName: 'cancelOffer',
            args: [BigInt(escrowOfferId)],
            ...ESCROW_GAS,
          });

          await waitForTransactionReceipt(wagmiConfig, { hash });
        }

        // Update DB
        const res = await fetch(`/api/offers/${offerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to cancel offer');
        }

        invalidateAll();
        addToast('Offer cancelled. Funds refunded.', 'success');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to cancel offer';
        addToast(msg, 'error');
        return null;
      }
    },
    [evmAddress, publicKey, solanaSignMessage, addToast, invalidateAll]
  );

  return { cancel };
}
