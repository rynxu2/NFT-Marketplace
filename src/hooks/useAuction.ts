'use client';

import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createAuction, placeBid, settleAuction } from '@/lib/solana/auction';
import { apiCreateAuction, apiPlaceBid, apiSettleAuction, apiUpdateNFT, apiCreateActivity } from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';
import { useInvalidateQueries } from '@/hooks/useData';
import type { NFT } from '@/types/nft';
import type { Auction } from '@/types/auction';

export function useCreateAuction() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

  const create = useCallback(
    async (nft: NFT, startingPrice: number, durationMinutes: number, minBidIncrement: number) => {
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
          durationMinutes,
          minBidIncrement,
        });

        // Save to database
        try {
          await apiCreateAuction({
            nft_mint: nft.mint,
            seller: wallet.publicKey.toBase58(),
            starting_price: startingPrice,
            duration_minutes: durationMinutes,
            min_bid_increment: minBidIncrement,
            nft_name: nft.name,
            nft_image: nft.image,
            tx_signature: result.txSignature,
          });
        } catch (dbErr) {
          console.error('Failed to save auction to database:', dbErr);
          addToast('Auction created but sync failed — may not appear on other devices', 'warning');
        }

        // Invalidate queries → auto re-fetch everywhere
        invalidateAll();

        addToast(`Auction created for "${nft.name}"`, 'success', result.txSignature);
        return { txSignature: result.txSignature };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create auction';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAll]
  );

  return { create };
}

export function usePlaceBid() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAuctions } = useInvalidateQueries();

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
        addToast(`Signing bid of ◎ ${amount}...`, 'info', undefined, 3000);

        // Escrow-lite: only sign message, no SOL transfer
        const result = await placeBid({
          wallet,
          auctionId: auction.id,
          amount,
          sellerAddress: auction.seller,
        });

        // Save to database
        try {
          await apiPlaceBid(auction.id, {
            bidder: wallet.publicKey.toBase58(),
            amount,
            tx_signature: result.txSignature,
          });
        } catch (dbErr) {
          console.error('Failed to save bid to database:', dbErr);
          addToast('Bid signed but sync failed', 'warning');
        }

        invalidateAuctions();

        addToast(`Bid placed: ◎ ${amount} (payment on settlement)`, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Bid failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAuctions]
  );

  return { bid };
}

export function useSettleAuction() {
  const wallet = useWallet();
  const { addToast } = useToastStore();
  const { invalidateAll } = useInvalidateQueries();

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

      const callerAddress = wallet.publicKey.toBase58();
      const isWinner = callerAddress === auction.highestBidder;
      const isSeller = callerAddress === auction.seller;

      if (!isWinner && !isSeller) {
        addToast('Only the seller or winner can settle this auction', 'error');
        return null;
      }

      try {
        if (isWinner) {
          addToast('Processing payment for auction settlement...', 'info', undefined, 5000);
        } else {
          addToast('Confirming auction settlement...', 'info', undefined, 5000);
        }

        const result = await settleAuction({
          wallet,
          auctionId: auction.id,
          mintAddress: auction.nft.mint,
          winnerAddress: auction.highestBidder,
          finalAmount: auction.currentBid,
          role: isWinner ? 'winner' : 'seller',
          sellerAddress: auction.seller,
        });

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
            tx_signature: result.txSignature,
          });
        } catch (dbErr) {
          console.error('Failed to log settlement activity:', dbErr);
        }

        // Invalidate all queries → UI updates everywhere
        invalidateAll();

        const message = isWinner
          ? `Payment sent! "${auction.nft.name}" is now yours`
          : `Auction settled! "${auction.nft.name}" transferred to winner`;
        addToast(message, 'success', result.txSignature);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Settlement failed';
        addToast(msg, 'error');
        return null;
      }
    },
    [wallet, addToast, invalidateAll]
  );

  return { settle: settleAuctionFn };
}
