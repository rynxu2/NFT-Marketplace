'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useSignMessage } from 'wagmi';
import { createAuction, placeBid, settleAuction } from '@/lib/solana/auction';
import { sendTransaction, waitForTransactionReceipt } from '@wagmi/core';
import { type Address, parseEther, parseGwei } from 'viem';
import { wagmiConfig, polygonAmoy, ensurePolygonChain } from '@/lib/polygon/config';
import { apiCreateAuction, apiPlaceBid, apiSettleAuction, apiUpdateNFT, apiCreateActivity } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import { useChainStore } from '@/store/useChainStore';
import { CHAIN_CONFIGS, formatChainCurrency } from '@/types/chain';
import { getSolanaErrorDetails } from '@/lib/solana/connection';
import type { NFT } from '@/types/nft';
import type { Auction } from '@/types/auction';

export function useCreateAuction() {
  const wallet = useWallet();
  const { address: evmAddress } = useAccount();
  const { signMessageAsync: evmSignMessage } = useSignMessage();
  const { activeChain } = useChainStore();
  const config = CHAIN_CONFIGS[activeChain];
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const create = useCallback(
    async (nft: NFT, startingPrice: number, durationMinutes: number, minBidIncrement: number) => {
      const walletAddress = activeChain === 'polygon' ? evmAddress : wallet.publicKey?.toBase58();
      if (!walletAddress) {
        addToast(`Connect your ${config.name} wallet first`, 'error');
        return null;
      }

      try {
        addToast(`Creating auction on ${config.name}...`, 'info', undefined, 3000);

        let txSignature: string;

        if (activeChain === 'polygon') {
          // Polygon: sign message intent on MetaMask
          const messageText = `NEXUS: Create auction for ${nft.mint} starting at ${startingPrice} POL, duration ${durationMinutes}min`;
          const signature = await evmSignMessage({ message: messageText });
          txSignature = signature;
        } else {
          const result = await createAuction({
            wallet,
            mintAddress: nft.mint,
            startingPrice,
            durationMinutes,
            minBidIncrement,
          });
          txSignature = result.txSignature;
        }

        // Save to database
        try {
          await apiCreateAuction({
            nft_mint: nft.mint,
            seller: walletAddress,
            starting_price: startingPrice,
            duration_minutes: durationMinutes,
            min_bid_increment: minBidIncrement,
            nft_name: nft.name,
            nft_image: nft.image,
            tx_signature: txSignature,
            chain: activeChain,
          });
        } catch (dbErr) {
          console.error('Failed to save auction to database:', dbErr);
          addToast('Auction created but sync failed — may not appear on other devices', 'warning');
        }

        // Invalidate queries → auto re-fetch everywhere
        invalidateAll();

        addToast(`Auction created for "${nft.name}"`, 'success', txSignature);
        return { txSignature };
      } catch (err) {
        const msg = getSolanaErrorDetails(err);
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, evmAddress, evmSignMessage, activeChain, config, addToast, invalidateAll]
  );

  return { create };
}

export function usePlaceBid() {
  const wallet = useWallet();
  const { address: evmAddress } = useAccount();
  const { signMessageAsync: evmSignMessage } = useSignMessage();
  const { addToast } = useToastStore();
  const { invalidateAuctions } = useInvalidateQueries();
  const { activeChain } = useChainStore();

  const bid = useCallback(
    async (auction: Auction, amount: number) => {
      const walletAddress = activeChain === 'polygon' ? evmAddress : wallet.publicKey?.toBase58();
      if (!walletAddress) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      if (amount <= auction.currentBid) {
        addToast(`Bid must be higher than ${formatChainCurrency(auction.currentBid, activeChain)}`, 'warning');
        return null;
      }

      if (amount < auction.currentBid + auction.minBidIncrement) {
        addToast(`Minimum bid increment is ${formatChainCurrency(auction.minBidIncrement, activeChain)}`, 'warning');
        return null;
      }

      try {
        addToast(`Signing bid of ${formatChainCurrency(amount, activeChain)}...`, 'info', undefined, 3000);

        let txSignature: string;

        if (activeChain === 'polygon') {
          // Polygon: sign message on MetaMask
          const messageText = `NEXUS: Bid ${amount} POL on auction ${auction.id} by ${evmAddress}`;
          const signature = await evmSignMessage({ message: messageText });
          txSignature = signature;
        } else {
          // Escrow-lite: only sign message, no SOL transfer
          const result = await placeBid({
            wallet,
            auctionId: auction.id,
            amount,
            sellerAddress: auction.seller,
          });
          txSignature = result.txSignature;
        }

        // Save to database
        try {
          await apiPlaceBid(auction.id, {
            bidder: walletAddress,
            amount,
            tx_signature: txSignature,
          });
        } catch (dbErr) {
          console.error('Failed to save bid to database:', dbErr);
          addToast('Bid signed but sync failed', 'warning');
        }

        invalidateAuctions();

        addToast(`Bid placed: ${formatChainCurrency(amount, activeChain)} (payment on settlement)`, 'success', txSignature);
        return { txSignature };
      } catch (err) {
        const msg = getSolanaErrorDetails(err);
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, evmAddress, evmSignMessage, addToast, invalidateAuctions, activeChain]
  );

  return { bid };
}

export function useSettleAuction() {
  const wallet = useWallet();
  const { address: evmAddress } = useAccount();
  const { activeChain } = useChainStore();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const settleAuctionFn = useCallback(
    async (auction: Auction) => {
      const walletAddress = activeChain === 'polygon' ? evmAddress : wallet.publicKey?.toBase58();
      if (!walletAddress) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      if (!auction.highestBidder) {
        addToast('No bids to settle', 'warning');
        return null;
      }

      const callerAddress = walletAddress;
      const isWinner = callerAddress.toLowerCase() === auction.highestBidder.toLowerCase();

      if (!isWinner) {
        addToast('Only the winner can claim/settle the auction to send the payment on-chain', 'error');
        return null;
      }

      try {
        addToast('Processing payment for auction settlement...', 'info', undefined, 5000);

        let txSignature: string;

        if (activeChain === 'polygon') {
          await ensurePolygonChain();

          // Winner pays POL to the seller directly on-chain
          const hash = await sendTransaction(wagmiConfig, {
            chainId: polygonAmoy.id,
            to: auction.seller as Address,
            value: parseEther(auction.currentBid.toString()),
            maxFeePerGas: parseGwei('30'),
            maxPriorityFeePerGas: parseGwei('26'),
          });
          await waitForTransactionReceipt(wagmiConfig, { hash });
          txSignature = hash;
        } else {
          const result = await settleAuction({
            wallet,
            auctionId: auction.id,
            mintAddress: auction.nft.mint,
            winnerAddress: auction.highestBidder,
            finalAmount: auction.currentBid,
            role: 'winner',
            sellerAddress: auction.seller,
          });
          txSignature = result.txSignature;
        }

        // Update database
        try {
          await apiSettleAuction(auction.id, {
            seller: auction.seller,
            caller: callerAddress,
          });
        } catch (dbErr) {
          console.error('Failed to settle auction in database:', dbErr);
          addToast('Settlement signed but sync failed', 'warning');
        }

        // Update NFT owner
        try {
          await apiUpdateNFT({
            mint: auction.nft.mint,
            owner: auction.highestBidder,
            listed: false,
            price: null,
          });
        } catch (dbErr) {
          console.error('Failed to transfer NFT ownership:', dbErr);
        }

        // Log activity
        try {
          await apiCreateActivity({
            type: 'auction_won',
            nft_mint: auction.nft.mint,
            nft_name: auction.nft.name,
            nft_image: auction.nft.image,
            from_address: auction.seller,
            to_address: auction.highestBidder,
            price: auction.currentBid,
            tx_signature: txSignature,
            chain: auction.nft.chain || 'solana',
          });
        } catch (dbErr) {
          console.error('Failed to log settlement activity:', dbErr);
        }

        // Invalidate all queries → UI updates everywhere
        invalidateAll();

        const message = `Payment sent! "${auction.nft.name}" is now yours`;
        addToast(message, 'success', txSignature);
        return { txSignature };
      } catch (err) {
        const msg = getSolanaErrorDetails(err);
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, evmAddress, activeChain, addToast, invalidateAll]
  );

  return { settle: settleAuctionFn };
}

export function useVoidAuction() {
  const wallet = useWallet();
  const { address: evmAddress } = useAccount();
  const { activeChain } = useChainStore();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const voidAuctionFn = useCallback(
    async (auction: Auction) => {
      const walletAddress = activeChain === 'polygon' ? evmAddress : wallet.publicKey?.toBase58();
      if (!walletAddress) {
        addToast('Connect wallet first', 'error');
        return false;
      }

      if (walletAddress.toLowerCase() !== auction.seller.toLowerCase()) {
        addToast('Only the seller can void this auction', 'error');
        return false;
      }

      try {
        addToast('Voiding auction and reclaiming NFT...', 'info', undefined, 3000);

        const res = await fetch(`/api/auctions/${auction.id}/void`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caller: walletAddress }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to void auction');
        }

        invalidateAll();
        addToast('Auction cancelled and NFT reclaimed!', 'success');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to void auction';
        addToast(msg, 'error');
        return false;
      }
    },
    [wallet, evmAddress, activeChain, addToast, invalidateAll]
  );

  return { voidAuction: voidAuctionFn };
}
