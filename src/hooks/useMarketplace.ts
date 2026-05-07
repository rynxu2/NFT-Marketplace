'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { listNFT, buyNFT, cancelListing } from '@/lib/solana/marketplace';
import { apiCreateListing, apiCancelListing, apiCreateActivity, apiUpdateNFT } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useMarketplaceStore, type Listing } from '@/store/useMarketplaceStore';
import type { NFT } from '@/types/nft';

export function useListNFT() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { addListing } = useMarketplaceStore();

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
        await apiCreateListing({
          mint: nft.mint,
          seller: wallet.publicKey.toBase58(),
          price,
          tx_signature: result.txSignature,
          nft_name: nft.name,
          nft_image: nft.image,
        }).catch(() => {});

        // Local store for instant UI
        const listing: Listing = {
          id: `listing-${Date.now()}`,
          mint: nft.mint,
          seller: wallet.publicKey.toBase58(),
          price,
          nft: { ...nft, listed: true, price },
          listedAt: new Date().toISOString(),
          txSignature: result.txSignature,
        };
        addListing(listing);

        addToast(`Listed "${nft.name}" for ◎ ${price}`, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Listing failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, addListing]
  );

  return { list };
}

export function useBuyNFT() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { removeListing, updateNFTOwner } = useMarketplaceStore();

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
        await apiUpdateNFT({
          mint: listing.mint,
          owner: buyerAddress,
          listed: false,
          price: null,
        }).catch(() => {});

        // Deactivate listing in database
        await apiCancelListing(listing.mint).catch(() => {});

        // Log sale activity
        await apiCreateActivity({
          type: 'sale',
          nft_mint: listing.mint,
          nft_name: listing.nft.name,
          nft_image: listing.nft.image,
          from_address: listing.seller,
          to_address: buyerAddress,
          price: listing.price,
          tx_signature: result.txSignature,
        }).catch(() => {});

        // Update local store for instant UI
        removeListing(listing.mint);
        updateNFTOwner(listing.mint, buyerAddress);

        addToast(`Purchased "${listing.nft.name}" for ◎ ${listing.price}!`, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Purchase failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, removeListing, updateNFTOwner]
  );

  return { buy };
}

export function useCancelListing() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { removeListing } = useMarketplaceStore();

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
        await apiCancelListing(listing.mint).catch(() => {});

        removeListing(listing.mint);
        addToast(`Cancelled listing for "${listing.nft.name}"`, 'info', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Cancel failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, removeListing]
  );

  return { cancel };
}
