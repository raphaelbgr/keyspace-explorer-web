/**
 * Secure random utilities using Web Crypto API for cryptographically secure randomization
 */

/**
 * Generate a cryptographically secure random integer between min and max (inclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error('min must be less than or equal to max');
  }
  
  const range = max - min + 1;
  
  // Use crypto.getRandomValues for secure random bytes
  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);
  
  // Convert to a value in our range
  const randomValue = randomBytes[0] / (0xffffffff + 1); // Normalize to [0, 1)
  
  return Math.floor(randomValue * range) + min;
}

/**
 * Generate a secure random page number within the Bitcoin keyspace
 */
export function secureRandomPage(maxPages: number = 1000000): bigint {
  // For very large numbers, generate random bytes and convert to BigInt
  const randomBytes = new Uint8Array(32); // 256 bits for good entropy
  crypto.getRandomValues(randomBytes);
  
  // Convert bytes to BigInt
  let randomBigInt = BigInt(0);
  for (let i = 0; i < randomBytes.length; i++) {
    randomBigInt = randomBigInt * BigInt(256) + BigInt(randomBytes[i]);
  }
  
  // Limit to reasonable range to avoid astronomical numbers
  const maxPagesBigInt = BigInt(Math.min(maxPages, 1000000));
  
  return (randomBigInt % maxPagesBigInt) + BigInt(1);
}

/**
 * Generate a secure random key index within the current page
 */
export function secureRandomKeyInPage(keysPerPage: number): number {
  if (keysPerPage <= 0) {
    throw new Error('keysPerPage must be greater than 0');
  }
  
  return secureRandomInt(0, keysPerPage - 1);
}

/**
 * Generate a secure random offset within the current page space
 * This can be used to jump to a random position within the visible keys
 */
export function secureRandomPageOffset(currentPage: number, keysPerPage: number, totalKeysToShow: number): number {
  if (totalKeysToShow <= 0) {
    return 0;
  }
  
  // Generate random offset within the current page display
  return secureRandomInt(0, Math.min(totalKeysToShow - 1, keysPerPage - 1));
}

/**
 * Dice-roll animation effect: Generate multiple random values quickly
 * Returns an array of random values for animation effect
 */
export function diceRollAnimation(min: number, max: number, rolls: number = 5): number[] {
  const results: number[] = [];
  
  for (let i = 0; i < rolls; i++) {
    results.push(secureRandomInt(min, max));
  }
  
  return results;
}

/**
 * Advanced: Generate cryptographically secure random BigInt for very large ranges
 */
export function secureRandomBigInt(max: bigint): bigint {
  if (max <= BigInt(0)) {
    throw new Error('max must be greater than 0');
  }
  
  // Calculate number of bytes needed
  const maxStr = max.toString(16);
  const bytesNeeded = Math.ceil(maxStr.length / 2);
  
  let randomBigInt: bigint;
  do {
    const randomBytes = new Uint8Array(bytesNeeded);
    crypto.getRandomValues(randomBytes);
    
    randomBigInt = BigInt(0);
    for (let i = 0; i < randomBytes.length; i++) {
      randomBigInt = randomBigInt * BigInt(256) + BigInt(randomBytes[i]);
    }
  } while (randomBigInt >= max);
  
  return randomBigInt;
} 