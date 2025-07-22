import { CryptoCurrency, SUPPORTED_CURRENCIES } from '../types/multi-currency';

interface KeyData {
  privateKey: string;
  addresses: any;
  [key: string]: any;
}

interface PageData {
  keys: KeyData[];
  multiCurrency?: boolean;
  [key: string]: any;
}

interface PrivateKeyRequestFormat {
  private_keys: Record<string, Record<string, Record<string, string>>>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class BalanceRequestFormatter {
  
  /**
   * Convert page data to private key request format
   */
  static formatPageDataToPrivateKeyRequest(pageData: PageData): PrivateKeyRequestFormat {
    console.log(`📋 Formatting ${pageData.keys?.length || 0} keys to private key request format`);
    
    const privateKeys: Record<string, Record<string, Record<string, string>>> = {};

    if (!pageData.keys || !Array.isArray(pageData.keys)) {
      console.warn('📋 No valid keys array found in page data');
      return { private_keys: privateKeys };
    }

    pageData.keys.forEach((key: KeyData, index: number) => {
      try {
        const formattedKey = this.formatSingleKey(key, pageData.multiCurrency || false, index);
        if (formattedKey) {
          privateKeys[key.privateKey] = formattedKey;
        }
      } catch (error) {
        console.error(`📋 Error formatting key ${index}:`, error);
      }
    });

    console.log(`📋 Successfully formatted ${Object.keys(privateKeys).length} private keys`);
    return { private_keys: privateKeys };
  }

  /**
   * Format a single key's addresses based on whether it's multi-currency or legacy format
   */
  private static formatSingleKey(
    key: KeyData, 
    isMultiCurrency: boolean, 
    index: number
  ): Record<string, Record<string, string>> | null {
    
    if (!key.privateKey) {
      console.warn(`📋 Key ${index}: Missing private key`);
      return null;
    }

    if (!key.addresses) {
      console.warn(`📋 Key ${index}: Missing addresses`);
      return null;
    }

    if (isMultiCurrency) {
      return this.formatMultiCurrencyKey(key.addresses, index);
    } else {
      return this.formatLegacyBitcoinKey(key.addresses, index);
    }
  }

  /**
   * Format multi-currency key addresses
   */
  private static formatMultiCurrencyKey(
    addresses: any, 
    index: number
  ): Record<string, Record<string, string>> {
    const formatted: Record<string, Record<string, string>> = {};

    if (typeof addresses !== 'object' || addresses === null) {
      console.warn(`📋 Key ${index}: Invalid multi-currency addresses format`);
      return formatted;
    }

    // Expected format: { BTC: { p2pkh_compressed: "address", ... }, ETH: { standard: "address" }, ... }
    Object.entries(addresses).forEach(([currency, currencyAddresses]: [string, any]) => {
      if (SUPPORTED_CURRENCIES.includes(currency as CryptoCurrency)) {
        if (typeof currencyAddresses === 'object' && currencyAddresses !== null) {
          formatted[currency] = this.validateAndFormatCurrencyAddresses(currencyAddresses, currency, index);
        }
      } else {
        console.warn(`📋 Key ${index}: Unsupported currency ${currency}`);
      }
    });

    return formatted;
  }

  /**
   * Format legacy Bitcoin-only key addresses
   */
  private static formatLegacyBitcoinKey(
    addresses: any, 
    index: number
  ): Record<string, Record<string, string>> {
    const formatted: Record<string, Record<string, string>> = {
      BTC: {}
    };

    if (typeof addresses !== 'object' || addresses === null) {
      console.warn(`📋 Key ${index}: Invalid legacy addresses format`);
      return formatted;
    }

    // Expected format: { p2pkh_compressed: "address", p2pkh_uncompressed: "address", ... }
    formatted.BTC = this.validateAndFormatCurrencyAddresses(addresses, 'BTC', index);

    return formatted;
  }

  /**
   * Validate and format addresses for a specific currency
   */
  private static validateAndFormatCurrencyAddresses(
    currencyAddresses: any,
    currency: string,
    index: number
  ): Record<string, string> {
    const formatted: Record<string, string> = {};

    Object.entries(currencyAddresses).forEach(([addressType, address]: [string, any]) => {
      if (typeof address === 'string' && address.length > 0) {
        if (this.isValidAddressFormat(address, currency)) {
          formatted[addressType] = address;
        } else {
          console.warn(`📋 Key ${index}, ${currency}: Invalid address format for ${addressType}: ${address}`);
        }
      }
    });

    return formatted;
  }

  /**
   * Basic address format validation
   */
  private static isValidAddressFormat(address: string, currency: string): boolean {
    // Basic validation - could be enhanced with more specific format checks
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Basic length and character checks
    switch (currency) {
      case 'BTC':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
      case 'ETH':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'BCH':
        return /^[13qpzry9x8gf2tvdw0s3jn54khce6mua7l][a-km-zA-HJ-NP-Z1-9]{25,62}$/.test(address);
      case 'LTC':
        return /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$|^ltc1[a-z0-9]{39,59}$/.test(address);
      case 'DOGE':
        return /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(address);
      case 'XRP':
        return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
      default:
        // For other currencies, just check it's not empty
        return address.length > 10;
    }
  }

  /**
   * Validate page data structure
   */
  static validatePageData(pageData: PageData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!pageData) {
      errors.push('Page data is null or undefined');
      return { isValid: false, errors, warnings };
    }

    if (!pageData.keys || !Array.isArray(pageData.keys)) {
      errors.push('Page data must contain a keys array');
      return { isValid: false, errors, warnings };
    }

    if (pageData.keys.length === 0) {
      warnings.push('Page data contains no keys');
    }

    // Validate each key
    pageData.keys.forEach((key, index) => {
      if (!key.privateKey) {
        errors.push(`Key ${index}: Missing private key`);
      }
      
      if (!key.addresses) {
        errors.push(`Key ${index}: Missing addresses`);
      } else if (typeof key.addresses !== 'object') {
        errors.push(`Key ${index}: Addresses must be an object`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract all unique addresses from page data
   */
  static extractAllAddresses(pageData: PageData): string[] {
    const allAddresses: string[] = [];

    if (!pageData.keys || !Array.isArray(pageData.keys)) {
      return allAddresses;
    }

    pageData.keys.forEach((key: KeyData) => {
      if (!key.addresses) return;

      if (pageData.multiCurrency) {
        // Multi-currency format
        Object.values(key.addresses).forEach((currencyAddresses: any) => {
          if (typeof currencyAddresses === 'object') {
            Object.values(currencyAddresses).forEach((address: any) => {
              if (typeof address === 'string' && address.length > 0) {
                allAddresses.push(address);
              }
            });
          }
        });
      } else {
        // Legacy Bitcoin-only format
        Object.values(key.addresses).forEach((address: any) => {
          if (typeof address === 'string' && address.length > 0) {
            allAddresses.push(address);
          }
        });
      }
    });

    // Return unique addresses
    return Array.from(new Set(allAddresses));
  }

  /**
   * Count total addresses in page data
   */
  static countAddresses(pageData: PageData): { totalKeys: number; totalAddresses: number; addressesPerKey: number } {
    const totalKeys = pageData.keys?.length || 0;
    const totalAddresses = this.extractAllAddresses(pageData).length;
    const addressesPerKey = totalKeys > 0 ? Math.round(totalAddresses / totalKeys) : 0;

    return { totalKeys, totalAddresses, addressesPerKey };
  }
} 