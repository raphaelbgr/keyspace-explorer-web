import { DatabaseService } from './DatabaseService';
import { 
  CryptoCurrency, 
  BalanceResult, 
  BatchBalanceRequest, 
  BatchBalanceResponse, 
  CachedBalance,
  BalanceSource,
  APIProvider,
  CacheMetrics,
  CURRENCY_CONFIGS,
  SUPPORTED_CURRENCIES
} from '../types/multi-currency';

interface ExternalAPIResponse {
  address: string;
  balance: string;
  error?: string;
}

export class MultiCurrencyBalanceService {
  private databaseService: DatabaseService;
  private cacheMetrics: CacheMetrics;
  
  // External API provider configurations
  private apiProviders: Record<CryptoCurrency, APIProvider> = {
    BTC: {
      name: 'Blockchair',
      baseURL: 'https://api.blockchair.com',
      batchEndpoint: '/bitcoin/addresses/{addresses}',
      maxBatchSize: 100,
      rateLimit: { requestsPerSecond: 30 }
    },
    BCH: {
      name: 'BCH API',
      baseURL: 'https://api.fullstack.cash',
      batchEndpoint: '/v5/electrumx/balance/bulk',
      maxBatchSize: 100,
      rateLimit: { requestsPerSecond: 10 }
    },
    DASH: {
      name: 'Insight API',
      baseURL: 'https://insight.dash.org/insight-api',
      batchEndpoint: '/addrs/{addresses}/utxo',
      maxBatchSize: 50,
      rateLimit: { requestsPerSecond: 10 }
    },
    DOGE: {
      name: 'SoChain',
      baseURL: 'https://chain.so/api/v3',
      batchEndpoint: '/balance/DOGE/{addresses}',
      maxBatchSize: 100,
      rateLimit: { requestsPerSecond: 5 }
    },
    ETH: {
      name: 'Etherscan',
      baseURL: 'https://api.etherscan.io/api',
      batchEndpoint: '?module=account&action=balancemulti&address={addresses}&tag=latest&apikey=YourApiKeyToken',
      maxBatchSize: 20,
      rateLimit: { requestsPerSecond: 5, requestsPerDay: 100000 }
    },
    LTC: {
      name: 'SoChain',
      baseURL: 'https://chain.so/api/v3',
      batchEndpoint: '/balance/LTC/{addresses}',
      maxBatchSize: 100,
      rateLimit: { requestsPerSecond: 5 }
    },
    XRP: {
      name: 'XRPL Public API',
      baseURL: 'https://xrpl-api.example.com',
      batchEndpoint: '/accounts/balances',
      maxBatchSize: 100,
      rateLimit: { requestsPerSecond: 10 }
    },
    ZEC: {
      name: 'ZEC Explorer (Disabled)',
      baseURL: 'https://disabled-zec-api.local',
      batchEndpoint: '/api/disabled',
      maxBatchSize: 1,
      rateLimit: { requestsPerSecond: 5 }
    }
  };

  constructor() {
    this.databaseService = new DatabaseService();
    this.cacheMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      externalAPICalls: 0,
      cacheHitRate: 0,
      apiCallReduction: 0,
      averageResponseTime: 0
    };
    
    // Start cache cleanup job
    this.startCacheCleanupJob();
  }

  /**
   * Main entry point for balance checking with smart caching
   */
  async checkBalances(request: BatchBalanceRequest): Promise<BatchBalanceResponse> {
    const startTime = Date.now();
    this.cacheMetrics.totalRequests++;

    try {
      // Step 1: Check local wallet database first
      const localResults = await this.getLocalWalletBalances(request.addresses, request.currency);
      const addressesWithBalance = new Set(localResults.filter(r => parseFloat(r.balance) > 0).map(r => r.address));
      
      // Step 2: Check cache for non-local results
      const cachedResults = await this.getCachedBalances(request.addresses, request.currency);
      const uncachedAddresses = this.findUncachedAddresses(request.addresses, [...localResults, ...cachedResults]);

      console.log(`💾 Balance results for ${request.currency}: ${localResults.length} local, ${cachedResults.length} cached, ${uncachedAddresses.length} need external fetch`);

      let externalResults: BalanceResult[] = [];
      let externalAPICalls = 0;

      // Step 3: Fetch missing data from external APIs (if needed)
      if (uncachedAddresses.length > 0 && !request.forceRefresh && !request.forceLocal) {
        console.log(`🌐 Fetching ${uncachedAddresses.length} ${request.currency} addresses from external API`);
        externalResults = await this.fetchBatchedBalances(uncachedAddresses, request.currency);
        externalAPICalls = Math.ceil(uncachedAddresses.length / CURRENCY_CONFIGS[request.currency].batchSize);
        
        // Step 4: Cache external results
        await this.cacheExternalResults(externalResults, request.currency);
      } else if (request.forceLocal && uncachedAddresses.length > 0) {
        console.log(`🏠 Force local mode: Returning zero balances for ${uncachedAddresses.length} ${request.currency} addresses not found locally`);
        // Return zero balances with "local" source for addresses not found in local database
        externalResults = uncachedAddresses.map(address => ({
          address,
          currency: request.currency,
          balance: '0',
          source: 'local' as BalanceSource
        }));
      }

      // Step 5: Combine results (prioritize local > cached > external)
      const allResults = this.combineResults(localResults, cachedResults, externalResults);
      
      // Update metrics
      this.cacheMetrics.cacheHits += cachedResults.length;
      this.cacheMetrics.cacheMisses += uncachedAddresses.length;
      this.cacheMetrics.externalAPICalls += externalAPICalls;
      this.updateCacheMetrics();

      const responseTime = Date.now() - startTime;
      console.log(`⚡ Balance check completed in ${responseTime}ms for ${request.currency}`);

      return {
        currency: request.currency,
        results: allResults,
        cacheHits: cachedResults.length,
        cacheMisses: uncachedAddresses.length,
        externalAPICalls
      };

    } catch (error) {
      console.error(`❌ Error checking balances for ${request.currency}:`, error);
      
      // Fallback: Return any cached data (even expired)
      const fallbackResults = await this.getCachedBalances(
        request.addresses, 
        request.currency, 
        { includeExpired: true }
      );

      return {
        currency: request.currency,
        results: fallbackResults,
        cacheHits: fallbackResults.length,
        cacheMisses: 0,
        externalAPICalls: 0
      };
    }
  }

  /**
   * Get cached balances from database
   */
  private async getCachedBalances(
    addresses: string[], 
    currency: CryptoCurrency,
    options: { includeExpired?: boolean } = {}
  ): Promise<BalanceResult[]> {
    const now = new Date();
    const expiredClause = options.includeExpired ? '' : 'AND expires_at > $3';
    
    const query = `
      SELECT address, balance, source, cached_at, expires_at
      FROM balance_cache 
      WHERE currency = $1 
        AND address = ANY($2::text[])
        ${expiredClause}
      ORDER BY cached_at DESC
    `;
    
    const params = options.includeExpired 
      ? [currency, addresses]
      : [currency, addresses, now];

    const result = await this.databaseService.executeQuery(query, params);
    
    return result.rows.map((row: any) => ({
      address: row.address,
      currency,
      balance: row.balance || '0',
      source: row.source as BalanceSource
    }));
  }

  /**
   * Get balances from local wallet tables
   */
  private async getLocalWalletBalances(
    addresses: string[], 
    currency: CryptoCurrency
  ): Promise<BalanceResult[]> {
    // Map currency to table name
    const tableMap: Record<CryptoCurrency, string> = {
      BTC: 'wallets_btc',
      BCH: 'wallets_bch',
      DASH: 'wallets_dash',
      DOGE: 'wallets_doge',
      ETH: 'wallets_eth',
      LTC: 'wallets_ltc',
      XRP: 'wallets_xrp',
      ZEC: 'wallets_zec'
    };

    const tableName = tableMap[currency];
    if (!tableName) {
      console.warn(`No local table mapped for currency: ${currency}`);
      return [];
    }

    try {
      // Normalize addresses for query
      const normalizedAddresses = addresses.map(addr => this.normalizeAddress(addr, currency));
      
      console.log(`🔍 Checking local ${currency} table (${tableName}) for ${normalizedAddresses.length} addresses`);
      console.log(`🔍 Sample addresses:`, normalizedAddresses.slice(0, 3));
      
      const query = `
        SELECT address, balance 
        FROM ${tableName}
        WHERE address = ANY($1::text[])
      `;
      
      const result = await this.databaseService.executeQuery(query, [normalizedAddresses]);
      
      console.log(`📊 Local ${currency} query result: found ${result.rows.length} addresses with balance > 0`);
      
      // If no results with balance > 0, also check if addresses exist at all
      if (result.rows.length === 0) {
        const checkQuery = `
          SELECT address, balance 
          FROM ${tableName}
          WHERE address = ANY($1::text[])
          LIMIT 5
        `;
        const checkResult = await this.databaseService.executeQuery(checkQuery, [normalizedAddresses]);
        console.log(`📊 Local ${currency} existence check: found ${checkResult.rows.length} addresses in table`);
        if (checkResult.rows.length > 0) {
          console.log(`📊 Sample found addresses:`, checkResult.rows.map((r: any) => ({ address: r.address, balance: r.balance })));
        }
      }
      
      return result.rows.map((row: any) => ({
        address: row.address,
        currency,
        balance: row.balance.toString(),
        source: 'local' as BalanceSource
      }));
    } catch (error) {
      console.error(`Error querying local ${currency} balances:`, error);
      return [];
    }
  }

  /**
   * Combine results prioritizing local > cached > external
   */
  private combineResults(
    localResults: BalanceResult[],
    cachedResults: BalanceResult[], 
    externalResults: BalanceResult[]
  ): BalanceResult[] {
    const resultMap = new Map<string, BalanceResult>();
    
    // Add external results first (lowest priority)
    externalResults.forEach(r => resultMap.set(r.address, r));
    
    // Override with cached results
    cachedResults.forEach(r => resultMap.set(r.address, r));
    
    // Override with local results (highest priority)
    localResults.forEach(r => resultMap.set(r.address, r));
    
    return Array.from(resultMap.values());
  }

  /**
   * Find addresses that need external API calls
   */
  private findUncachedAddresses(allAddresses: string[], existingResults: BalanceResult[]): string[] {
    const existingAddresses = new Set(existingResults.map(r => r.address));
    return allAddresses.filter(addr => !existingAddresses.has(addr));
  }

  /**
   * Fetch balances from external APIs with batching
   */
  private async fetchBatchedBalances(addresses: string[], currency: CryptoCurrency): Promise<BalanceResult[]> {
    const provider = this.apiProviders[currency];
    const batchSize = provider.maxBatchSize;
    const batches = this.chunkArray(addresses, batchSize);
    
    const results: BalanceResult[] = [];
    
    // Process batches with rate limiting
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        // Rate limiting delay
        if (i > 0) {
          const delayMs = Math.ceil(1000 / provider.rateLimit.requestsPerSecond);
          await this.delay(delayMs);
        }

        const batchResults = await this.callBatchAPI(batch, currency, provider);
        results.push(...batchResults);
        
        console.log(`✅ Batch ${i + 1}/${batches.length} completed for ${currency}: ${batchResults.length} addresses`);
        
             } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Unknown error';
         console.error(`❌ Batch ${i + 1} failed for ${currency}:`, error);
         
         // Add error results for failed batch
         const errorResults = batch.map(address => ({
           address,
           currency,
           balance: '0',
           source: this.getExternalSourceName(currency),
           error: `API Error: ${errorMessage}`
         }));
         results.push(...errorResults);
       }
    }
    
    return results;
  }

  /**
   * Call external API for a batch of addresses
   */
  private async callBatchAPI(
    addresses: string[], 
    currency: CryptoCurrency, 
    provider: APIProvider
  ): Promise<BalanceResult[]> {
    const normalizedAddresses = addresses.map(addr => this.normalizeAddress(addr, currency));
    
    try {
      let response: Response;
      
      // Build API request based on provider
      switch (currency) {
        case 'BTC':
          response = await this.callBlockchairAPI(normalizedAddresses);
          break;
        case 'BCH':
          response = await this.callBCHAPI(normalizedAddresses);
          break;
        case 'DASH':
          response = await this.callInsightAPI(normalizedAddresses, 'dash');
          break;
        case 'DOGE':
          response = await this.callSoChainAPI(normalizedAddresses, 'DOGE');
          break;
        case 'ETH':
          response = await this.callEtherscanAPI(normalizedAddresses);
          break;
        case 'LTC':
          response = await this.callSoChainAPI(normalizedAddresses, 'LTC');
          break;
        case 'XRP':
          response = await this.callXRPLAPI(normalizedAddresses);
          break;
        case 'ZEC':
          // ZEC external API is disabled due to reliability issues - return zero balances
          console.log(`⚠️ ZEC external API disabled - returning zero balances for ${normalizedAddresses.length} addresses`);
          return addresses.map(address => ({
            address,
            currency,
            balance: '0',
            source: 'external' as BalanceSource,
            error: 'ZEC external API disabled'
          }));
        default:
          throw new Error(`Unsupported currency: ${currency}`);
      }
      
      if (!response.ok) {
        // For test/development, don't throw errors for 404s - just return zero balances
        if (response.status === 404) {
          console.log(`⚠️ External API endpoint not available for ${currency} (404) - returning zero balances`);
          return addresses.map(address => ({
            address,
            currency,
            balance: '0',
            source: this.getExternalSourceName(currency),
            error: 'API endpoint not available'
          }));
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.text();
      if (!data.trim()) {
        console.log(`⚠️ Empty response from ${currency} API - returning zero balances`);
        return addresses.map(address => ({
          address,
          currency,
          balance: '0',
          source: this.getExternalSourceName(currency),
          error: 'Empty API response'
        }));
      }
      
      return this.parseAPIResponse(data, addresses, currency);
    } catch (error) {
      // Reduce error spam for development/testing
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`⚠️ ${currency} API not available (404) - using fallback zero balances`);
      } else {
        console.log(`⚠️ External API error for ${currency}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Return zero balances instead of throwing
      return addresses.map(address => ({
        address,
        currency,
        balance: '0',
        source: this.getExternalSourceName(currency),
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  /**
   * API-specific implementations
   */
  private async callBlockchairAPI(addresses: string[]): Promise<Response> {
    const addressList = addresses.join(',');
    return fetch(`https://api.blockchair.com/bitcoin/addresses/${addressList}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
  }

  private async callBCHAPI(addresses: string[]): Promise<Response> {
    return fetch('https://api.fullstack.cash/v5/electrumx/balance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses })
    });
  }

  private async callSoChainAPI(addresses: string[], currency: string): Promise<Response> {
    const addressList = addresses.join(',');
    return fetch(`https://chain.so/api/v3/balance/${currency}/${addressList}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
  }

  private async callEtherscanAPI(addresses: string[]): Promise<Response> {
    const addressList = addresses.join(',');
    return fetch(`https://api.etherscan.io/api?module=account&action=balancemulti&address=${addressList}&tag=latest&apikey=YourApiKeyToken`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
  }

  private async callInsightAPI(addresses: string[], currency: string): Promise<Response> {
    const addressList = addresses.join(',');
    return fetch(`https://insight.${currency}.org/insight-api/addrs/${addressList}/utxo`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
  }

  private async callXRPLAPI(addresses: string[]): Promise<Response> {
    return fetch('https://xrpl-api.example.com/accounts/balances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: addresses })
    });
  }

  private async callZECAPI(addresses: string[]): Promise<Response> {
    // ZEC typically requires individual calls
    const address = addresses[0];
    return fetch(`https://zec-explorer.example.com/api/addr/${address}/balance`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
  }

  /**
   * Parse API responses based on provider format
   */
  private parseAPIResponse(data: string, addresses: string[], currency: CryptoCurrency): BalanceResult[] {
    const results: BalanceResult[] = [];
    
    try {
      // Parse the text response as JSON
      let parsedData: any;
      try {
        parsedData = JSON.parse(data);
      } catch (parseError) {
        console.log(`⚠️ Failed to parse ${currency} API response as JSON:`, parseError);
        // Return zero balances if we can't parse the response
        return addresses.map(address => ({
          address,
          currency,
          balance: '0',
          source: 'blockstream' as const,
          error: 'Invalid JSON response'
        }));
      }
      
      switch (currency) {
        case 'BTC':
          // Blockchair format
          if (parsedData.data) {
            for (const [address, info] of Object.entries(parsedData.data)) {
              const addressInfo = info as any;
              results.push({
                                 address,
                 currency,
                 balance: String(addressInfo.balance || 0),
                 source: 'blockstream'
              });
            }
          }
          break;

        case 'DOGE':
        case 'LTC':
          // SoChain format
          if (parsedData.data && Array.isArray(parsedData.data)) {
            parsedData.data.forEach((item: any) => {
              results.push({
                address: item.address,
                currency,
                balance: String(item.confirmed_balance || 0),
                source: 'blockstream'
              });
            });
          }
          break;

        case 'ETH':
          // Etherscan format (assuming single address for now)
          if (parsedData.result && addresses.length === 1) {
            results.push({
                           address: addresses[0],
             currency,
             balance: String(parsedData.result || 0),
             source: 'blockstream'
            });
          }
          break;

        default:
          // For other currencies, return zero balances for now
          addresses.forEach(address => {
            results.push({
              address,
              currency,
              balance: '0',
              source: 'blockstream'
            });
          });
      }
    } catch (error) {
      console.error(`Error parsing API response for ${currency}:`, error);
      
      // Return zero balances on parse error
      addresses.forEach(address => {
        results.push({
          address,
          currency,
          balance: '0',
          source: 'blockstream',
          error: 'Parse error'
        });
      });
    }
    
    return results;
  }

  /**
   * Cache external API results
   */
  private async cacheExternalResults(results: BalanceResult[], currency: CryptoCurrency): Promise<void> {
    if (results.length === 0) return;

    const now = new Date();
    const ttl = CURRENCY_CONFIGS[currency].cacheTTL;
    const expiresAt = new Date(now.getTime() + ttl);
    
    try {
      // Try to insert/update each result individually to handle constraint issues
      for (const result of results) {
        try {
          const query = `
            INSERT INTO balance_cache (address, balance, currency, source, cached_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (address) 
            DO UPDATE SET 
              balance = EXCLUDED.balance,
              currency = EXCLUDED.currency,
              source = EXCLUDED.source,
              cached_at = EXCLUDED.cached_at,
              expires_at = EXCLUDED.expires_at
          `;
          
          const params = [
            result.address,
            result.balance,
            currency,
            result.source, // Use the actual source from the result
            now,
            expiresAt
          ];
          
          await this.databaseService.executeQuery(query, params);
        } catch (error: any) {
          // If individual insert fails, try a simple insert without ON CONFLICT
          try {
            const simpleQuery = `
              INSERT INTO balance_cache (address, balance, currency, source, cached_at, expires_at)
              VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            const params = [
              result.address,
              result.balance,
              currency,
              result.source, // Use the actual source from the result
              now,
              expiresAt
            ];
            
            await this.databaseService.executeQuery(simpleQuery, params);
          } catch (insertError) {
            // Silently continue if we can't cache - don't break the whole process
            console.log(`⚠️ Cache insert failed for ${result.address}: ${error.message}`);
          }
        }
      }
      
      console.log(`💾 Cached ${results.length} ${currency} external API results (expires in ${Math.round(ttl / 60000)} min)`);
    } catch (error) {
      console.log(`⚠️ Cache operation failed for ${currency}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw - caching failures shouldn't break balance checking
    }
  }

  /**
   * Get the appropriate external source name for a currency
   */
  private getExternalSourceName(currency: CryptoCurrency): BalanceSource {
    switch (currency) {
      case 'BTC':
        return 'blockstream';
      case 'BCH':
      case 'DASH':
      case 'DOGE':
      case 'ETH':
      case 'LTC':
      case 'XRP':
      case 'ZEC':
        return 'external';
      default:
        return 'external';
    }
  }

  /**
   * Address normalization for API queries
   */
  private normalizeAddress(address: string, currency: CryptoCurrency): string {
    switch (currency) {
      case 'ETH':
        // Remove 0x prefix for our queries
        return address.startsWith('0x') ? address.slice(2) : address;
      case 'BCH':
        // Remove bitcoincash: prefix
        return address.startsWith('bitcoincash:') ? address.slice(12) : address;
      default:
        return address;
    }
  }

  /**
   * Cache cleanup job - runs every hour
   */
  private startCacheCleanupJob(): void {
    const cleanupInterval = 60 * 60 * 1000; // 1 hour
    
    setInterval(async () => {
      try {
        const now = new Date();
                 const result = await this.databaseService.executeQuery(`
           DELETE FROM balance_cache 
           WHERE expires_at < $1 AND source = 'blockstream'
         `, [now]);
        
        console.log(`🧹 Cleaned up ${result.rowCount} expired external cache entries`);
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    }, cleanupInterval);
  }

  /**
   * Utility methods
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateCacheMetrics(): void {
    const total = this.cacheMetrics.cacheHits + this.cacheMetrics.cacheMisses;
    this.cacheMetrics.cacheHitRate = total > 0 ? this.cacheMetrics.cacheHits / total : 0;
    this.cacheMetrics.apiCallReduction = 1 - (this.cacheMetrics.externalAPICalls / total);
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics };
  }

  /**
   * Clear all cache (for testing/debugging)
   */
  async clearCache(currency?: CryptoCurrency): Promise<void> {
    const query = currency 
      ? 'DELETE FROM balance_cache WHERE currency = $1'
      : 'DELETE FROM balance_cache WHERE source = $1';
    
    const params = currency ? [currency] : ['blockstream'];
         await this.databaseService.executeQuery(query, params);
     console.log(`🗑️ Cleared cache for ${currency || 'all currencies'}`);
   }
} 