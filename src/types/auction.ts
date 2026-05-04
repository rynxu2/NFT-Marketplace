import type { NFT } from './nft';

export interface Auction {
  id: string;
  nft: NFT;
  seller: string;
  startingPrice: number;
  currentBid: number;
  highestBidder: string | null;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  bids: Bid[];
  minBidIncrement: number;
}

export type AuctionStatus = 'upcoming' | 'active' | 'ended' | 'settled';

export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  amount: number;
  timestamp: string;
}
