import { NextRequest, NextResponse } from 'next/server';
import { MultiCurrencyBalanceService } from '../../../lib/services/MultiCurrencyBalanceService';
import { CryptoCurrency, SUPPORTED_CURRENCIES } from '../../../lib/types/multi-currency';
import { handleApiError } from '../../../lib/middleware/errorHandler';
import { withRateLimit } from '../../../lib/middleware/rateLimit';
import { AddressFormatDetector } from '../../../lib/utils/addressFormatDetector';

// Initialize services
const balanceService = new MultiCurrencyBalanceService();

async function handlePOST(request: NextRequest) {
  try {

    const body = await request.json();
    const { addresses, private_keys, currencies, forceRefresh = false, forceLocal = true } = body;

    let finalAddresses: string[] = [];
    let privateKeyCount = 0;

    // Handle new private key format
    if (private_keys && typeof private_keys === 'object') {
      console.log(`🔐 Processing private key format request`);
      
      const privateKeyAddresses: string[] = [];
      privateKeyCount = Object.keys(private_keys).length;
      
      // Extract addresses from private key structure
      Object.entries(private_keys).forEach(([privateKey, currencyMap]: [string, any]) => {
        if (typeof currencyMap === 'object') {
          Object.entries(currencyMap).forEach(([currency, addressMap]: [string, any]) => {
            if (typeof addressMap === 'object') {
              Object.values(addressMap).forEach((address: any) => {
                if (typeof address === 'string' && address.length > 0) {
                  privateKeyAddresses.push(address);
                }
              });
            }
          });
        }
      });

      finalAddresses = privateKeyAddresses;
      console.log(`🔐 Extracted ${finalAddresses.length} addresses from ${privateKeyCount} private keys`);
      
    } else if (addresses && Array.isArray(addresses)) {
      // Handle legacy address array format
      console.log(`📋 Processing legacy address array format`);
      finalAddresses = addresses;
    } else {
      return NextResponse.json(
        { error: 'Either addresses array or private_keys object is required' },
        { status: 400 }
      );
    }

    // Validate final addresses
    if (finalAddresses.length === 0) {
      return NextResponse.json(
        { error: 'No valid addresses found in request' },
        { status: 400 }
      );
    }

    if (finalAddresses.length > 100000000) {
      return NextResponse.json(
        { error: 'Maximum 100,000,000 addresses allowed per request' },
        { status: 400 }
      );
    }

        // Use address format detection to optimize balance checking
    console.log(`🔍 Balance check request: ${finalAddresses.length} addresses`);
    console.log(`🔍 Sample addresses:`, finalAddresses.slice(0, 5));

    // Detect address formats and optimize currency queries
    const optimization = AddressFormatDetector.getOptimizedCurrencyList(finalAddresses);
    const { currencyToAddresses, detectionResults, optimizationStats } = optimization;

    console.log(`🚀 Address format optimization:`, optimizationStats);
    
    // Apply currency filtering if currencies are explicitly specified
    let finalCurrencyToAddresses = currencyToAddresses;
    
    if (currencies && Array.isArray(currencies) && currencies.length > 0) {
      const requestedCurrencies = currencies.filter((c: string) => SUPPORTED_CURRENCIES.includes(c as CryptoCurrency)) as CryptoCurrency[];
      console.log(`🎯 Currency filtering: only checking for ${requestedCurrencies.join(', ')}`);
      
      // Still use address format detection, but filter to only requested currencies
      finalCurrencyToAddresses = {
        BTC: [],
        BCH: [],
        DASH: [],
        DOGE: [],
        ETH: [],
        LTC: [],
        XRP: [],
        ZEC: []
      };
      
      // For each requested currency, only include addresses that support it
      requestedCurrencies.forEach(currency => {
        if (currencyToAddresses[currency] && currencyToAddresses[currency].length > 0) {
          finalCurrencyToAddresses[currency] = currencyToAddresses[currency];
        }
      });
      
      console.log(`✅ Optimized currency filtering applied - only relevant addresses per currency`);
    }

    // Process each currency with its relevant addresses
    const balancePromises = Object.entries(finalCurrencyToAddresses)
      .filter(([_, addressList]) => addressList.length > 0)
      .map(async ([currency, addressList]) => {
        console.log(`🌐 Processing ${currency} with ${addressList.length} relevant addresses`);
        const response = await balanceService.checkBalances({
          currency: currency as CryptoCurrency,
          addresses: addressList,
          forceRefresh,
          forceLocal
        });

        return {
          currencyType: currency as CryptoCurrency,
          addressList,
          ...response
        };
      });

    const balanceResponses = await Promise.all(balancePromises);

    // Aggregate results with optimized structure
    const aggregatedResults: Record<string, Record<CryptoCurrency, { balance: string; source: string }>> = {};
    let totalCacheHits = 0;
    let totalCacheMisses = 0;
    let totalExternalAPICalls = 0;

    // Process results by currency - only include currencies that were actually checked
    const addressToCurrenciesMap: Record<string, Set<CryptoCurrency>> = {};
    
    balanceResponses.forEach(response => {
      totalCacheHits += response.cacheHits;
      totalCacheMisses += response.cacheMisses;
      totalExternalAPICalls += response.externalAPICalls;

      // Track which currencies were checked for each address
      response.addressList.forEach(address => {
        if (!addressToCurrenciesMap[address]) {
          addressToCurrenciesMap[address] = new Set();
        }
        addressToCurrenciesMap[address].add(response.currencyType);
      });

      response.results.forEach(result => {
        if (!aggregatedResults[result.address]) {
          aggregatedResults[result.address] = {} as Record<CryptoCurrency, { balance: string; source: string }>;
        }
        
        aggregatedResults[result.address][response.currencyType] = {
          balance: result.balance,
          source: result.source
        };
      });
    });

    // Calculate performance metrics
    const totalRequests = totalCacheHits + totalCacheMisses;
    const cacheHitRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;
    const apiCallReduction = totalRequests > 0 ? ((totalRequests - totalExternalAPICalls) / totalRequests) * 100 : 0;

    console.log(`✅ Balance check completed: ${Object.keys(aggregatedResults).length} addresses, ${cacheHitRate.toFixed(1)}% cache hit rate`);

    // Get list of currencies that were actually checked
    const currenciesChecked = Object.keys(finalCurrencyToAddresses).filter(
      currency => finalCurrencyToAddresses[currency as CryptoCurrency].length > 0
    ) as CryptoCurrency[];

    return NextResponse.json({
      success: true,
      balances: aggregatedResults,
      metadata: {
        totalAddresses: finalAddresses.length,
        currenciesChecked,
        optimizationStats,
        cacheHits: totalCacheHits,
        cacheMisses: totalCacheMisses,
        externalAPICalls: totalExternalAPICalls,
        cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
        apiCallReduction: `${apiCallReduction.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        ...(privateKeyCount > 0 && { totalPrivateKeys: privateKeyCount })
      }
    });

  } catch (error) {
    console.error('Balance check API error:', error);
    return handleApiError(error);
  }
}

// GET endpoint for cache metrics and status
async function handleGET(request: NextRequest) {
  try {

    const cacheMetrics = balanceService.getCacheMetrics();
    
    return NextResponse.json({
      success: true,
      cacheMetrics: {
        totalRequests: cacheMetrics.totalRequests,
        cacheHits: cacheMetrics.cacheHits,
        cacheMisses: cacheMetrics.cacheMisses,
        externalAPICalls: cacheMetrics.externalAPICalls,
        cacheHitRate: `${(cacheMetrics.cacheHitRate * 100).toFixed(1)}%`,
        apiCallReduction: `${(cacheMetrics.apiCallReduction * 100).toFixed(1)}%`,
        averageResponseTime: `${cacheMetrics.averageResponseTime.toFixed(0)}ms`
      },
      supportedCurrencies: SUPPORTED_CURRENCIES,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Balance metrics API error:', error);
    return handleApiError(error);
  }
}

// DELETE endpoint for cache management
async function handleDELETE(request: NextRequest) {
    try {

    const url = new URL(request.url);
    const currency = url.searchParams.get('currency') as CryptoCurrency | null;

    if (currency && !SUPPORTED_CURRENCIES.includes(currency)) {
      return NextResponse.json(
        { error: `Unsupported currency: ${currency}. Supported: ${SUPPORTED_CURRENCIES.join(', ')}` },
        { status: 400 }
      );
    }

    await balanceService.clearCache(currency || undefined);

    return NextResponse.json({
      success: true,
      message: currency 
        ? `Cache cleared for ${currency}` 
        : 'All external cache cleared',
      timestamp: new Date().toISOString()
        });

    } catch (error) {
    console.error('Cache clear API error:', error);
    return handleApiError(error);
  }
}

// Apply rate limiting to all endpoints
export const POST = withRateLimit(handlePOST);
export const GET = withRateLimit(handleGET);
export const DELETE = withRateLimit(handleDELETE); 