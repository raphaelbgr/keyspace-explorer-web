/**
 * Bitcoin Address Validation Utilities
 * Enhanced validation for all Bitcoin address formats
 */

export class BitcoinAddressValidator {
  
  /**
   * Validates if a string is a valid Bitcoin address
   */
  static isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') {
      return false;
    }

    const trimmedAddress = address.trim();
    
    // Length validation
    if (trimmedAddress.length < 26 || trimmedAddress.length > 90) {
      return false;
    }

    // Legacy addresses (P2PKH) - start with 1
    if (trimmedAddress.startsWith('1')) {
      return this.isValidLegacyAddress(trimmedAddress);
    }

    // P2SH addresses - start with 3
    if (trimmedAddress.startsWith('3')) {
      return this.isValidP2SHAddress(trimmedAddress);
    }

    // SegWit addresses - start with bc1
    if (trimmedAddress.startsWith('bc1')) {
      return this.isValidSegWitAddress(trimmedAddress);
    }

    return false;
  }

  /**
   * Validates Legacy P2PKH addresses (starting with 1)
   */
  private static isValidLegacyAddress(address: string): boolean {
    // Legacy P2PKH addresses: 1 + 25 bytes (base58)
    if (address.length !== 26 && address.length !== 34) {
      return false;
    }
    
    // Check for valid base58 characters
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    return address.split('').every(char => base58Chars.includes(char));
  }

  /**
   * Validates P2SH addresses (starting with 3)
   */
  private static isValidP2SHAddress(address: string): boolean {
    // P2SH addresses: 3 + 25 bytes (base58)
    if (address.length !== 26 && address.length !== 34) {
      return false;
    }
    
    // Check for valid base58 characters
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    return address.split('').every(char => base58Chars.includes(char));
  }

  /**
   * Validates SegWit addresses (starting with bc1)
   */
  private static isValidSegWitAddress(address: string): boolean {
    // SegWit addresses: bc1 + bech32 encoded data
    if (address.length < 42 || address.length > 62) {
      return false;
    }

    // Check for valid bech32 characters
    const bech32Chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    const upperBech32Chars = 'QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L';
    
    // Remove 'bc1' prefix and check remaining characters
    const dataPart = address.substring(4);
    return dataPart.split('').every(char => 
      bech32Chars.includes(char) || upperBech32Chars.includes(char)
    );
  }

  /**
   * Gets the address type for a valid Bitcoin address
   */
  static getAddressType(address: string): 'legacy' | 'p2sh' | 'segwit' | 'invalid' {
    if (!this.isValidAddress(address)) {
      return 'invalid';
    }

    if (address.startsWith('1')) {
      return 'legacy';
    }
    if (address.startsWith('3')) {
      return 'p2sh';
    }
    if (address.startsWith('bc1')) {
      return 'segwit';
    }

    return 'invalid';
  }

  /**
   * Filters an array of addresses to only valid Bitcoin addresses
   */
  static filterValidAddresses(addresses: string[]): string[] {
    return addresses.filter(address => this.isValidAddress(address));
  }

  /**
   * Validates and logs issues with an array of addresses
   */
  static validateAddressBatch(addresses: string[]): {
    valid: string[];
    invalid: string[];
    issues: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const issues: string[] = [];

    for (const address of addresses) {
      if (this.isValidAddress(address)) {
        valid.push(address);
      } else {
        invalid.push(address);
        issues.push(`Invalid address format: ${address}`);
      }
    }

    return { valid, invalid, issues };
  }
} 