/**
 * Test script for Address Format Detection
 * Tests the new optimized address format detection with real examples
 */

import { AddressFormatDetector } from './addressFormatDetector';

// Test addresses from the user's scanner payload
const testAddresses = [
  // Bitcoin addresses
  "14MpDdi8Ugbp9xeqjQQRJkpVeZ4izyZDEV",  // BTC Legacy
  "1ApBv4QqkpM3AujbTFHDck2yw7v2XzGGHi",  // BTC Legacy
  "bc1qynvpet002fdddcdk95smgz74v3pf6r7v0at8m3", // BTC SegWit
  "33592k4NbJNsuMBpDsAwWfrMD8wYpW5yMb",  // BTC P2SH
  "bc1psawjn3anfca8ye2tqd4av2laegjhtyn4qkyp2zkq8qfzj2ne23yq7y5unu", // BTC Taproot
  
  // Bitcoin Cash addresses
  "bitcoincash:qqjds89daaf944hpkckjrdqt64jy98g0esf08yvjjq", // BCH CashAddr
  "bitcoincash:qp46tjepsnhhsenlkym0g2403s3sacks9yph0cxvum", // BCH CashAddr
  
  // Dash addresses
  "Xe3f3tN2SPpQJuFRbHieAHWHUteR11nqpc", // DASH
  "XkW2kK4jiXZdKrLBK8bSUGimmTViXcoVxc", // DASH
  
  // Dogecoin addresses
  "D8Vuktemn6W6gxqSTzPyrWz6Xgo2GSWKKd", // DOGE
  "DExHTKMV4EFKhuvCBqGnAWCapFeKq1hHxF", // DOGE
  
  // Ethereum address
  "0x6ac006155d3917f334046293a3de4f4fa64a33de", // ETH
  
  // Litecoin addresses
  "LNamUr1xZLqsQmLzuYPiamtFrmS15k4X45", // LTC Legacy
  "LV39BGifqUb6RiRkdPGWtm6k9LHJdALsth", // LTC Legacy
  "ltc1qc49eade5d6fec23d15f693b4ebb0ffce40b84f", // LTC SegWit
  "M9HHLdULYREJhrTiKkAHLK6kXqXzmNqJmL", // LTC P2SH
  
  // Ripple address
  "rhMFDd537gbF9xeqjQQRJkFVeZh5zyZDNV", // XRP
  
  // Zcash addresses
  "t1MERDy8GT1PQkbhjfqDYSZvQuDFojvqxxa", // ZEC
  "t1TgnvPpyj98dmYnVPg6LkZ8uBn77Gp6BLv", // ZEC
];

export function testAddressFormatDetection() {
  console.log('🔍 === Address Format Detection Test ===\n');
  
  // Test individual address detection
  console.log('📝 Individual Address Detection:');
  testAddresses.forEach((address, index) => {
    const result = AddressFormatDetector.detectFormat(address);
    const currencies = result.detectedCurrencies.join(', ');
    const confidenceIcon = result.confidence === 'high' ? '✅' : result.confidence === 'medium' ? '⚠️' : '❌';
    
    console.log(`${index + 1}. ${address}`);
    console.log(`   ${confidenceIcon} Detected: ${currencies || 'NONE'} (${result.confidence} confidence)`);
    if (result.warnings && result.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${result.warnings.join(', ')}`);
    }
    console.log('');
  });
  
  // Test optimization analysis
  console.log('🚀 Optimization Analysis:');
  const optimization = AddressFormatDetector.getOptimizedCurrencyList(testAddresses);
  console.log(`Total addresses: ${optimization.optimizationStats.totalAddresses}`);
  console.log(`Total possible queries (old method): ${optimization.optimizationStats.totalPossibleQueries}`);
  console.log(`Optimized queries (new method): ${optimization.optimizationStats.optimizedQueries}`);
  console.log(`Database query savings: ${optimization.optimizationStats.savings}`);
  console.log('');
  
  // Show currency breakdown
  console.log('📊 Currency Breakdown:');
  Object.entries(optimization.currencyToAddresses).forEach(([currency, addressList]) => {
    if (addressList.length > 0) {
      console.log(`${currency}: ${addressList.length} addresses`);
      addressList.slice(0, 3).forEach(addr => console.log(`  - ${addr.slice(0, 30)}...`));
      if (addressList.length > 3) {
        console.log(`  - ... and ${addressList.length - 3} more`);
      }
    }
  });
  console.log('');
  
  // Test batch analysis
  console.log('📈 Batch Analysis Summary:');
  const analysis = AddressFormatDetector.analyzeAddresses(testAddresses);
  
  Object.entries(analysis.summary).forEach(([currency, count]) => {
    if (count > 0) {
      console.log(`${currency}: ${count} address(es)`);
    }
  });
  
  if (analysis.undetected.length > 0) {
    console.log(`\n❌ Undetected addresses: ${analysis.undetected.length}`);
    analysis.undetected.forEach(addr => console.log(`  - ${addr}`));
  }
  
  if (analysis.multipleMatches.length > 0) {
    console.log(`\n🔄 Addresses matching multiple currencies: ${analysis.multipleMatches.length}`);
    analysis.multipleMatches.forEach(match => {
      console.log(`  - ${match.address}: ${match.currencies.join(', ')}`);
    });
  }
  
  console.log('\n✅ Address format detection test completed!');
  return {
    optimization,
    analysis,
    testResults: testAddresses.map(addr => AddressFormatDetector.detectFormat(addr))
  };
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAddressFormatDetection();
} 