-- Multi-Currency Enhanced Balance Cache Migration
-- This migration adds support for external API caching across multiple cryptocurrencies

-- 1. Add new columns to balance_cache table
ALTER TABLE balance_cache 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BTC',
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- 2. Create composite index for efficient cache lookups
CREATE INDEX IF NOT EXISTS idx_balance_cache_lookup 
ON balance_cache(currency, address, expires_at);

-- 3. Create index for cache cleanup operations
CREATE INDEX IF NOT EXISTS idx_balance_cache_cleanup 
ON balance_cache(source, expires_at);

-- 4. Create index for currency-specific queries
CREATE INDEX IF NOT EXISTS idx_balance_cache_currency 
ON balance_cache(currency, cached_at);

-- 5. Update existing records to have proper defaults
UPDATE balance_cache 
SET currency = 'BTC', 
    source = 'local',
    cached_at = CURRENT_TIMESTAMP,
    expires_at = CURRENT_TIMESTAMP + INTERVAL '24 hours'
WHERE currency IS NULL OR source IS NULL;

-- 6. Add constraint to ensure valid currency codes
ALTER TABLE balance_cache 
ADD CONSTRAINT check_valid_currency 
CHECK (currency IN ('BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'));

-- 7. Add constraint to ensure valid source types
ALTER TABLE balance_cache 
ADD CONSTRAINT check_valid_source 
CHECK (source IN ('local', 'external'));

-- 8. Create new tables for multi-currency wallet support (for development/testing)
CREATE TABLE IF NOT EXISTS wallets_bch (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets_dash (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets_doge (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets_eth (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets_ltc (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets_xrp (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets_zec (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(20, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create indexes for wallet tables
CREATE INDEX IF NOT EXISTS idx_wallets_bch_address ON wallets_bch(address);
CREATE INDEX IF NOT EXISTS idx_wallets_dash_address ON wallets_dash(address);
CREATE INDEX IF NOT EXISTS idx_wallets_doge_address ON wallets_doge(address);
CREATE INDEX IF NOT EXISTS idx_wallets_eth_address ON wallets_eth(address);
CREATE INDEX IF NOT EXISTS idx_wallets_ltc_address ON wallets_ltc(address);
CREATE INDEX IF NOT EXISTS idx_wallets_xrp_address ON wallets_xrp(address);
CREATE INDEX IF NOT EXISTS idx_wallets_zec_address ON wallets_zec(address);

-- 10. Add some sample test data for development (optional)
-- INSERT INTO wallets_bch (address, balance) VALUES 
-- ('bitcoincash:test123...', 0.001),
-- ('1Test456...', 0.0) ON CONFLICT (address) DO NOTHING;

COMMENT ON TABLE balance_cache IS 'Enhanced cache table supporting multi-currency external API results with TTL';
COMMENT ON COLUMN balance_cache.currency IS 'Cryptocurrency type (BTC, BCH, DASH, DOGE, ETH, LTC, XRP, ZEC)';
COMMENT ON COLUMN balance_cache.source IS 'Data source: local (database) or external (API)';
COMMENT ON COLUMN balance_cache.cached_at IS 'When this balance was cached';
COMMENT ON COLUMN balance_cache.expires_at IS 'When this cache entry expires'; 