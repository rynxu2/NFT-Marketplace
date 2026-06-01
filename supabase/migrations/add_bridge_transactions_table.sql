-- Create bridge_transactions table for multi-chain operations
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

-- Indexes for performance filtering
CREATE INDEX IF NOT EXISTS idx_bridge_nft ON bridge_transactions(nft_mint);
CREATE INDEX IF NOT EXISTS idx_bridge_status ON bridge_transactions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE bridge_transactions ENABLE ROW LEVEL SECURITY;

-- Setup policy to allow client/server communication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bridge_transactions' AND policyname = 'Allow all operations on bridge_transactions'
  ) THEN
    CREATE POLICY "Allow all operations on bridge_transactions" ON bridge_transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
