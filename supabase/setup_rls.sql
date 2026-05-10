-- ================================================================
-- NEXUS NFT Marketplace — Supabase RLS Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================================

-- 1. Enable RLS on all tables (idempotent)
ALTER TABLE IF EXISTS nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Allow public read nfts" ON nfts;
DROP POLICY IF EXISTS "Allow public insert nfts" ON nfts;
DROP POLICY IF EXISTS "Allow public update nfts" ON nfts;

DROP POLICY IF EXISTS "Allow public read auctions" ON auctions;
DROP POLICY IF EXISTS "Allow public insert auctions" ON auctions;
DROP POLICY IF EXISTS "Allow public update auctions" ON auctions;

DROP POLICY IF EXISTS "Allow public read bids" ON bids;
DROP POLICY IF EXISTS "Allow public insert bids" ON bids;

DROP POLICY IF EXISTS "Allow public read listings" ON listings;
DROP POLICY IF EXISTS "Allow public insert listings" ON listings;
DROP POLICY IF EXISTS "Allow public delete listings" ON listings;
DROP POLICY IF EXISTS "Allow public update listings" ON listings;

DROP POLICY IF EXISTS "Allow public read activities" ON activities;
DROP POLICY IF EXISTS "Allow public insert activities" ON activities;

-- 3. Create permissive policies for anon key
-- NFTs: read, insert, update
CREATE POLICY "Allow public read nfts" ON nfts FOR SELECT USING (true);
CREATE POLICY "Allow public insert nfts" ON nfts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update nfts" ON nfts FOR UPDATE USING (true) WITH CHECK (true);

-- Auctions: read, insert, update
CREATE POLICY "Allow public read auctions" ON auctions FOR SELECT USING (true);
CREATE POLICY "Allow public insert auctions" ON auctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update auctions" ON auctions FOR UPDATE USING (true) WITH CHECK (true);

-- Bids: read, insert
CREATE POLICY "Allow public read bids" ON bids FOR SELECT USING (true);
CREATE POLICY "Allow public insert bids" ON bids FOR INSERT WITH CHECK (true);

-- Listings: read, insert, delete, update
CREATE POLICY "Allow public read listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Allow public insert listings" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete listings" ON listings FOR DELETE USING (true);
CREATE POLICY "Allow public update listings" ON listings FOR UPDATE USING (true) WITH CHECK (true);

-- Activities: read, insert
CREATE POLICY "Allow public read activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert activities" ON activities FOR INSERT WITH CHECK (true);

-- ================================================================
-- Verify: after running, try inserting from the app
-- ================================================================
