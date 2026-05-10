-- ================================================================
-- NEXUS NFT Marketplace — Create Tables
-- Run this FIRST if tables don't exist yet
-- ================================================================

-- NFTs
CREATE TABLE IF NOT EXISTS nfts (
  mint TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT DEFAULT 'CYBER',
  description TEXT DEFAULT '',
  image TEXT NOT NULL,
  owner TEXT NOT NULL,
  creator TEXT NOT NULL,
  price NUMERIC,
  listed BOOLEAN DEFAULT false,
  collection TEXT,
  collection_slug TEXT,
  attributes JSONB DEFAULT '[]',
  metadata_uri TEXT,
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auctions
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_mint TEXT NOT NULL REFERENCES nfts(mint),
  seller TEXT NOT NULL,
  starting_price NUMERIC NOT NULL,
  current_bid NUMERIC,
  highest_bidder TEXT,
  min_bid_increment NUMERIC DEFAULT 0.5,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id),
  bidder TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint TEXT NOT NULL,
  seller TEXT NOT NULL,
  price NUMERIC NOT NULL,
  active BOOLEAN DEFAULT true,
  tx_signature TEXT,
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  nft_mint TEXT,
  nft_name TEXT,
  nft_image TEXT,
  from_address TEXT,
  to_address TEXT,
  price NUMERIC,
  tx_signature TEXT,
  collection TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner);
CREATE INDEX IF NOT EXISTS idx_nfts_creator ON nfts(creator);
CREATE INDEX IF NOT EXISTS idx_nfts_collection ON nfts(collection);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_nft_mint ON auctions(nft_mint);
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_listings_mint ON listings(mint);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_nft_mint ON activities(nft_mint);
