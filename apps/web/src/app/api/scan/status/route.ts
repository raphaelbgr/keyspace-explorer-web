import { NextRequest, NextResponse } from 'next/server';
import { ScanningEngine } from '@/lib/services/ScanningEngine';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { handleApiError } from '@/lib/middleware/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const scanningEngine = ScanningEngine.getInstance();
    const sessions = scanningEngine.getAllSessions();

    // Convert BigInt values to strings for JSON serialization
    const serializedSessions = sessions.map(session => ({
      ...session,
      startPage: session.startPage.toString(),
      currentPage: session.currentPage.toString(),
    }));

    return NextResponse.json({
      activeSessions: serializedSessions.length,
      sessions: serializedSessions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting
export const POST = withRateLimit(GET); 