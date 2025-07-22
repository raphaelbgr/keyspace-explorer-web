import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '../../../lib/middleware/rateLimit';
import { handleApiError } from '../../../lib/middleware/errorHandler';
import { PrivateKey } from '../../../lib/types/keys';
import { CryptoCurrency, SUPPORTED_CURRENCIES } from '../../../lib/types/multi-currency';
import '../../../lib/ecc-init'; // Import ECC initialization

const generatePageSchema = z.object({
  pageNumber: z.string().min(1),
  keysPerPage: z.number().min(1).max(10000).optional().default(45),
  multiCurrency: z.boolean().optional().default(false), // Legacy flag for backward compatibility
  currencies: z.array(z.enum(['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'])).optional(), // New currency array parameter
});

function parsePageNumber(pageNumber: string): bigint {
  // Try to parse as BigInt directly
  try {
    return BigInt(pageNumber);
  } catch {
    // Try to parse as Number (handles scientific notation), then convert to BigInt
    const asNumber = Number(pageNumber);
    if (isNaN(asNumber) || !isFinite(asNumber)) {
      throw new Error('Invalid page number');
    }
    return BigInt(Math.floor(asNumber));
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('❌ Invalid JSON in request body:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error' },
        { status: 400 }
      );
    }
    
    const { pageNumber, keysPerPage, multiCurrency, currencies } = generatePageSchema.parse(body);

    const pageBigInt = parsePageNumber(pageNumber);
    
    // Determine which currencies to generate
    let currenciesToGenerate: CryptoCurrency[] = ['BTC']; // Default to Bitcoin only
    
    if (currencies && currencies.length > 0) {
      // Use specified currencies array
      currenciesToGenerate = currencies.filter(c => SUPPORTED_CURRENCIES.includes(c));
      console.log(`🎯 Multi-currency generation requested for: ${currenciesToGenerate.join(', ')}`);
    } else if (multiCurrency) {
      // Legacy multiCurrency flag - generate all currencies
      currenciesToGenerate = [...SUPPORTED_CURRENCIES];
      console.log(`🎯 Legacy multi-currency mode - generating all currencies: ${currenciesToGenerate.join(', ')}`);
    }
    
    const isMultiCurrencyRequest = currenciesToGenerate.length > 1 || currenciesToGenerate[0] !== 'BTC';
    
    if (isMultiCurrencyRequest) {
      // Use MultiCurrencyKeyGenerationService for multi-currency generation
      const { multiCurrencyKeyGenerationService } = await import('../../../lib/services/MultiCurrencyKeyGenerationService');
      const { KeyGenerationService } = await import('../../../lib/services/KeyGenerationService');
      
      // First generate the base keys for this page using the legacy service
      const baseService = new KeyGenerationService();
      const basePageData = await baseService.generatePage(pageBigInt, keysPerPage);
      
      console.log(`🔧 Generating ${basePageData.keys.length} keys with multi-currency addresses...`);
      const startTime = performance.now();
      
      // Then generate multi-currency addresses for each key
      const multiCurrencyKeys = await Promise.all(
        basePageData.keys.map(async (baseKey, index) => {
          const allAddresses = await multiCurrencyKeyGenerationService.generateMultiCurrencyAddresses(baseKey.privateKey);
          
          // Filter addresses to only requested currencies
          const filteredAddresses: any = {};
          currenciesToGenerate.forEach(currency => {
            if (allAddresses[currency]) {
              filteredAddresses[currency] = allAddresses[currency];
            }
          });
          
          return {
            privateKey: baseKey.privateKey,
            pageNumber: baseKey.pageNumber.toString(),
            index: baseKey.index,
            addresses: filteredAddresses,
            balances: {},
            totalBalance: 0,
          };
        })
      );
      
      const endTime = performance.now();
      const generationTime = endTime - startTime;
      
      console.log(`⚡ Multi-currency generation completed in ${generationTime.toFixed(2)}ms`);
      console.log(`📊 Performance: ${(keysPerPage / (generationTime / 1000)).toFixed(0)} keys/second`);
      
      const serializedPageData = {
        pageNumber: pageNumber,
        keys: multiCurrencyKeys,
        totalPageBalance: 0,
        generatedAt: new Date().toISOString(),
        balancesFetched: false,
        multiCurrency: true,
        currencies: currenciesToGenerate,
        metadata: {
          supportedCurrencies: currenciesToGenerate,
          totalAddressCount: multiCurrencyKeys.reduce((count: number, key) => {
            return count + Object.values(key.addresses).reduce((addrCount: number, currencyAddrs) => {
              return addrCount + (currencyAddrs && typeof currencyAddrs === 'object' ? Object.keys(currencyAddrs).length : 1);
            }, 0);
          }, 0),
          generationTime: generationTime
        }
      };

      return NextResponse.json(serializedPageData);
    } else {
      // Use legacy KeyGenerationService for current Bitcoin-only UI
      const { KeyGenerationService } = await import('../../../lib/services/KeyGenerationService');
      const service = new KeyGenerationService();
      const pageData = await service.generatePage(pageBigInt, keysPerPage);
      
      // Convert BigInt values to strings for JSON serialization (legacy format)
      const serializedPageData = {
        pageNumber: pageData.pageNumber.toString(),
        keys: pageData.keys.map((key: PrivateKey) => ({
          privateKey: key.privateKey,
          pageNumber: key.pageNumber.toString(),
          index: key.index,
          addresses: key.addresses,
          balances: key.balances,
          totalBalance: key.totalBalance,
        })),
        totalPageBalance: pageData.totalPageBalance,
        generatedAt: pageData.generatedAt.toISOString(),
        balancesFetched: pageData.balancesFetched,
        multiCurrency: false,
        currencies: ['BTC'],
        metadata: {
          supportedCurrencies: ['BTC'],
          totalAddressCount: pageData.keys.length * 5, // 5 Bitcoin address types per key
          generationTime: 0 // Not tracked for legacy mode
        }
      };

      return NextResponse.json(serializedPageData);
    }
  } catch (error) {
    console.error('Error generating page:', error);
    return handleApiError(error);
  }
}

// Apply rate limiting
export const GET = withRateLimit(POST); 