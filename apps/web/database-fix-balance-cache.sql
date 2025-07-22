-- Fix for Balance Cache Constraint Issue
-- This script updates the balance_cache table to support multi-currency 'external' source

-- Step 1: Drop the existing constraint
ALTER TABLE balance_cache DROP CONSTRAINT IF EXISTS balance_cache_source_check;

-- Step 2: Add new constraint that allows 'external', 'blockstream', and 'local'
ALTER TABLE balance_cache ADD CONSTRAINT balance_cache_source_check 
  CHECK (source IN ('external', 'blockstream', 'local'));

-- Step 3: Verify the constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'balance_cache_source_check';

-- Step 4: Show current table structure
\d balance_cache;

SELECT 'Balance cache constraint updated successfully!' as status; 