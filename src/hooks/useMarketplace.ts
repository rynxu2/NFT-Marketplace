'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { listNFT, buyNFT, cancelListing } from '@/lib/solana/marketplace';
import { listNFTPolygon, buyNFTPolygon } from '@/lib/polygon/marketplace';
import { apiCreateListing, apiCancelListing, apiCreateActivity, apiUpdateNFT } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import { useChainStore } from '@/store/useChainStore';
import { CHAIN_CONFIGS } from '@/types/chain';
import { getSolanaErrorDetails } from '@/lib/solana/connection';
import type { NFT } from '@/types/nft';
import type { Listing } from '@/store/useMarketplaceStore';

function useActiveWallet() {
  const { activeChain } = useChainStore();
  const solanaWallet = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();

  if (activeChain === 'polygon') {
    return {
      address: evmAddress || null,
      connected: evmConnected,
      chain: 'polygon' as const,
      solanaWallet: null,
    };
  }

  return {
    address: solanaWallet.publicKey?.toBase58() || null,
    connected: solanaWallet.connected,
    chain: 'solana' as const,
    solanaWallet,
  };
}

export function useListNFT() {
  const { activeChain } = useChainStore();
  const wallet = useActiveWallet();
  const solanaWallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();
  const config = CHAIN_CONFIGS[activeChain];

  const list = useCallback(
    async (nft: NFT, price: number) => {
      if (!wallet.address) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      try {
        addToast(`Signing listing on ${config.name}...`, 'info', undefined, 3000);

        let txSignature: string;

        if (activeChain === 'polygon') {
          const result = await listNFTPolygon({
            ownerAddress: wallet.address,
            tokenId: nft.tokenId || '0',
            price,
          });
          txSignature = result.txHash;
        } else {
          const result = await listNFT({
            wallet: solanaWallet,
            mintAddress: nft.mint,
            price,
          });
          txSignature = result.txSignature;
        }

        // Save to database
        try {
          await apiCreateListing({
            mint: nft.mint,
            seller: wallet.address,
            price,
            tx_signature: txSignature,
            nft_name: nft.name,
            nft_image: nft.image,
            chain: activeChain,
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
            from_address: wallet.address,
            price,
            tx_signature: txSignature,
            chain: activeChain,
          });
        } catch (dbErr) {
          console.error('Failed to log listing activity:', dbErr);
        }

        invalidateAll();
        addToast(`Listed "${nft.name}" for ${price} ${config.symbol}`, 'success', txSignature);
        return { txSignature };
      } catch (err) {
        const msg = getSolanaErrorDetails(err);
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, solanaWallet, activeChain, config, addToast, invalidateAll]
  );

  return { list };
}

export function useBuyNFT() {
  const { activeChain } = useChainStore();
  const wallet = useActiveWallet();
  const solanaWallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();
  const config = CHAIN_CONFIGS[activeChain];

  const buy = useCallback(
    async (listing: Listing) => {
      if (!wallet.address) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      if (wallet.address === listing.seller) {
        addToast('You cannot buy your own listing', 'warning');
        return null;
      }

      try {
        addToast(`Processing purchase on ${config.name}...`, 'info', undefined, 3000);

        let txSignature: string;

        if (activeChain === 'polygon') {
          const result = await buyNFTPolygon({
            buyerAddress: wallet.address,
            sellerAddress: listing.seller,
            tokenId: listing.nft.tokenId || '0',
            price: listing.price,
          });
          txSignature = result.txHash;
        } else {
          const result = await buyNFT({
            wallet: solanaWallet,
            mintAddress: listing.mint,
            sellerAddress: listing.seller,
            price: listing.price,
          });
          txSignature = result.txSignature;
        }

        // Update NFT owner in database
        try {
          await apiUpdateNFT({
            mint: listing.mint,
            owner: wallet.address,
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
            to_address: wallet.address,
            price: listing.price,
            tx_signature: txSignature,
            chain: activeChain,
          });
        } catch (dbErr) {
          console.error('Failed to log sale activity:', dbErr);
        }

        invalidateAll();
        addToast(`Purchased "${listing.nft.name}" for ${listing.price} ${config.symbol}!`, 'success', txSignature);
        return { txSignature };
      } catch (err) {
        const msg = getSolanaErrorDetails(err);
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, solanaWallet, activeChain, config, addToast, invalidateAll]
  );

  return { buy };
}

export function useCancelListing() {
  const { activeChain } = useChainStore();
  const wallet = useActiveWallet();
  const solanaWallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const cancel = useCallback(
    async (listing: Listing) => {
      if (!wallet.address) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      try {
        let txSignature: string;

        if (activeChain === 'polygon') {
          // Polygon: no on-chain cancel needed (listing is off-chain)
          txSignature = `cancel_${listing.mint}_${Date.now()}`;
        } else {
          const result = await cancelListing({
            wallet: solanaWallet,
            mintAddress: listing.mint,
          });
          txSignature = result.txSignature;
        }

        // Update database
        try {
          await apiCancelListing(listing.mint);
        } catch (dbErr) {
          console.error('Failed to cancel listing in database:', dbErr);
          addToast('Listing cancelled but sync failed', 'warning');
        }

        invalidateAll();
        addToast(`Cancelled listing for "${listing.nft.name}"`, 'info', txSignature);
        return { txSignature };
      } catch (err) {
        const msg = getSolanaErrorDetails(err);
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, solanaWallet, activeChain, addToast, invalidateAll]
  );

  return { cancel };
}
