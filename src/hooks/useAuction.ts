'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createAuction, placeBid, settleAuction } from '@/lib/solana/auction';
import { apiCreateAuction, apiPlaceBid, apiSettleAuction, apiCreateActivity } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import type { NFT } from '@/types/nft';
import type { Auction } from '@/types/auction';

export function useCreateAuction() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { addAuction } = useMarketplaceStore();

  const create = useCallback(
    async (nft: NFT, startingPrice: number, durationHours: number, minBidIncrement: number) => {
      if (!wallet.publicKey) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      try {
        addToast('Creating auction...', 'info', undefined, 3000);

        const result = await createAuction({
          wallet,
          mintAddress: nft.mint,
          startingPrice,
          durationHours,
          minBidIncrement,
        });

        // Save to database
        await apiCreateAuction({
          nft_mint: nft.mint,
          seller: wallet.publicKey.toBase58(),
          starting_price: startingPrice,
          duration_hours: durationHours,
          min_bid_increment: minBidIncrement,
          nft_name: nft.name,
          nft_image: nft.image,
          tx_signature: result.txSignature,
        }).catch(() => {});

        // Local store for instant UI
        const auction: Auction = {
          id: `auction-${Date.now()}`,
          nft,
          seller: wallet.publicKey.toBase58(),
          startingPrice,
          currentBid: startingPrice,
          highestBidder: null,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + durationHours * 3600000).toISOString(),
          status: 'active',
          bids: [],
          minBidIncrement,
        };
        addAuction(auction);

        addToast(`Auction created for "${nft.name}"`, 'success', result.txSignature);
        return auction;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create auction';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, addAuction]
  );

  return { create };
}

export function usePlaceBid() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { addBid } = useMarketplaceStore();

  const bid = useCallback(
    async (auction: Auction, amount: number) => {
      if (!wallet.publicKey) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      if (amount <= auction.currentBid) {
        addToast(`Bid must be higher than ◎ ${auction.currentBid}`, 'warning');
        return null;
      }

      if (amount < auction.currentBid + auction.minBidIncrement) {
        addToast(`Minimum bid increment is ◎ ${auction.minBidIncrement}`, 'warning');
        return null;
      }

      try {
        addToast(`Placing bid of ◎ ${amount}...`, 'info', undefined, 3000);

        const result = await placeBid({
          wallet,
          auctionId: auction.id,
          amount,
          sellerAddress: auction.seller,
        });

        // Save to database
        await apiPlaceBid(auction.id, {
          bidder: wallet.publicKey.toBase58(),
          amount,
          tx_signature: result.txSignature,
        }).catch(() => {});

        // Local store
        const newBid = {
          id: `bid-${Date.now()}`,
          auctionId: auction.id,
          bidder: wallet.publicKey.toBase58(),
          amount,
          timestamp: new Date().toISOString(),
        };
        addBid(auction.id, newBid);

        addToast(`Bid placed: ◎ ${amount}`, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Bid failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, addBid]
  );

  return { bid };
}

export function useSettleAuction() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { settleAuction: settle } = useMarketplaceStore();

  const settleAuctionFn = useCallback(
    async (auction: Auction) => {
      if (!wallet.publicKey) {
        addToast('Connect wallet first', 'error');
        return null;
      }

      if (!auction.highestBidder) {
        addToast('No bids to settle', 'warning');
        return null;
      }

      try {
        const result = await settleAuction({
          wallet,
          auctionId: auction.id,
          mintAddress: auction.nft.mint,
          winnerAddress: auction.highestBidder,
          finalAmount: auction.currentBid,
        });

        // Update database
        await apiSettleAuction(auction.id, {
          seller: wallet.publicKey.toBase58(),
        }).catch(() => {});

        settle(auction.id);
        addToast(`Auction settled! "${auction.nft.name}" → winner`, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Settlement failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, settle]
  );

  return { settle: settleAuctionFn };
}
