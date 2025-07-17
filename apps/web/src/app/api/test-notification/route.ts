import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '../../../lib/middleware/rateLimit';
import { handleApiError } from '../../../lib/middleware/errorHandler';

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      // Test data
      const testData = {
        privateKey: "0000000000000000000000000000000000000000000000000000000000000001",
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        balance: 0.001,
        addressType: "P2PKH"
      };

      // Call the notification API
      const response = await fetch(`${request.nextUrl.origin}/api/notify-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        const result = await response.json();
        return NextResponse.json({
          success: true,
          message: 'Test notification sent successfully',
          result
        });
      } else {
        const error = await response.text();
        return NextResponse.json({
          success: false,
          message: 'Test notification failed',
          error
        }, { status: 500 });
      }

    } catch (error) {
      return handleApiError(error);
    }
  });
} 