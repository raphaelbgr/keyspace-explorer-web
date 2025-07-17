import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BalanceService } from '@/lib/services/BalanceService';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { handleApiError } from '@/lib/middleware/errorHandler';

const balancesSchema = z.object({
  addresses: z.array(z.string()).max(225, 'Maximum 225 addresses allowed'),
  source: z.enum(['blockstream', 'local']).default('blockstream'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses, source } = balancesSchema.parse(body);

    const balanceService = new BalanceService();
    const balances = await balanceService.fetchBalances(addresses, source);

    return NextResponse.json({ balances });
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting
export const GET = withRateLimit(POST); 