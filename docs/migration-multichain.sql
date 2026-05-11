-- =====================================================
-- Multichain Migration: Solana + Polygon
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add chain columns to nfts table
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS token_id TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS contract_address TEXT;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS bridge_origin TEXT;

-- Index for chain filtering
CREATE INDEX IF NOT EXISTS idx_nfts_chain ON nfts(chain);

-- 2. Add chain to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';

-- 3. Add chain to auctions
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';

-- 4. Add chain to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';

-- 5. Bridge transactions table
CREATE TABLE IF NOT EXISTS bridge_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_mint TEXT NOT NULL,
  source_chain TEXT NOT NULL,
  dest_chain TEXT NOT NULL,
  source_tx TEXT,
  dest_tx TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  initiated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bridge_nft ON bridge_transactions(nft_mint);
CREATE INDEX IF NOT EXISTS idx_bridge_status ON bridge_transactions(status);

-- 6. RLS for bridge_transactions
ALTER TABLE bridge_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on bridge_transactions" ON bridge_transactions FOR ALL USING (true) WITH CHECK (true);

-- 7. Add 'bridge' to activity types (if using enum constraint)
-- Note: Our activities table uses TEXT, so no constraint change needed
