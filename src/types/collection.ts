import type { ChainId } from './chain';

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  logo: string | null;
  logoIpfs: string | null;
  banner: string | null;
  bannerIpfs: string | null;
  creator: string;
  owner: string;
  verified: boolean;
  isVerified?: boolean;
  stats: CollectionStats;
  category: CollectionCategory | string;
  chain: ChainId;
  themeColor: string;
  theme_color?: string;
  socialLinks: SocialLinks;
  social_links?: SocialLinks;
  featuredNfts: string[];
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  forSale: boolean;
  salePrice: number | null;
  saleCurrency: string;
  saleTx: string | null;
  saleListedAt: string | null;
}

export interface CollectionStats {
  floorPrice: number;
  totalVolume: number;
  owners: number;
  items: number;
  listed: number;
}

export interface SocialLinks {
  twitter?: string;
  discord?: string;
  website?: string;
}

export type CollectionSocialLinks = SocialLinks;

export type CollectionCategory =
  | 'art'
  | 'gaming'
  | 'music'
  | 'photography'
  | 'generative'
  | 'collectibles'
  | 'utility'
  | 'other';

export const COLLECTION_CATEGORIES: { value: CollectionCategory; label: string }[] = [
  { value: 'art', label: 'Art' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'photography', label: 'Photography' },
  { value: 'generative', label: 'Generative' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'utility', label: 'Utility' },
  { value: 'other', label: 'Other' },
];
