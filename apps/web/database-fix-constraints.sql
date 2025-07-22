-- Fix database constraints after migration
-- This fixes the constraint violation issue

-- 1. First, update any existing rows that don't match our constraints
UPDATE balance_cache 
SET source = 'local' 
WHERE source IS NULL OR source NOT IN ('local', 'external');

-- 2. Now try to add the constraints again (they might have failed during migration)
DO $$ 
BEGIN
    -- Add check_valid_source constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_source') THEN
        ALTER TABLE balance_cache 
        ADD CONSTRAINT check_valid_source 
        CHECK (source IN ('local', 'external'));
    END IF;
    
    -- Add check_valid_currency constraint if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_valid_currency') THEN
        ALTER TABLE balance_cache 
        ADD CONSTRAINT check_valid_currency 
        CHECK (currency IN ('BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'));
    END IF;
END $$; 