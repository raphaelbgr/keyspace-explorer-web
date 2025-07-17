const MAX_PRIVATE_KEY = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140';
const MAX_PRIVATE_KEY_DECIMAL = BigInt('0x' + MAX_PRIVATE_KEY);
const KEYS_PER_PAGE = 45;
const LAST_PAGE = MAX_PRIVATE_KEY_DECIMAL / BigInt(KEYS_PER_PAGE);
const REMAINDER = MAX_PRIVATE_KEY_DECIMAL % BigInt(KEYS_PER_PAGE);

console.log('Max private key:', MAX_PRIVATE_KEY);
console.log('Last page:', LAST_PAGE.toString());
console.log('Remainder:', REMAINDER.toString());
console.log('Last key on last page:', (LAST_PAGE * BigInt(KEYS_PER_PAGE) + REMAINDER).toString(16).padStart(64, '0'));

// Verify the calculation
const calculatedMax = (LAST_PAGE * BigInt(KEYS_PER_PAGE)) + REMAINDER;
console.log('Calculated max matches:', calculatedMax === MAX_PRIVATE_KEY_DECIMAL); 