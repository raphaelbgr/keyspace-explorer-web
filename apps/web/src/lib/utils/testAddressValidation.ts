/**
 * Test script for Bitcoin address validation
 * Run this to verify the validation is working correctly
 */

import { BitcoinAddressValidator } from './addressValidation';

// Test addresses - mix of valid and invalid
const testAddresses = [
  // Valid addresses
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block
  '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // SegWit
  'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0', // Taproot
  
  // Invalid addresses (from the error logs)
  '18084c63a9575eeba458d9d5d2',
  'bc1paa9e22e6488a933969b3',
  '3aa9e22e6488a933969b3309bf',
  'bc1q8084c63a9575eeba458d',
  '38084c63a9575eeba458d9d5d2',
  'bc1p8084c63a9575eeba458d',
  'bc1p17c43b04f13d67923d60',
  
  // More invalid addresses
  'invalid_address',
  '123456789',
  'bc1invalid',
  '1invalid',
  '3invalid',
];

export function testAddressValidation() {
  console.log('=== Bitcoin Address Validation Test ===\n');
  
  const results = BitcoinAddressValidator.validateAddressBatch(testAddresses);
  
  console.log(`Valid addresses (${results.valid.length}):`);
  results.valid.forEach(addr => {
    const type = BitcoinAddressValidator.getAddressType(addr);
    console.log(`  ✓ ${addr} (${type})`);
  });
  
  console.log(`\nInvalid addresses (${results.invalid.length}):`);
  results.invalid.forEach(addr => {
    console.log(`  ✗ ${addr}`);
  });
  
  console.log(`\nIssues found:`);
  results.issues.forEach(issue => {
    console.log(`  - ${issue}`);
  });
  
  console.log(`\nSummary:`);
  console.log(`  Total addresses: ${testAddresses.length}`);
  console.log(`  Valid: ${results.valid.length}`);
  console.log(`  Invalid: ${results.invalid.length}`);
  console.log(`  Success rate: ${((results.valid.length / testAddresses.length) * 100).toFixed(1)}%`);
  
  return results;
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAddressValidation();
} 