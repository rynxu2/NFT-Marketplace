-- ================================================================
-- NEXUS NFT Marketplace — Collections Table Migration
-- Adds a dedicated collections table and links NFTs via FK
-- ================================================================

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  logo TEXT,                           -- Cloudinary URL (fast UI display)
  banner TEXT,                         -- Cloudinary URL (fast UI display)
  logo_ipfs TEXT,                      -- IPFS URL (decentralized backup)
  banner_ipfs TEXT,                    -- IPFS URL (decentralized backup)
  owner TEXT NOT NULL,                 -- wallet address
  category TEXT DEFAULT 'art',
  theme_color TEXT DEFAULT '#00f0ff',
  social_links JSONB DEFAULT '{}',     -- { twitter, discord, website }
  featured_nfts TEXT[] DEFAULT '{}',   -- array of NFT mint addresses
  is_verified BOOLEAN DEFAULT false,
  chain TEXT DEFAULT 'solana',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add collection FK to nfts table (keep old text fields for backward compat)
ALTER TABLE nfts ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_owner ON collections(owner);
CREATE INDEX IF NOT EXISTS idx_collections_chain ON collections(chain);
CREATE INDEX IF NOT EXISTS idx_collections_category ON collections(category);
CREATE INDEX IF NOT EXISTS idx_nfts_collection_id ON nfts(collection_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collections_updated_at ON collections;
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collections_updated_at();
