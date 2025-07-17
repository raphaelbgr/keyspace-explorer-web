// Test calculations for Bitcoin keyspace
// Maximum valid Bitcoin private key: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140
// This is the largest valid private key (order of the secp256k1 curve minus 1)

const MAX_PRIVATE_KEY = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140";
const MAX_PRIVATE_KEY_DECIMAL = BigInt("0x" + MAX_PRIVATE_KEY);

console.log("Maximum Bitcoin Private Key (hex):", MAX_PRIVATE_KEY);
console.log("Maximum Bitcoin Private Key (decimal):", MAX_PRIVATE_KEY_DECIMAL.toString());

// Calculate last page for 45 items per page
const KEYS_PER_PAGE = 45;
const LAST_PAGE = MAX_PRIVATE_KEY_DECIMAL / BigInt(KEYS_PER_PAGE);
const REMAINDER = MAX_PRIVATE_KEY_DECIMAL % BigInt(KEYS_PER_PAGE);

console.log("Keys per page:", KEYS_PER_PAGE);
console.log("Last page number:", LAST_PAGE.toString());
console.log("Remainder keys on last page:", REMAINDER.toString());

// Verify the calculation
const CALCULATED_MAX_KEY = (LAST_PAGE * BigInt(KEYS_PER_PAGE)) + REMAINDER;
console.log("Calculated max key:", CALCULATED_MAX_KEY.toString());
console.log("Matches original:", CALCULATED_MAX_KEY === MAX_PRIVATE_KEY_DECIMAL);

// Expected values:
// Last page: 2573157538607026564968244111304175730063056983979442319613448069811514699875
// Last private key: FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140
// Compressed address: 1GrLCmVQXoyJXaPJQdqssNqwxvha1eUo2E
// Uncompressed address: 1JPbzbsAx1HyaDQoLMapWGoqf9pD5uha5m

export { MAX_PRIVATE_KEY, MAX_PRIVATE_KEY_DECIMAL, LAST_PAGE, KEYS_PER_PAGE }; 