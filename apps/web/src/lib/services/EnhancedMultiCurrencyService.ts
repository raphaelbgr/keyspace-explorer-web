/**
 * Enhanced Multi-Currency Service
 * Provides advanced multi-currency generation with error handling, timeouts, and graceful degradation
 */

import { 
  CryptoCurrency, 
  SUPPORTED_CURRENCIES, 
  CURRENCY_CONFIGS, 
  API_TIMEOUTS, 
  ERROR_CODES,
  CurrencyError,
  CurrencySuccess,
  PerformanceMetrics,
  MultiCurrencyAPIResponse,
  CurrencyAddressMap
} from '../types/multi-currency';
import { multiCurrencyKeyGenerationService } from './MultiCurrencyKeyGenerationService';

export interface GenerationOptions {
  timeoutMs?: number;
  gracefulDegradation?: boolean;
  maxMemoryUsage?: number; // MB
  enableCompression?: boolean;
}

export interface GenerationResult {
  success: boolean;
  addresses?: Partial<CurrencyAddressMap>;
  errors: CurrencyError[];
  successfulCurrencies: CurrencySuccess[];
  metrics: PerformanceMetrics;
  compressed?: boolean;
}

export class EnhancedMultiCurrencyService {
  private readonly DEFAULT_OPTIONS: GenerationOptions = {
    timeoutMs: API_TIMEOUTS.total,
    gracefulDegradation: API_TIMEOUTS.gracefulDegradation,
    maxMemoryUsage: 200, // 200MB limit
    enableCompression: true
  };

  /**
   * Generate multi-currency addresses with enhanced error handling and timeout support
   */
  async generateWithEnhancements(
    privateKey: string,
    currencies: CryptoCurrency[],
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = performance.now();
    const initialMemory = this.getMemoryUsage();
    
    const errors: CurrencyError[] = [];
    const successfulCurrencies: CurrencySuccess[] = [];
    const currencyTimings: Record<CryptoCurrency, number> = {} as Record<CryptoCurrency, number>;
    let addresses: Partial<CurrencyAddressMap> = {};
    let peakMemory = initialMemory;

    console.log(`🚀 Enhanced multi-currency generation for ${currencies.length} currencies with timeout ${opts.timeoutMs}ms`);

    // Validate currencies
    const validCurrencies = this.validateCurrencies(currencies, errors);
    
    if (validCurrencies.length === 0) {
      return this.createFailureResult(errors, currencyTimings, startTime, initialMemory, peakMemory);
    }

    // Generate addresses with timeout and error handling
    const generationPromises = validCurrencies.map(currency => 
      this.generateSingleCurrency(privateKey, currency, opts.timeoutMs!)
    );

    try {
      // Race against overall timeout
      const results = await Promise.race([
        Promise.allSettled(generationPromises),
        this.createTimeoutPromise(opts.timeoutMs!)
      ]);

      if (results === 'TIMEOUT') {
        errors.push({
          currency: 'BTC', // Generic error
          error: 'Overall generation timeout exceeded',
          code: ERROR_CODES.CURRENCY_TIMEOUT,
          details: `Generation exceeded ${opts.timeoutMs}ms timeout`
        });
        
        if (!opts.gracefulDegradation) {
          return this.createFailureResult(errors, currencyTimings, startTime, initialMemory, peakMemory);
        }
      } else {
        // Process individual results
        results.forEach((result, index) => {
          const currency = validCurrencies[index];
          const currencyStartTime = performance.now();
          
          if (result.status === 'fulfilled') {
            const currencyAddresses = result.value;
            addresses[currency] = currencyAddresses;
            
            const currencyEndTime = performance.now();
            const currencyTime = currencyEndTime - currencyStartTime;
            currencyTimings[currency] = currencyTime;
            
            successfulCurrencies.push({
              currency,
              addressCount: this.getAddressCount(currencyAddresses),
              generationTime: currencyTime
            });
            
            console.log(`✅ ${currency} generation completed in ${currencyTime.toFixed(2)}ms`);
          } else {
            const error = result.reason;
            errors.push({
              currency,
              error: error.message || 'Unknown generation error',
              code: ERROR_CODES.CURRENCY_GENERATION_FAILED,
              details: error.stack || 'No additional details'
            });
            
            console.error(`❌ ${currency} generation failed:`, error);
          }
        });
      }

      // Check memory usage
      const currentMemory = this.getMemoryUsage();
      peakMemory = Math.max(peakMemory, currentMemory);
      
      if (currentMemory > opts.maxMemoryUsage!) {
        const memoryError: CurrencyError = {
          currency: 'BTC', // Generic
          error: `Memory usage exceeded limit: ${currentMemory}MB > ${opts.maxMemoryUsage}MB`,
          code: ERROR_CODES.MEMORY_LIMIT_EXCEEDED,
          details: `Peak memory usage: ${peakMemory}MB`
        };
        errors.push(memoryError);
        
        if (!opts.gracefulDegradation) {
          return this.createFailureResult(errors, currencyTimings, startTime, initialMemory, peakMemory);
        }
      }

    } catch (error) {
      console.error('Unexpected error during multi-currency generation:', error);
      errors.push({
        currency: 'BTC', // Generic
        error: error instanceof Error ? error.message : 'Unknown error',
        code: ERROR_CODES.CURRENCY_GENERATION_FAILED,
        details: error instanceof Error ? error.stack : 'No stack trace'
      });
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    const metrics: PerformanceMetrics = {
      requestStartTime: startTime,
      requestEndTime: endTime,
      totalDuration,
      generationTime: totalDuration,
      memoryUsage: {
        beforeGeneration: initialMemory,
        afterGeneration: this.getMemoryUsage(),
        peakUsage: peakMemory
      },
      currencyTimings
    };

    console.log(`🏁 Multi-currency generation completed: ${successfulCurrencies.length} successful, ${errors.length} errors`);
    
    return {
      success: successfulCurrencies.length > 0,
      addresses: Object.keys(addresses).length > 0 ? addresses : undefined,
      errors,
      successfulCurrencies,
      metrics,
      compressed: opts.enableCompression
    };
  }

  /**
   * Create a properly formatted API response with enhanced metadata
   */
  createAPIResponse(
    pageNumber: string,
    keys: any[],
    generationResults: GenerationResult[],
    isRandomGeneration = false
  ): MultiCurrencyAPIResponse {
    const allErrors: CurrencyError[] = [];
    const allSuccesses: CurrencySuccess[] = [];
    const warnings: string[] = [];
    let totalGenerationTime = 0;
    let totalAddressCount = 0;
    
    // Aggregate results from all keys
    generationResults.forEach(result => {
      allErrors.push(...result.errors);
      allSuccesses.push(...result.successfulCurrencies);
      totalGenerationTime += result.metrics.totalDuration;
      
      result.successfulCurrencies.forEach(success => {
        totalAddressCount += success.addressCount;
      });
    });

    // Generate warnings for partial failures
    if (allErrors.length > 0 && allSuccesses.length > 0) {
      warnings.push(`Partial generation success: ${allSuccesses.length} currencies succeeded, ${allErrors.length} failed`);
    }

    const supportedCurrencies = [...new Set(allSuccesses.map(s => s.currency))];
    
    return {
      success: allSuccesses.length > 0,
      pageNumber,
      keys,
      totalPageBalance: 0,
      generatedAt: new Date().toISOString(),
      balancesFetched: false,
      multiCurrency: true,
      currencies: supportedCurrencies,
      metadata: {
        supportedCurrencies,
        totalAddressCount,
        generationTime: totalGenerationTime / keys.length, // Average per key
        isRandomGeneration,
        currencyResults: allSuccesses,
        currencyErrors: allErrors.length > 0 ? allErrors : undefined,
        compressionUsed: generationResults.some(r => r.compressed),
        responseSize: this.estimateResponseSize(keys)
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Generate addresses for a single currency with timeout
   */
  private async generateSingleCurrency(
    privateKey: string,
    currency: CryptoCurrency,
    timeoutMs: number
  ): Promise<any> {
    const currencyTimeout = Math.min(timeoutMs, API_TIMEOUTS.perCurrency);
    
    return Promise.race([
      this.generateCurrencyAddresses(privateKey, currency),
      this.createTimeoutPromise(currencyTimeout, `${currency} generation timeout`)
    ]);
  }

  /**
   * Generate addresses for a specific currency
   */
  private async generateCurrencyAddresses(privateKey: string, currency: CryptoCurrency): Promise<any> {
    const allAddresses = await multiCurrencyKeyGenerationService.generateMultiCurrencyAddresses(privateKey);
    return allAddresses[currency];
  }

  /**
   * Create a timeout promise that rejects after specified time
   */
  private createTimeoutPromise(timeoutMs: number, message = 'Operation timeout'): Promise<'TIMEOUT'> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    });
  }

  /**
   * Validate currency array and add errors for invalid currencies
   */
  private validateCurrencies(currencies: CryptoCurrency[], errors: CurrencyError[]): CryptoCurrency[] {
    const validCurrencies: CryptoCurrency[] = [];
    
    currencies.forEach(currency => {
      if (SUPPORTED_CURRENCIES.includes(currency)) {
        validCurrencies.push(currency);
      } else {
        errors.push({
          currency,
          error: `Unsupported currency: ${currency}`,
          code: ERROR_CODES.INVALID_CURRENCY,
          details: `Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`
        });
      }
    });
    
    return validCurrencies;
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        return Math.round(usage.heapUsed / 1024 / 1024); // Convert to MB
      }
    } catch (error) {
      console.warn('Could not get memory usage:', error);
    }
    return 0;
  }

  /**
   * Count addresses in a currency address object
   */
  private getAddressCount(addresses: any): number {
    if (!addresses || typeof addresses !== 'object') return 0;
    return Object.keys(addresses).length;
  }

  /**
   * Estimate response size in bytes
   */
  private estimateResponseSize(keys: any[]): number {
    try {
      return JSON.stringify(keys).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create a failure result object
   */
  private createFailureResult(
    errors: CurrencyError[],
    currencyTimings: Record<CryptoCurrency, number>,
    startTime: number,
    initialMemory: number,
    peakMemory: number
  ): GenerationResult {
    const endTime = performance.now();
    
    return {
      success: false,
      errors,
      successfulCurrencies: [],
      metrics: {
        requestStartTime: startTime,
        requestEndTime: endTime,
        totalDuration: endTime - startTime,
        generationTime: endTime - startTime,
        memoryUsage: {
          beforeGeneration: initialMemory,
          afterGeneration: this.getMemoryUsage(),
          peakUsage: peakMemory
        },
        currencyTimings
      }
    };
  }
}

// Singleton instance
export const enhancedMultiCurrencyService = new EnhancedMultiCurrencyService(); 