import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { KeyGenerationService } from '@/lib/services/KeyGenerationService';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { handleApiError } from '@/lib/middleware/errorHandler';

const generatePageSchema = z.object({
  pageNumber: z.string().regex(/^\d+$/, 'Page number must be a valid integer string'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageNumber } = generatePageSchema.parse(body);

    const keyService = new KeyGenerationService();
    const pageData = await keyService.generatePage(BigInt(pageNumber));

    // Convert BigInt values to strings for JSON serialization
    const serializedPageData = {
      ...pageData,
      pageNumber: pageData.pageNumber.toString(),
      keys: pageData.keys.map(key => ({
        ...key,
        pageNumber: key.pageNumber.toString(),
      })),
    };

    return NextResponse.json(serializedPageData);
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting
export const GET = withRateLimit(POST); 