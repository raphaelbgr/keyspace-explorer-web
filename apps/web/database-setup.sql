-- Bitcoin Keyspace Explorer Database Setup
-- Run this script in your PostgreSQL database

-- Balance Cache Table
CREATE TABLE IF NOT EXISTS balance_cache (
    address VARCHAR(64) PRIMARY KEY,
    balance DECIMAL(16,8) NOT NULL DEFAULT 0,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) NOT NULL CHECK (source IN ('blockstream', 'local')),
    CONSTRAINT valid_balance CHECK (balance >= 0)
);

-- Index for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_balance_cache_cached_at ON balance_cache(cached_at);
CREATE INDEX IF NOT EXISTS idx_balance_cache_source ON balance_cache(source);

-- Local Testing Data Table (for development)
CREATE TABLE IF NOT EXISTS wallets_btc (
    address VARCHAR(64) PRIMARY KEY,
    balance BIGINT NOT NULL DEFAULT 0, -- Balance in satoshis
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample test data (for development only - these are not real funded addresses)
-- Note: These are test addresses for development. The balances are not real.
-- Comment out or remove these for production use with real balance checking.
INSERT INTO wallets_btc (address, balance) VALUES
('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0), -- Genesis block (kept as historical reference)
('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 1500000000), -- TEST: 15 BTC (fake address for demo)
('1PVKVy52dSyqULe5tPpbwA3tYWGYEhhQGw', 250000000) -- TEST: 2.5 BTC (fake address for demo)
ON CONFLICT (address) DO NOTHING;

-- Remove the real addresses that should not have fake balances:
-- DELETE FROM wallets_btc WHERE address IN ('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy');

-- Scan Session Tracking (optional persistence)
CREATE TABLE IF NOT EXISTS scan_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('random', 'next', 'previous')),
    start_page NUMERIC(78,0) NOT NULL, -- BigInt support
    current_page NUMERIC(78,0) NOT NULL,
    pages_scanned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    found_funds BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Index for active session queries
CREATE INDEX IF NOT EXISTS idx_scan_sessions_active ON scan_sessions(is_active) WHERE is_active = true; 