-- =====================================================
-- Phase 1: New Tables for Make Offer + Favorites
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Offers table
CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_mint TEXT NOT NULL REFERENCES nfts(mint) ON DELETE CASCADE,
  bidder TEXT NOT NULL,
  amount DECIMAL(20,9) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for offers
CREATE INDEX IF NOT EXISTS idx_offers_nft_mint ON offers(nft_mint);
CREATE INDEX IF NOT EXISTS idx_offers_bidder ON offers(bidder);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- 2. Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  user_address TEXT NOT NULL,
  nft_mint TEXT NOT NULL REFERENCES nfts(mint) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_address, nft_mint)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_address);

-- 3. Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (allow all for anon key — same pattern as existing tables)
CREATE POLICY "Allow all operations on offers" ON offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on favorites" ON favorites FOR ALL USING (true) WITH CHECK (true);
