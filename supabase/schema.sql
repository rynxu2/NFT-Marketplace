-- NEXUS NFT Marketplace Database Schema
-- Run this SQL in Supabase Dashboard → SQL Editor

-- NFTs minted through the marketplace
CREATE TABLE IF NOT EXISTS nfts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mint TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT DEFAULT 'CYBER',
  description TEXT,
  image TEXT NOT NULL,
  owner TEXT NOT NULL,
  creator TEXT NOT NULL,
  collection TEXT,
  collection_slug TEXT,
  attributes JSONB DEFAULT '[]',
  metadata_uri TEXT,
  tx_signature TEXT,
  listed BOOLEAN DEFAULT false,
  price DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Active marketplace listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mint TEXT NOT NULL,
  seller TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  tx_signature TEXT,
  active BOOLEAN DEFAULT true,
  listed_at TIMESTAMPTZ DEFAULT now()
);

-- Auctions
CREATE TABLE IF NOT EXISTS auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_mint TEXT NOT NULL,
  seller TEXT NOT NULL,
  starting_price DOUBLE PRECISION NOT NULL,
  current_bid DOUBLE PRECISION,
  highest_bidder TEXT,
  min_bid_increment DOUBLE PRECISION DEFAULT 0.5,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'settled')),
  tx_signature TEXT
);

-- Auction bids
CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  bidder TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  nft_mint TEXT,
  nft_name TEXT,
  nft_image TEXT,
  from_address TEXT,
  to_address TEXT,
  price DOUBLE PRECISION,
  tx_signature TEXT,
  collection TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner);
CREATE INDEX IF NOT EXISTS idx_nfts_creator ON nfts(creator);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
