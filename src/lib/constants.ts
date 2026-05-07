export const MARKETPLACE_NAME = 'NEXUS';
export const MARKETPLACE_DESCRIPTION = 'The Futuristic NFT Marketplace on Solana';
export const SOL_PRICE_USD = 170;

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
