import type { NFT } from './nft';

export type OfferStatus = 'active' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface Offer {
  id: string;
  nftMint: string;
  nft: NFT;
  bidder: string;
  amount: number;
  status: OfferStatus;
  expiresAt: string;
  createdAt: string;
}
