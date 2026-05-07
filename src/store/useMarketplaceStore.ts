import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

interface MarketplaceState {
  listings: Listing[];
  auctions: Auction[];
  activities: Activity[];
  mintedNFTs: NFT[];

  addListing: (listing: Listing) => void;
  removeListing: (mint: string) => void;
  addAuction: (auction: Auction) => void;
  addBid: (auctionId: string, bid: Bid) => void;
  settleAuction: (auctionId: string) => void;
  addActivity: (activity: Activity) => void;
  addMintedNFT: (nft: NFT) => void;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
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

      settleAuction: (auctionId) =>
        set((state) => ({
          auctions: state.auctions.map((a) =>
            a.id === auctionId ? { ...a, status: 'settled' as const } : a
          ),
        })),

      addActivity: (activity) =>
        set((state) => ({
          activities: [activity, ...state.activities],
        })),

      addMintedNFT: (nft) =>
        set((state) => ({
          mintedNFTs: [nft, ...state.mintedNFTs],
        })),
    }),
    {
      name: 'nexus-marketplace',
      partialize: (state) => ({
        listings: state.listings,
        auctions: state.auctions,
        activities: state.activities,
        mintedNFTs: state.mintedNFTs,
      }),
    }
  )
);
