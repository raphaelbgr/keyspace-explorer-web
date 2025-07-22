/**
 * Address Normalization Utilities
 * Handles cryptocurrency address prefix normalization for database storage and API processing
 */

import { CryptoCurrency } from '../types/multi-currency';

export interface AddressNormalizationResult {
  normalized: string;
  original: string;
  currency: CryptoCurrency;
  hasPrefix: boolean;
  prefix?: string;
}

export class AddressNormalizer {
  
  /**
   * Normalize an address for database storage by removing prefixes
   */
  static normalize(address: string, currency: CryptoCurrency): string {
    if (!address || typeof address !== 'string') {
      return address;
    }

    const trimmedAddress = address.trim();

    switch (currency) {
      case 'ETH':
        // Remove 0x prefix for database storage
        return trimmedAddress.startsWith('0x') ? trimmedAddress.slice(2) : trimmedAddress;
      
      case 'BCH':
        // Remove bitcoincash: prefix for database storage
        return trimmedAddress.startsWith('bitcoincash:') ? trimmedAddress.slice(12) : trimmedAddress;
      
      default:
        // No normalization needed for other currencies
        return trimmedAddress;
    }
  }

  /**
   * Restore display format by adding appropriate prefixes
   */
  static denormalize(address: string, currency: CryptoCurrency): string {
    if (!address || typeof address !== 'string') {
      return address;
    }

    const trimmedAddress = address.trim();

    switch (currency) {
      case 'ETH':
        // Add 0x prefix for display if not present
        return trimmedAddress.startsWith('0x') ? trimmedAddress : `0x${trimmedAddress}`;
      
      case 'BCH':
        // Add bitcoincash: prefix for CashAddr format if it looks like a CashAddr
        // This is a simplified check - in production you'd use proper CashAddr validation
        if (trimmedAddress.startsWith('q') || trimmedAddress.startsWith('p')) {
          return trimmedAddress.startsWith('bitcoincash:') ? trimmedAddress : `bitcoincash:${trimmedAddress}`;
        }
        return trimmedAddress;
      
      default:
        // No denormalization needed for other currencies
        return trimmedAddress;
    }
  }

  /**
   * Normalize a batch of addresses for a specific currency
   */
  static normalizeBatch(addresses: string[], currency: CryptoCurrency): string[] {
    return addresses.map(address => this.normalize(address, currency));
  }

  /**
   * Denormalize a batch of addresses for a specific currency
   */
  static denormalizeBatch(addresses: string[], currency: CryptoCurrency): string[] {
    return addresses.map(address => this.denormalize(address, currency));
  }

  /**
   * Get detailed normalization information for debugging
   */
  static analyzeAddress(address: string, currency: CryptoCurrency): AddressNormalizationResult {
    const original = address;
    const normalized = this.normalize(address, currency);
    
    let hasPrefix = false;
    let prefix: string | undefined;

    switch (currency) {
      case 'ETH':
        hasPrefix = original.startsWith('0x');
        prefix = hasPrefix ? '0x' : undefined;
        break;
      
      case 'BCH':
        hasPrefix = original.startsWith('bitcoincash:');
        prefix = hasPrefix ? 'bitcoincash:' : undefined;
        break;
      
      default:
        hasPrefix = false;
        prefix = undefined;
    }

    return {
      normalized,
      original,
      currency,
      hasPrefix,
      prefix
    };
  }

  /**
   * Validate that an address is properly formatted for the given currency
   */
  static validateFormat(address: string, currency: CryptoCurrency): { isValid: boolean; error?: string } {
    if (!address || typeof address !== 'string') {
      return { isValid: false, error: 'Address is required and must be a string' };
    }

    const trimmedAddress = address.trim();

    switch (currency) {
      case 'ETH':
        // Ethereum addresses should be 40 hex characters (with or without 0x prefix)
        const ethNormalized = this.normalize(trimmedAddress, currency);
        if (!/^[a-fA-F0-9]{40}$/.test(ethNormalized)) {
          return { isValid: false, error: 'Ethereum address must be 40 hexadecimal characters' };
        }
        break;
      
      case 'BCH':
        // Bitcoin Cash addresses can be legacy (starts with 1 or 3) or CashAddr format
        const bchNormalized = this.normalize(trimmedAddress, currency);
        // Simplified validation - in production use proper address validation libraries
        if (bchNormalized.length < 26 || bchNormalized.length > 62) {
          return { isValid: false, error: 'Bitcoin Cash address length is invalid' };
        }
        break;
      
      case 'BTC':
        // Bitcoin addresses validation (simplified)
        if (trimmedAddress.length < 26 || trimmedAddress.length > 62) {
          return { isValid: false, error: 'Bitcoin address length is invalid' };
        }
        if (!trimmedAddress.match(/^[13bc1]/)) {
          return { isValid: false, error: 'Bitcoin address must start with 1, 3, or bc1' };
        }
        break;
      
      case 'XRP':
        // Ripple addresses start with 'r' and are about 25-34 characters
        if (!trimmedAddress.startsWith('r') || trimmedAddress.length < 25 || trimmedAddress.length > 34) {
          return { isValid: false, error: 'XRP address must start with "r" and be 25-34 characters' };
        }
        break;
      
      default:
        // For other currencies, basic length check
        if (trimmedAddress.length < 20 || trimmedAddress.length > 100) {
          return { isValid: false, error: `${currency} address length is invalid` };
        }
    }

    return { isValid: true };
  }

  /**
   * Middleware function for Express-like request processing
   */
  static createNormalizationMiddleware(currencyField = 'currency') {
    return (req: any, res: any, next: any) => {
      try {
        if (req.body && req.body.addresses && Array.isArray(req.body.addresses)) {
          const currency = req.body[currencyField] as CryptoCurrency;
          
          if (currency) {
            // Normalize addresses in the request body
            req.body.addresses = req.body.addresses.map((addr: string) => 
              this.normalize(addr, currency)
            );
            
            // Store original addresses for potential response denormalization
            req.originalAddresses = req.body.addresses;
          }
        }
        
        next();
      } catch (error) {
        console.error('Address normalization middleware error:', error);
        next(); // Continue without normalization on error
      }
    };
  }
}

/**
 * Currency-specific address normalizers
 */
export const ETH_NORMALIZER = {
  normalize: (address: string) => AddressNormalizer.normalize(address, 'ETH'),
  denormalize: (address: string) => AddressNormalizer.denormalize(address, 'ETH'),
  validate: (address: string) => AddressNormalizer.validateFormat(address, 'ETH')
};

export const BCH_NORMALIZER = {
  normalize: (address: string) => AddressNormalizer.normalize(address, 'BCH'),
  denormalize: (address: string) => AddressNormalizer.denormalize(address, 'BCH'),
  validate: (address: string) => AddressNormalizer.validateFormat(address, 'BCH')
};

/**
 * Helper function to get the appropriate normalizer for a currency
 */
export function getNormalizer(currency: CryptoCurrency) {
  switch (currency) {
    case 'ETH':
      return ETH_NORMALIZER;
    case 'BCH':
      return BCH_NORMALIZER;
    default:
      return {
        normalize: (address: string) => address,
        denormalize: (address: string) => address,
        validate: (address: string) => AddressNormalizer.validateFormat(address, currency)
      };
  }
} 