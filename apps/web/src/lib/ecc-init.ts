import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

// Initialize ECC library for bitcoinjs-lib
try {
  bitcoin.initEccLib(ecc);
} catch (e) {
  // Already initialized, ignore
}

// Export the ECC library for use in other modules
export { ecc };

// Ensure initialization happens at module load time
console.log('ECC Library initialized for bitcoinjs-lib'); 