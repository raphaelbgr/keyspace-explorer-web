// Quick test for address format detection
const testAddress = "t1YYmhcVCZit1v5kvp3kb7aS6i8Kt8rV2VG";

// Simulate the detection logic
function detectFormat(address) {
  const trimmedAddress = address.trim();
  const detectedCurrencies = [];

  // Zcash (ZEC) - Transparent addresses (start with t1 or t3)
  if (/^t1[A-HJ-NP-Za-km-z1-9]{30,35}$/.test(trimmedAddress) || /^t3[A-HJ-NP-Za-km-z1-9]{30,35}$/.test(trimmedAddress)) {
    detectedCurrencies.push('ZEC');
  }

  return detectedCurrencies;
}

console.log(`Address: ${testAddress}`);
console.log(`Length: ${testAddress.length} (should be 35)`);
console.log(`Detected currencies: ${detectFormat(testAddress).join(', ')}`);
console.log(`Expected: ZEC only`);

// Test regex parts
const afterT1 = testAddress.substring(2);
console.log(`After t1: "${afterT1}" (length: ${afterT1.length})`);
console.log(`Regex test: ${/^t1[A-HJ-NP-Za-km-z1-9]{30,35}$/.test(testAddress)}`); 