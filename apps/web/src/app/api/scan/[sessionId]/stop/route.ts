import { NextRequest, NextResponse } from 'next/server';
import { ScanningEngine } from '@/lib/services/ScanningEngine';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { handleApiError } from '@/lib/middleware/errorHandler';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const scanningEngine = ScanningEngine.getInstance();
    await scanningEngine.stopScan(sessionId);

    return NextResponse.json({ 
      success: true, 
      message: `Scan session ${sessionId} stopped successfully` 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting
export const GET = withRateLimit(POST); 