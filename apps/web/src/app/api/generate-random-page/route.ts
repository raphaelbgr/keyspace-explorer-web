import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '../../../lib/middleware/rateLimit';
import { handleApiError } from '../../../lib/middleware/errorHandler';
import { CryptoCurrency, SUPPORTED_CURRENCIES } from '../../../lib/types/multi-currency';
import '../../../lib/ecc-init'; // Import ECC initialization

const generateRandomPageSchema = z.object({
  keysPerPage: z.number().min(1).max(10000).optional().default(45),
  multiCurrency: z.boolean().optional().default(false), // Legacy flag for backward compatibility
  currencies: z.array(z.enum(['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'])).optional(), // New currency array parameter
  generateFullPage: z.boolean().optional().default(false), // Flag to generate full page data instead of just page number
});

export async function POST(request: NextRequest) {
  try {
    let body = {};
    
    // Handle both POST with body and POST without body (for backward compatibility)
    try {
      const requestText = await request.text();
      if (requestText) {
        body = JSON.parse(requestText);
      }
    } catch (jsonError) {
      // If no valid JSON body, use defaults
      console.log('Using default parameters for random page generation');
    }
    
    const { keysPerPage, multiCurrency, currencies, generateFullPage } = generateRandomPageSchema.parse(body);
    
    const { KeyGenerationService } = await import('../../../lib/services/KeyGenerationService');
    const service = new KeyGenerationService();
    
    const randomPage = service.generateSecureRandomPage();
    
    // If only page number requested (legacy behavior), return just the page number
    if (!generateFullPage) {
      return NextResponse.json({ 
        randomPage: randomPage.toString() 
      });
    }
    
    // Generate full page data with multi-currency support
    console.log(`🎲 Generating random page ${randomPage} with full data...`);
    
    // Determine which currencies to generate
    let currenciesToGenerate: CryptoCurrency[] = ['BTC']; // Default to Bitcoin only
    
    if (currencies && currencies.length > 0) {
      // Use specified currencies array
      currenciesToGenerate = currencies.filter(c => SUPPORTED_CURRENCIES.includes(c));
      console.log(`🎯 Multi-currency random generation for: ${currenciesToGenerate.join(', ')}`);
    } else if (multiCurrency) {
      // Legacy multiCurrency flag - generate all currencies
      currenciesToGenerate = [...SUPPORTED_CURRENCIES];
      console.log(`🎯 Legacy multi-currency random mode - generating all currencies: ${currenciesToGenerate.join(', ')}`);
    }
    
    const isMultiCurrencyRequest = currenciesToGenerate.length > 1 || currenciesToGenerate[0] !== 'BTC';
    
    if (isMultiCurrencyRequest) {
      // Use MultiCurrencyKeyGenerationService for multi-currency generation
      const { multiCurrencyKeyGenerationService } = await import('../../../lib/services/MultiCurrencyKeyGenerationService');
      
      // Generate the base keys for the random page
      const basePageData = await service.generatePage(randomPage, keysPerPage);
      
      console.log(`🔧 Generating ${basePageData.keys.length} random keys with multi-currency addresses...`);
      const startTime = performance.now();
      
      // Generate multi-currency addresses for each key
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
      
      console.log(`⚡ Multi-currency random generation completed in ${generationTime.toFixed(2)}ms`);
      console.log(`📊 Performance: ${(keysPerPage / (generationTime / 1000)).toFixed(0)} keys/second`);
      
      return NextResponse.json({
        randomPage: randomPage.toString(),
        pageData: {
          pageNumber: randomPage.toString(),
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
            generationTime: generationTime,
            isRandomGeneration: true
          }
        }
      });
    } else {
      // Generate Bitcoin-only random page data
      const pageData = await service.generatePage(randomPage, keysPerPage);
      
      console.log(`🔧 Generated random Bitcoin page ${randomPage} with ${pageData.keys.length} keys`);
      
      return NextResponse.json({
        randomPage: randomPage.toString(),
        pageData: {
          pageNumber: pageData.pageNumber.toString(),
          keys: pageData.keys.map(key => ({
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
            generationTime: 0, // Not tracked for legacy mode
            isRandomGeneration: true
          }
        }
      });
    }
  } catch (error) {
    console.error('Error generating random page:', error);
    return handleApiError(error);
  }
}

// Apply rate limiting
export const GET = withRateLimit(POST); 