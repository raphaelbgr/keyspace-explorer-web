// jest.setup.js
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');

// Patch ECC for bitcoinjs-lib in Jest
bitcoin.initEccLib(ecc);

// Mock crypto for Node.js environment
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

require('@testing-library/jest-dom'); 