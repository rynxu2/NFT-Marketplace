'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { listNFT, buyNFT, cancelListing } from '@/lib/solana/marketplace';
import { apiCreateListing, apiCancelListing, apiCreateActivity, apiUpdateNFT } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import type { NFT } from '@/types/nft';
import type { Listing } from '@/store/useMarketplaceStore';

export function useListNFT() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const list = useCallback(
    async (nft: NFT, price: number) => {
      if (!wallet.publicKey) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      try {
        addToast('Signing listing...', 'info', undefined, 3000);

        const result = await listNFT({
          wallet,
          mintAddress: nft.mint,
          price,
        });

        // Save to database
        try {
          await apiCreateListing({
            mint: nft.mint,
            seller: wallet.publicKey.toBase58(),
            price,
            tx_signature: result.txSignature,
            nft_name: nft.name,
            nft_image: nft.image,
          });
        } catch (dbErr) {
          console.error('Failed to save listing to database:', dbErr);
          addToast('Listing created but sync failed', 'warning');
        }

        // Log activity
        try {
          await apiCreateActivity({
            type: 'listing',
            nft_mint: nft.mint,
            nft_name: nft.name,
            nft_image: nft.image,
            from_address: wallet.publicKey.toBase58(),
            price,
            tx_signature: result.txSignature,
          });
        } catch (dbErr) {
          console.error('Failed to log listing activity:', dbErr);
        }

        invalidateAll();

        addToast(`Listed "${nft.name}" for ◎ ${price}`, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Listing failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAll]
  );

  return { list };
}

export function useBuyNFT() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const buy = useCallback(
    async (listing: Listing) => {
      if (!wallet.publicKey) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      if (wallet.publicKey.toBase58() === listing.seller) {
        addToast('You cannot buy your own listing', 'warning');
        return null;
      }

      const buyerAddress = wallet.publicKey.toBase58();

      try {
        addToast('Processing purchase...', 'info', undefined, 3000);

        const result = await buyNFT({
          wallet,
          mintAddress: listing.mint,
          sellerAddress: listing.seller,
          price: listing.price,
        });

        // Update NFT owner in database
        try {
          await apiUpdateNFT({
            mint: listing.mint,
            owner: buyerAddress,
            listed: false,
            price: null,
          });
        } catch (dbErr) {
          console.error('Failed to update NFT owner:', dbErr);
          addToast('Purchase succeeded but ownership sync failed', 'warning');
        }

        // Deactivate listing
        try {
          await apiCancelListing(listing.mint);
        } catch (dbErr) {
          console.error('Failed to deactivate listing:', dbErr);
        }

        // Log sale activity
        try {
          await apiCreateActivity({
            type: 'sale',
            nft_mint: listing.mint,
            nft_name: listing.nft.name,
            nft_image: listing.nft.image,
            from_address: listing.seller,
            to_address: buyerAddress,
            price: listing.price,
            tx_signature: result.txSignature,
          });
        } catch (dbErr) {
          console.error('Failed to log sale activity:', dbErr);
        }

        invalidateAll();

        addToast(`Purchased "${listing.nft.name}" for ◎ ${listing.price}!`, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Purchase failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAll]
  );

  return { buy };
}

export function useCancelListing() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const cancel = useCallback(
    async (listing: Listing) => {
      if (!wallet.publicKey) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      try {
        const result = await cancelListing({
          wallet,
          mintAddress: listing.mint,
        });

        // Update database
        try {
          await apiCancelListing(listing.mint);
        } catch (dbErr) {
          console.error('Failed to cancel listing in database:', dbErr);
          addToast('Listing cancelled but sync failed', 'warning');
        }

        invalidateAll();
        addToast(`Cancelled listing for "${listing.nft.name}"`, 'info', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cancel failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAll]
  );

  return { cancel };
}
