import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '../../../lib/middleware/rateLimit';
import { handleApiError } from '../../../lib/middleware/errorHandler';
import { PrivateKey } from '../../../lib/types/keys';
import '../../../lib/ecc-init'; // Import ECC initialization

const generatePageSchema = z.object({
  pageNumber: z.string().min(1),
  keysPerPage: z.number().min(1).max(10000).optional().default(45),
  multiCurrency: z.boolean().optional().default(false), // Flag for future multi-currency support
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
    
    const { pageNumber, keysPerPage, multiCurrency } = generatePageSchema.parse(body);

    const pageBigInt = parsePageNumber(pageNumber);
    
    if (multiCurrency) {
      // Use MultiCurrencyKeyGenerationService for full multi-currency generation
      console.log('Multi-currency mode requested - generating full page with all currencies');
      const { multiCurrencyKeyGenerationService } = await import('../../../lib/services/MultiCurrencyKeyGenerationService');
      const { KeyGenerationService } = await import('../../../lib/services/KeyGenerationService');
      
      // First generate the base keys for this page using the legacy service
      const baseService = new KeyGenerationService();
      const basePageData = await baseService.generatePage(pageBigInt, keysPerPage);
      
      // Then generate multi-currency addresses for each key
      const multiCurrencyKeys = await Promise.all(
        basePageData.keys.map(async (baseKey, index) => {
          const addresses = await multiCurrencyKeyGenerationService.generateMultiCurrencyAddresses(baseKey.privateKey);
          return {
            privateKey: baseKey.privateKey,
            pageNumber: baseKey.pageNumber.toString(),
            index: baseKey.index,
            addresses: addresses,
            balances: {},
            totalBalance: 0,
          };
        })
      );
      
      const serializedPageData = {
        pageNumber: pageNumber,
        keys: multiCurrencyKeys,
        totalPageBalance: 0,
        generatedAt: new Date().toISOString(),
        balancesFetched: false,
        multiCurrency: true
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