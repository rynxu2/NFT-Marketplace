export interface Collection {
  slug: string;
  name: string;
  description: string;
  image: string;
  banner: string;
  creator: string;
  verified: boolean;
  stats: CollectionStats;
  category: string;
}

export interface CollectionStats {
  floorPrice: number;
  totalVolume: number;
  owners: number;
  items: number;
  listed: number;
}
