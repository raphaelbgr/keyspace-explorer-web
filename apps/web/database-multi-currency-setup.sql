-- Multi-Currency Database Setup for Bitcoin Keyspace Explorer
-- This script creates tables for all 8 supported cryptocurrencies
-- Run this before using multi-currency features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CRYPTOCURRENCY WALLET TABLES
-- ==========================================

-- Bitcoin Cash (BCH) wallet table
CREATE TABLE IF NOT EXISTS wallets_bch (
    id SERIAL PRIMARY KEY,
    address VARCHAR(100) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_type VARCHAR(50), -- p2pkh_compressed, p2pkh_uncompressed, cashaddr_compressed, cashaddr_uncompressed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dash (DASH) wallet table
CREATE TABLE IF NOT EXISTS wallets_dash (
    id SERIAL PRIMARY KEY,
    address VARCHAR(100) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_type VARCHAR(50), -- p2pkh_compressed, p2pkh_uncompressed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dogecoin (DOGE) wallet table
CREATE TABLE IF NOT EXISTS wallets_doge (
    id SERIAL PRIMARY KEY,
    address VARCHAR(100) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_type VARCHAR(50), -- p2pkh_compressed, p2pkh_uncompressed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ethereum (ETH) wallet table
CREATE TABLE IF NOT EXISTS wallets_eth (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_type VARCHAR(50) DEFAULT 'standard', -- standard (only one type for ETH)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Litecoin (LTC) wallet table
CREATE TABLE IF NOT EXISTS wallets_ltc (
    id SERIAL PRIMARY KEY,
    address VARCHAR(100) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_type VARCHAR(50), -- p2pkh_compressed, p2pkh_uncompressed, p2wpkh, p2sh_p2wpkh
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ripple (XRP) wallet table
CREATE TABLE IF NOT EXISTS wallets_xrp (
    id SERIAL PRIMARY KEY,
    address VARCHAR(50) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_type VARCHAR(50) DEFAULT 'standard', -- standard (only one type for XRP)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zcash (ZEC) wallet table
CREATE TABLE IF NOT EXISTS wallets_zec (
    id SERIAL PRIMARY KEY,
    address VARCHAR(100) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    tx_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    address_type VARCHAR(50), -- p2pkh_compressed, p2pkh_uncompressed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ENHANCED BALANCE CACHE TABLE
-- ==========================================

-- Drop existing balance_cache if it exists to recreate with proper constraints
DROP TABLE IF EXISTS balance_cache;

-- Enhanced balance cache table for multi-currency support
CREATE TABLE balance_cache (
    id SERIAL PRIMARY KEY,
    address VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    balance VARCHAR(50) DEFAULT '0',
    source VARCHAR(20) DEFAULT 'external', -- 'local', 'external'
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint on address (no currency constraint for maximum flexibility)
    CONSTRAINT unique_address_cache UNIQUE (address)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Bitcoin Cash indexes
CREATE INDEX IF NOT EXISTS idx_wallets_bch_address ON wallets_bch(address);
CREATE INDEX IF NOT EXISTS idx_wallets_bch_balance ON wallets_bch(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_wallets_bch_type ON wallets_bch(address_type);

-- Dash indexes
CREATE INDEX IF NOT EXISTS idx_wallets_dash_address ON wallets_dash(address);
CREATE INDEX IF NOT EXISTS idx_wallets_dash_balance ON wallets_dash(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_wallets_dash_type ON wallets_dash(address_type);

-- Dogecoin indexes
CREATE INDEX IF NOT EXISTS idx_wallets_doge_address ON wallets_doge(address);
CREATE INDEX IF NOT EXISTS idx_wallets_doge_balance ON wallets_doge(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_wallets_doge_type ON wallets_doge(address_type);

-- Ethereum indexes
CREATE INDEX IF NOT EXISTS idx_wallets_eth_address ON wallets_eth(address);
CREATE INDEX IF NOT EXISTS idx_wallets_eth_balance ON wallets_eth(balance) WHERE balance > 0;

-- Litecoin indexes
CREATE INDEX IF NOT EXISTS idx_wallets_ltc_address ON wallets_ltc(address);
CREATE INDEX IF NOT EXISTS idx_wallets_ltc_balance ON wallets_ltc(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_wallets_ltc_type ON wallets_ltc(address_type);

-- Ripple indexes
CREATE INDEX IF NOT EXISTS idx_wallets_xrp_address ON wallets_xrp(address);
CREATE INDEX IF NOT EXISTS idx_wallets_xrp_balance ON wallets_xrp(balance) WHERE balance > 0;

-- Zcash indexes
CREATE INDEX IF NOT EXISTS idx_wallets_zec_address ON wallets_zec(address);
CREATE INDEX IF NOT EXISTS idx_wallets_zec_balance ON wallets_zec(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_wallets_zec_type ON wallets_zec(address_type);

-- Balance cache indexes
CREATE INDEX IF NOT EXISTS idx_balance_cache_address ON balance_cache(address);
CREATE INDEX IF NOT EXISTS idx_balance_cache_currency ON balance_cache(currency);
CREATE INDEX IF NOT EXISTS idx_balance_cache_expires ON balance_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_balance_cache_source ON balance_cache(source);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_balance_cache_updated_at BEFORE UPDATE ON balance_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SAMPLE DATA AND VERIFICATION
-- ==========================================

-- Insert some sample data for testing (optional)
-- INSERT INTO wallets_bch (address, balance, address_type) VALUES 
--   ('bitcoincash:qr7fzmep8g7h7ymfxy74lgc0v950j3r2959lhtxxsl', 100000000, 'cashaddr_compressed'),
--   ('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 5000000000, 'p2pkh_compressed');

-- INSERT INTO wallets_eth (address, balance) VALUES 
--   ('0x742d35Cc6634C0532925a3b8D6Ac9E1d1337f96e', 1000000000000000000);

-- Verification queries
SELECT 'Bitcoin Cash' as currency, COUNT(*) as wallet_count FROM wallets_bch
UNION ALL
SELECT 'Dash' as currency, COUNT(*) as wallet_count FROM wallets_dash
UNION ALL
SELECT 'Dogecoin' as currency, COUNT(*) as wallet_count FROM wallets_doge
UNION ALL
SELECT 'Ethereum' as currency, COUNT(*) as wallet_count FROM wallets_eth
UNION ALL
SELECT 'Litecoin' as currency, COUNT(*) as wallet_count FROM wallets_ltc
UNION ALL
SELECT 'Ripple' as currency, COUNT(*) as wallet_count FROM wallets_xrp
UNION ALL
SELECT 'Zcash' as currency, COUNT(*) as wallet_count FROM wallets_zec;

-- Show balance cache info
SELECT 
    COUNT(*) as total_cached_addresses,
    COUNT(DISTINCT currency) as currencies_cached,
    AVG(EXTRACT(EPOCH FROM (expires_at - cached_at))) as avg_ttl_seconds
FROM balance_cache;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

SELECT 'Multi-currency database setup completed successfully!' as status,
       'All 7 cryptocurrency wallet tables created' as wallets_status,
       'Enhanced balance cache table with proper constraints' as cache_status,
       'Performance indexes added for all tables' as index_status; 