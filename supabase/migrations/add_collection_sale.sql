-- Add collection sale columns
ALTER TABLE collections ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT false;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_price NUMERIC;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_currency TEXT DEFAULT 'SOL';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_tx TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sale_listed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_collections_for_sale ON collections(for_sale) WHERE for_sale = true;
