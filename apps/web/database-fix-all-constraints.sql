-- Comprehensive Database Constraint Fix
-- This script fixes all constraint issues for the balance_cache table

-- Step 1: Show current constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'balance_cache'::regclass;

-- Step 2: Drop ALL existing source-related constraints
ALTER TABLE balance_cache DROP CONSTRAINT IF EXISTS balance_cache_source_check;
ALTER TABLE balance_cache DROP CONSTRAINT IF EXISTS check_valid_source;
ALTER TABLE balance_cache DROP CONSTRAINT IF EXISTS balance_cache_source_constraint;

-- Step 3: Add a comprehensive source constraint that allows all needed values
ALTER TABLE balance_cache ADD CONSTRAINT check_valid_source 
  CHECK (source IN ('external', 'blockstream', 'local', 'api'));

-- Step 4: Verify the table structure and constraints
\d balance_cache;

-- Step 5: Clean up any problematic cached entries (optional)
-- DELETE FROM balance_cache WHERE source NOT IN ('external', 'blockstream', 'local', 'api');

-- Step 6: Verification query
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'balance_cache'::regclass
  AND conname LIKE '%source%';

SELECT 'All balance cache constraints fixed successfully!' as status; 