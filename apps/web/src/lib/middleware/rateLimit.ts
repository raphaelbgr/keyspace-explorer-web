import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting (for development)
// In production, use Redis or similar
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 1000; // 1000 requests per minute (much higher for development/testing)

export const withRateLimit = (handler: Function) => {
  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const now = Date.now();
    
    const userRequests = requestCounts.get(ip);
    
    if (!userRequests || now > userRequests.resetTime) {
      // First request or window expired
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
    } else if (userRequests.count >= MAX_REQUESTS) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
            details: {
              retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
            },
          },
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((userRequests.resetTime - now) / 1000).toString(),
          },
        }
      );
    } else {
      // Increment count
      userRequests.count++;
    }
    
    return handler(request);
  };
}; 