import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '../../../lib/middleware/rateLimit';
import { handleApiError } from '../../../lib/middleware/errorHandler';
import '../../../lib/ecc-init'; // Import ECC initialization

const generatePageSchema = z.object({
  pageNumber: z.string().min(1),
  keysPerPage: z.number().min(1).max(100).optional().default(45),
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
    const body = await request.json();
    const { pageNumber, keysPerPage } = generatePageSchema.parse(body);

    const { KeyGenerationService } = await import('../../../lib/services/KeyGenerationService');
    const service = new KeyGenerationService();
    
    const pageBigInt = parsePageNumber(pageNumber);
    const pageData = await service.generatePage(pageBigInt, keysPerPage);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedPageData = {
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
    };

    return NextResponse.json(serializedPageData);
  } catch (error) {
    console.error('Error generating page:', error);
    return NextResponse.json(
      { error: 'Failed to generate page', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting
export const GET = withRateLimit(POST); 