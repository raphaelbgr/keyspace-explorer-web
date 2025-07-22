/**
 * Address Format Detection Utility
 * Detects which cryptocurrency(ies) an address format belongs to
 * This optimizes balance checking by only querying relevant currencies
 */

import { CryptoCurrency } from '../types/multi-currency';

export interface AddressFormatResult {
  address: string;
  detectedCurrencies: CryptoCurrency[];
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
}

export class AddressFormatDetector {
  
  /**
   * Detect which cryptocurrency(ies) an address belongs to
   */
  static detectFormat(address: string): AddressFormatResult {
    if (!address || typeof address !== 'string') {
      return {
        address,
        detectedCurrencies: [],
        confidence: 'low',
        warnings: ['Invalid address format']
      };
    }

    const trimmedAddress = address.trim();
    const detectedCurrencies: CryptoCurrency[] = [];
    const warnings: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'high';

    // Bitcoin (BTC) - Legacy P2PKH addresses (start with 1)
    if (/^1[A-HJ-NP-Za-km-z1-9]{25,34}$/.test(trimmedAddress)) {
      detectedCurrencies.push('BTC');
      // Note: BCH also uses legacy format, but since these are identical,
      // we'll only check BTC to avoid duplicate work
    }

    // Bitcoin (BTC) - P2SH addresses (start with 3)
    else if (/^3[A-HJ-NP-Za-km-z1-9]{25,34}$/.test(trimmedAddress)) {
      detectedCurrencies.push('BTC');
    }

    // Bitcoin (BTC) - SegWit addresses (start with bc1)
    else if (/^bc1[a-z0-9]{39,59}$/.test(trimmedAddress)) {
      detectedCurrencies.push('BTC');
    }

    // Bitcoin Cash (BCH) - CashAddr format
    else if (trimmedAddress.startsWith('bitcoincash:') || /^[qp][a-z0-9]{41}$/.test(trimmedAddress)) {
      detectedCurrencies.push('BCH');
    }

    // Ethereum (ETH) - Standard format
    else if (/^(0x)?[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      detectedCurrencies.push('ETH');
    }

    // Ripple (XRP) - Standard format
    else if (/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(trimmedAddress)) {
      detectedCurrencies.push('XRP');
    }

    // Litecoin (LTC) - Legacy addresses (start with L)
    else if (/^L[A-HJ-NP-Za-km-z1-9]{25,34}$/.test(trimmedAddress)) {
      detectedCurrencies.push('LTC');
    }

    // Litecoin (LTC) - P2SH addresses (start with M)
    else if (/^M[A-HJ-NP-Za-km-z1-9]{25,34}$/.test(trimmedAddress)) {
      detectedCurrencies.push('LTC');
    }

    // Litecoin (LTC) - SegWit addresses (start with ltc1)
    else if (/^ltc1[a-z0-9]{39,59}$/.test(trimmedAddress)) {
      detectedCurrencies.push('LTC');
    }

    // Dash (DASH) - Legacy addresses (start with X)
    else if (/^X[A-HJ-NP-Za-km-z1-9]{25,34}$/.test(trimmedAddress)) {
      detectedCurrencies.push('DASH');
    }

    // Dogecoin (DOGE) - Legacy addresses (start with D)
    else if (/^D[A-HJ-NP-Za-km-z1-9]{25,34}$/.test(trimmedAddress)) {
      detectedCurrencies.push('DOGE');
    }

    // Zcash (ZEC) - Transparent addresses (start with t1 or t3)
    else if (/^t1[A-HJ-NP-Za-km-z1-9]{32}$/.test(trimmedAddress) || /^t3[A-HJ-NP-Za-km-z1-9]{32}$/.test(trimmedAddress)) {
      detectedCurrencies.push('ZEC');
    }

    // If no format detected, provide fallback with warning
    if (detectedCurrencies.length === 0) {
      confidence = 'low';
      warnings.push('Unknown address format - will check against all currencies');
      // Return all currencies as fallback to maintain compatibility
      return {
        address: trimmedAddress,
        detectedCurrencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'],
        confidence,
        warnings
      };
    }

    return {
      address: trimmedAddress,
      detectedCurrencies,
      confidence,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Batch detect formats for multiple addresses
   */
  static detectFormats(addresses: string[]): AddressFormatResult[] {
    return addresses.map(address => this.detectFormat(address));
  }

  /**
   * Get optimized currency list for an array of addresses
   * This reduces the number of unnecessary database queries
   */
  static getOptimizedCurrencyList(addresses: string[]): {
    currencyToAddresses: Record<CryptoCurrency, string[]>;
    detectionResults: AddressFormatResult[];
    optimizationStats: {
      totalAddresses: number;
      totalPossibleQueries: number;
      optimizedQueries: number;
      savings: string;
    };
  } {
    const detectionResults = this.detectFormats(addresses);
    const currencyToAddresses: Record<CryptoCurrency, string[]> = {
      BTC: [],
      BCH: [],
      DASH: [],
      DOGE: [],
      ETH: [],
      LTC: [],
      XRP: [],
      ZEC: []
    };

    // Group addresses by detected currencies
    detectionResults.forEach(result => {
      result.detectedCurrencies.forEach(currency => {
        if (!currencyToAddresses[currency].includes(result.address)) {
          currencyToAddresses[currency].push(result.address);
        }
      });
    });

    // Calculate optimization statistics
    const totalAddresses = addresses.length;
    const totalPossibleQueries = totalAddresses * 8; // 8 currencies
    let optimizedQueries = 0;
    
    Object.values(currencyToAddresses).forEach(addressList => {
      optimizedQueries += addressList.length;
    });

    const savingsPercentage = totalPossibleQueries > 0 
      ? ((totalPossibleQueries - optimizedQueries) / totalPossibleQueries * 100).toFixed(1)
      : '0.0';

    return {
      currencyToAddresses,
      detectionResults,
      optimizationStats: {
        totalAddresses,
        totalPossibleQueries,
        optimizedQueries,
        savings: `${savingsPercentage}%`
      }
    };
  }

  /**
   * Validate if an address matches expected format for a specific currency
   */
  static validateAddressForCurrency(address: string, currency: CryptoCurrency): boolean {
    const detection = this.detectFormat(address);
    return detection.detectedCurrencies.includes(currency);
  }

  /**
   * Get human-readable currency names for detected formats
   */
  static getCurrencyNames(currencies: CryptoCurrency[]): string[] {
    const currencyNames: Record<CryptoCurrency, string> = {
      BTC: 'Bitcoin',
      BCH: 'Bitcoin Cash',
      DASH: 'Dash',
      DOGE: 'Dogecoin',
      ETH: 'Ethereum',
      LTC: 'Litecoin',
      XRP: 'Ripple',
      ZEC: 'Zcash'
    };

    return currencies.map(currency => currencyNames[currency]);
  }

  /**
   * Debug utility to analyze address detection results
   */
  static analyzeAddresses(addresses: string[]): {
    summary: Record<CryptoCurrency, number>;
    undetected: string[];
    multipleMatches: Array<{ address: string; currencies: CryptoCurrency[] }>;
  } {
    const detectionResults = this.detectFormats(addresses);
    const summary: Record<CryptoCurrency, number> = {
      BTC: 0, BCH: 0, DASH: 0, DOGE: 0, ETH: 0, LTC: 0, XRP: 0, ZEC: 0
    };
    const undetected: string[] = [];
    const multipleMatches: Array<{ address: string; currencies: CryptoCurrency[] }> = [];

    detectionResults.forEach(result => {
      if (result.detectedCurrencies.length === 0) {
        undetected.push(result.address);
      } else if (result.detectedCurrencies.length > 1) {
        multipleMatches.push({
          address: result.address,
          currencies: result.detectedCurrencies
        });
      }

      result.detectedCurrencies.forEach(currency => {
        summary[currency]++;
      });
    });

    return { summary, undetected, multipleMatches };
  }
}

/**
 * Helper function for quick format detection
 */
export function detectAddressFormat(address: string): CryptoCurrency[] {
  return AddressFormatDetector.detectFormat(address).detectedCurrencies;
}

/**
 * Helper function for optimized balance checking
 */
export function optimizeBalanceRequest(addresses: string[]): Record<CryptoCurrency, string[]> {
  const result = AddressFormatDetector.getOptimizedCurrencyList(addresses);
  return result.currencyToAddresses;
} 