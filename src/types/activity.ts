import type { ChainId } from '@/types/chain';

export type ActivityType = 'sale' | 'listing' | 'bid' | 'transfer' | 'mint' | 'cancel' | 'auction_created' | 'auction_settled' | 'auction_won' | 'offer' | 'offer_accepted';

export interface Activity {
  id: string;
  type: ActivityType;
  nftMint: string;
  nftName: string;
  nftImage: string;
  from: string;
  to: string;
  price?: number;
  timestamp: string;
  txSignature?: string;
  collection?: string;
  chain?: ChainId;
}
