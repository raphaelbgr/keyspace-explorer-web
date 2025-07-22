import { CryptoCurrency } from '../types/multi-currency';

interface PageKey {
  privateKey: string;
  addresses: any;
  balances?: any;
  [key: string]: any;
}

interface PageData {
  keys: PageKey[];
  multiCurrency?: boolean;
  [key: string]: any;
}

interface BalanceCheckOptions {
  forceRefresh?: boolean;
  forceLocal?: boolean;
  apiSource?: 'local' | 'external';
}

export class UnifiedBalanceService {
  private static instance: UnifiedBalanceService;

  private constructor() {}

  public static getInstance(): UnifiedBalanceService {
    if (!UnifiedBalanceService.instance) {
      UnifiedBalanceService.instance = new UnifiedBalanceService();
    }
    return UnifiedBalanceService.instance;
  }

  /**
   * Main method to check balances for private keys
   * Converts page data to private key request format and calls the updated API
   */
  async checkBalancesForPrivateKeys(
    pageData: PageData, 
    options: BalanceCheckOptions = {}
  ): Promise<any> {
    const { forceRefresh = false, forceLocal = true } = options;

    try {
      console.log(`🔄 UnifiedBalanceService: Processing ${pageData.keys?.length || 0} keys`);

      // Convert page data to private key request format
      const privateKeyRequest = this.formatPrivateKeyRequest(pageData);
      
      if (Object.keys(privateKeyRequest.private_keys).length === 0) {
        console.warn('🔄 No valid private keys found in page data');
        return { success: true, balances: {}, metadata: { totalAddresses: 0 } };
      }

      console.log(`🔄 Formatted request for ${Object.keys(privateKeyRequest.private_keys).length} private keys`);
      console.log(`🔄 Total addresses: ${this.countTotalAddresses(privateKeyRequest.private_keys)}`);

      // Call the updated balance API with private key format
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...privateKeyRequest,
          forceRefresh,
          forceLocal
        }),
      });

      if (!response.ok) {
        console.error('🔄 Balance API call failed:', response.status, response.statusText);
        throw new Error(`Balance API failed: ${response.status} ${response.statusText}`);
      }

      const balanceData = await response.json();
      console.log(`🔄 UnifiedBalanceService: API call successful`);
      
      // Return the existing response format unchanged
      return balanceData;

    } catch (error) {
      console.error('🔄 UnifiedBalanceService error:', error);
      // Return empty result on error to maintain compatibility
      return { 
        success: false, 
        balances: {}, 
        metadata: { totalAddresses: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Legacy method for backward compatibility - converts address array to basic request
   */
  async checkBalancesLegacy(
    addresses: string[], 
    options: BalanceCheckOptions = {}
  ): Promise<any> {
    const { forceRefresh = false, forceLocal = true } = options;

    try {
      console.log(`🔄 UnifiedBalanceService (Legacy): Processing ${addresses.length} addresses`);

      // Use legacy address array format for backward compatibility
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses,
          forceRefresh,
          forceLocal
        }),
      });

      if (!response.ok) {
        console.error('🔄 Legacy balance API call failed:', response.status, response.statusText);
        throw new Error(`Balance API failed: ${response.status} ${response.statusText}`);
      }

      const balanceData = await response.json();
      console.log(`🔄 UnifiedBalanceService (Legacy): API call successful`);
      
      return balanceData;

    } catch (error) {
      console.error('🔄 UnifiedBalanceService (Legacy) error:', error);
      return { 
        success: false, 
        balances: {}, 
        metadata: { totalAddresses: addresses.length },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format page data into private key request structure
   */
  private formatPrivateKeyRequest(pageData: PageData): { private_keys: Record<string, any> } {
    const privateKeys: Record<string, any> = {};

    if (!pageData.keys || !Array.isArray(pageData.keys)) {
      console.warn('🔄 Invalid page data: no keys array found');
      return { private_keys: privateKeys };
    }

    pageData.keys.forEach((key: PageKey, index: number) => {
      if (!key.privateKey || !key.addresses) {
        console.warn(`🔄 Skipping key ${index}: missing privateKey or addresses`);
        return;
      }

      // Use the private key as the key in the request
      const privateKeyValue = key.privateKey;
      
      if (pageData.multiCurrency) {
        // Multi-currency format: key.addresses contains currency groups
        privateKeys[privateKeyValue] = this.formatMultiCurrencyAddresses(key.addresses);
      } else {
        // Legacy Bitcoin-only format: convert to multi-currency structure
        privateKeys[privateKeyValue] = this.formatLegacyBitcoinAddresses(key.addresses);
      }
    });

    return { private_keys: privateKeys };
  }

  /**
   * Format multi-currency addresses for private key request
   */
  private formatMultiCurrencyAddresses(addresses: any): Record<string, any> {
    const formattedAddresses: Record<string, any> = {};

    // addresses should be in format: { BTC: { p2pkh_compressed: "address", ... }, ETH: { standard: "address" }, ... }
    Object.entries(addresses).forEach(([currency, currencyAddresses]: [string, any]) => {
      if (typeof currencyAddresses === 'object' && currencyAddresses !== null) {
        formattedAddresses[currency] = currencyAddresses;
      }
    });

    return formattedAddresses;
  }

  /**
   * Format legacy Bitcoin addresses for private key request
   */
  private formatLegacyBitcoinAddresses(addresses: any): Record<string, any> {
    const formattedAddresses: Record<string, any> = {
      BTC: {}
    };

    // Legacy format: { p2pkh_compressed: "address", p2pkh_uncompressed: "address", ... }
    if (typeof addresses === 'object' && addresses !== null) {
      formattedAddresses.BTC = addresses;
    }

    return formattedAddresses;
  }

  /**
   * Count total addresses in private key structure
   */
  private countTotalAddresses(privateKeys: Record<string, any>): number {
    let count = 0;
    
    Object.values(privateKeys).forEach((currencyMap: any) => {
      if (typeof currencyMap === 'object') {
        Object.values(currencyMap).forEach((addressMap: any) => {
          if (typeof addressMap === 'object') {
            count += Object.keys(addressMap).length;
          }
        });
      }
    });

    return count;
  }
}

// Export singleton instance
export const unifiedBalanceService = UnifiedBalanceService.getInstance(); 