-- Multi-chain separation migration
-- Adds `chain` column to all tables for chain-scoped data filtering

-- NFTs: already has chain column from Phase 3, ensure default is set
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS chain text DEFAULT 'solana';
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS token_id text;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS contract_address text;
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS bridge_origin text;

-- Listings: add chain column
ALTER TABLE listings ADD COLUMN IF NOT EXISTS chain text DEFAULT 'solana';

-- Auctions: add chain column
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS chain text DEFAULT 'solana';

-- Activities: add chain column
ALTER TABLE activities ADD COLUMN IF NOT EXISTS chain text DEFAULT 'solana';

-- Indexes for chain-filtered queries
CREATE INDEX IF NOT EXISTS idx_nfts_chain ON nfts(chain);
CREATE INDEX IF NOT EXISTS idx_listings_chain ON listings(chain);
CREATE INDEX IF NOT EXISTS idx_auctions_chain ON auctions(chain);
CREATE INDEX IF NOT EXISTS idx_activities_chain ON activities(chain);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nfts_chain_owner ON nfts(chain, owner);
CREATE INDEX IF NOT EXISTS idx_nfts_chain_listed ON nfts(chain, listed);
CREATE INDEX IF NOT EXISTS idx_activities_chain_type ON activities(chain, type);
