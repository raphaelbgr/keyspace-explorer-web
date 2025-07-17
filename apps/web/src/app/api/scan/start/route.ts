import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ScanningEngine } from '@/lib/services/ScanningEngine';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { handleApiError } from '@/lib/middleware/errorHandler';

const startScanSchema = z.object({
  mode: z.enum(['random', 'next', 'previous']),
  startPage: z.string().regex(/^\d+$/, 'Start page must be a valid integer string').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, startPage } = startScanSchema.parse(body);

    const scanningEngine = ScanningEngine.getInstance();
    const session = await scanningEngine.startScan(
      mode, 
      startPage ? BigInt(startPage) : undefined
    );

    // Convert BigInt values to strings for JSON serialization
    const serializedSession = {
      ...session,
      startPage: session.startPage.toString(),
      currentPage: session.currentPage.toString(),
    };

    return NextResponse.json(serializedSession);
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting
export const GET = withRateLimit(POST); 