import type { ChainId } from '@/types/chain';

export const MARKETPLACE_NAME = 'NEXUS';
export const MARKETPLACE_DESCRIPTION = 'The Futuristic Multi-Chain NFT Marketplace';
export const SOL_PRICE_USD = 170;
export const POL_PRICE_USD = 0.25;

export function getChainPriceUSD(chain: ChainId): number {
  return chain === 'polygon' ? POL_PRICE_USD : SOL_PRICE_USD;
}

export const CATEGORIES = [
  'All',
  'Art',
  'Photography',
  'Gaming',
  'Music',
  'Collectibles',
  'Utility',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Listed' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
] as const;
