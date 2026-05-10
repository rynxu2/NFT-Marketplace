import { create } from 'zustand';
import type { NFT } from '@/types/nft';
import type { Auction, Bid } from '@/types/auction';
import type { Activity } from '@/types/activity';

export interface Listing {
  id: string;
  mint: string;
  seller: string;
  price: number;
  nft: NFT;
  listedAt: string;
  txSignature?: string;
}

/**
 * Minimal client-side state.
 * Supabase is the single source of truth — this store is only used
 * for optimistic UI updates while React Query cache invalidates.
 */
interface MarketplaceState {
  // Lightweight client state (no persist — ephemeral)
  listings: Listing[];
  auctions: Auction[];
  activities: Activity[];
  mintedNFTs: NFT[];

  addListing: (listing: Listing) => void;
  removeListing: (mint: string) => void;
  addAuction: (auction: Auction) => void;
  addBid: (auctionId: string, bid: Bid) => void;
  settleAuction: (auctionId: string, nftMint?: string, winnerAddress?: string) => void;
  addActivity: (activity: Activity) => void;
  addMintedNFT: (nft: NFT) => void;
  updateNFTOwner: (mint: string, newOwner: string) => void;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  (set) => ({
    listings: [],
    auctions: [],
    activities: [],
    mintedNFTs: [],

    addListing: (listing) =>
      set((state) => ({
        listings: [listing, ...state.listings],
      })),

    removeListing: (mint) =>
      set((state) => ({
        listings: state.listings.filter((l) => l.mint !== mint),
      })),

    addAuction: (auction) =>
      set((state) => ({
        auctions: [auction, ...state.auctions],
      })),

    addBid: (auctionId, bid) =>
      set((state) => ({
        auctions: state.auctions.map((a) =>
          a.id === auctionId
            ? {
                ...a,
                currentBid: bid.amount,
                highestBidder: bid.bidder,
                bids: [bid, ...a.bids],
              }
            : a
        ),
      })),

    settleAuction: (auctionId, nftMint, winnerAddress) =>
      set((state) => ({
        auctions: state.auctions.map((a) =>
          a.id === auctionId ? { ...a, status: 'settled' as const } : a
        ),
        mintedNFTs: nftMint && winnerAddress
          ? state.mintedNFTs.map((n) =>
              n.mint === nftMint ? { ...n, owner: winnerAddress, listed: false, price: undefined } : n
            )
          : state.mintedNFTs,
      })),

    addActivity: (activity) =>
      set((state) => ({
        activities: [activity, ...state.activities],
      })),

    addMintedNFT: (nft) =>
      set((state) => ({
        mintedNFTs: [nft, ...state.mintedNFTs],
      })),

    updateNFTOwner: (mint, newOwner) =>
      set((state) => ({
        mintedNFTs: state.mintedNFTs.map((n) =>
          n.mint === mint ? { ...n, owner: newOwner, listed: false, price: undefined } : n
        ),
      })),
  })
);
