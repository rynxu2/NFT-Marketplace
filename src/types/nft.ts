export interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  collection?: {
    name: string;
    family?: string;
  };
  properties?: {
    files: { uri: string; type: string }[];
    creators: { address: string; share: number }[];
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

import type { ChainId } from './chain';

export interface NFT {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  owner: string;
  creator: string;
  price?: number;
  listed: boolean;
  collection?: string;
  collectionSlug?: string;
  attributes: NFTAttribute[];
  createdAt: string;
  chain: ChainId;
  tokenId?: string; // ERC-721 token ID (Polygon)
  contractAddress?: string; // ERC-721 contract address (Polygon)
  bridgeOrigin?: ChainId; // original chain if bridged
}

export interface NFTListing {
  mint: string;
  seller: string;
  price: number;
  listedAt: string;
  nft: NFT;
}

export type SortOption = 'price-asc' | 'price-desc' | 'recent' | 'oldest' | 'name-asc' | 'name-desc';

export interface NFTFilter {
  search: string;
  collection: string;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: SortOption;
  category: string;
}
