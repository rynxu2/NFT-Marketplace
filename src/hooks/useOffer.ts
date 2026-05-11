'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import type { NFT } from '@/types/nft';

export function useMakeOffer() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const makeOffer = useCallback(
    async (nft: NFT, amount: number) => {
      if (!wallet.publicKey || !wallet.signMessage) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      if (amount <= 0) {
        addToast('Offer amount must be greater than 0', 'warning');
        return null;
      }

      try {
        addToast('Signing offer...', 'info', undefined, 3000);

        const message = new TextEncoder().encode(
          `NEXUS: Offer ${amount} SOL for ${nft.mint}`
        );
        await wallet.signMessage(message);

        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nft_mint: nft.mint,
            bidder: wallet.publicKey.toBase58(),
            amount,
            nft_name: nft.name,
            nft_image: nft.image,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create offer');
        }

        invalidateAll();
        addToast(`Offer of ◎ ${amount} placed on "${nft.name}"`, 'success');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to place offer';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAll]
  );

  return { makeOffer };
}

export function useRespondOffer() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const respond = useCallback(
    async (offerId: string, action: 'accept' | 'reject', offerAmount?: number) => {
      if (!wallet.publicKey || !wallet.signMessage) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      try {
        const label = action === 'accept' ? 'Accepting' : 'Rejecting';
        addToast(`${label} offer...`, 'info', undefined, 3000);

        if (action === 'accept') {
          const message = new TextEncoder().encode(
            `NEXUS: Accept offer ${offerId} for ${offerAmount || 0} SOL`
          );
          await wallet.signMessage(message);
        }

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
          ? 'Offer accepted! NFT transferred.'
          : 'Offer rejected.';
        addToast(msg, action === 'accept' ? 'success' : 'info');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : `Failed to ${action} offer`;
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAll]
  );

  return { respond };
}
