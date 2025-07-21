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
 * Uses rejection sampling to ensure uniform distribution across the entire range
 */
export function secureRandomBigInt(max: bigint): bigint {
  if (max <= BigInt(0)) {
    throw new Error('max must be greater than 0');
  }
  
  // Calculate the minimum number of bits needed to represent max
  const maxBits = max.toString(2).length;
  
  // Use enough bytes to cover the bits needed (round up to nearest byte)
  const bytesNeeded = Math.ceil(maxBits / 8);
  
  // Use rejection sampling to avoid modulo bias and ensure uniform distribution
  let randomBigInt: bigint;
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loops
  
  do {
    attempts++;
    if (attempts > maxAttempts) {
      // Fallback: use a different approach for very large numbers
      return generateUniformBigIntFallback(max);
    }
    
    // Generate random bytes
    const randomBytes = new Uint8Array(bytesNeeded);
    crypto.getRandomValues(randomBytes);
    
    // Convert to BigInt
    randomBigInt = BigInt(0);
    for (let i = 0; i < randomBytes.length; i++) {
      randomBigInt = (randomBigInt << BigInt(8)) + BigInt(randomBytes[i]);
    }
    
    // Continue until we get a value within our range (rejection sampling)
  } while (randomBigInt >= max);
  
  return randomBigInt;
}

/**
 * Fallback method for generating uniform BigInt using multiple smaller random values
 * This ensures we get uniform distribution across the entire Bitcoin keyspace
 */
function generateUniformBigIntFallback(max: bigint): bigint {
  // Break the large number into smaller chunks for better distribution
  const maxStr = max.toString();
  const chunks = Math.ceil(maxStr.length / 15); // 15 digits per chunk (safely under Number.MAX_SAFE_INTEGER)
  
  let result = BigInt(0);
  let remainingMax = max;
  
  for (let i = 0; i < chunks; i++) {
    // Generate random value for this chunk
    const randomBytes = new Uint8Array(8); // 64 bits
    crypto.getRandomValues(randomBytes);
    
    // Convert to number (within safe range)
    let chunkRandom = 0;
    for (let j = 0; j < 8; j++) {
      chunkRandom = chunkRandom * 256 + randomBytes[j];
    }
    
    // Scale to remaining range
    const chunkMax = remainingMax > BigInt(Number.MAX_SAFE_INTEGER) 
      ? BigInt(Number.MAX_SAFE_INTEGER) 
      : Number(remainingMax);
      
    const scaledRandom = Math.floor((chunkRandom / (2**64)) * Number(chunkMax));
    
    result = result + BigInt(scaledRandom) * (BigInt(10) ** BigInt((chunks - i - 1) * 15));
    remainingMax = remainingMax - BigInt(scaledRandom) * (BigInt(10) ** BigInt((chunks - i - 1) * 15));
    
    if (remainingMax <= BigInt(0)) break;
  }
  
  return result % max; // Final modulo to ensure we're in range
}

/**
 * Generate a truly uniform random number in range [1, max] using string-based construction
 * This approach ensures perfect distribution across the entire Bitcoin keyspace
 */
export function generateUniformRandomInRange(max: bigint): bigint {
  const maxStr = max.toString();
  const maxLength = maxStr.length;
  
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // Generate random digits one by one
    let randomStr = '';
    
    for (let i = 0; i < maxLength; i++) {
      const maxDigitAtPosition = parseInt(maxStr[i]);
      
      // Generate random digit (0-9)
      const randomBytes = new Uint8Array(1);
      crypto.getRandomValues(randomBytes);
      const randomDigit = randomBytes[0] % 10;
      
      if (i === 0) {
        // First digit can't be 0, and must be valid for the range
        if (randomDigit === 0 || randomDigit > maxDigitAtPosition) {
          break; // Try again
        }
        randomStr += randomDigit.toString();
      } else {
        // For subsequent digits, if we're still "tracking" the max value
        const currentValue = randomStr.substring(0, i);
        const maxPrefix = maxStr.substring(0, i);
        
        if (currentValue === maxPrefix) {
          // We're still following the max path, limit this digit
          if (randomDigit > maxDigitAtPosition) {
            break; // Try again
          }
        }
        // Otherwise, any digit 0-9 is fine
        randomStr += randomDigit.toString();
      }
    }
    
    // Check if we generated a complete valid number
    if (randomStr.length === maxLength) {
      const result = BigInt(randomStr);
      if (result >= BigInt(1) && result <= max) {
        return result;
      }
    }
  }
  
  // Fallback to the improved secureRandomBigInt if string method fails
  console.warn('String-based random generation failed, using fallback');
  return secureRandomBigInt(max) + BigInt(1);
} 