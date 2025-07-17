import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export const handleApiError = (error: any): NextResponse => {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  // Log error for debugging
  console.error(`[${requestId}] API Error:`, {
    error: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
  });

  // Handle known error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp,
          requestId,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle validation errors
  if (error.name === 'ZodError') {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: { validation: error.errors },
          timestamp,
          requestId,
        },
      },
      { status: 400 }
    );
  }

  // Handle external API errors
  if (error.response?.status) {
    const statusCode = error.response.status >= 500 ? 503 : 400;
    return NextResponse.json(
      {
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'External service error',
          details: {
            service: error.config?.baseURL,
            status: error.response.status,
          },
          timestamp,
          requestId,
        },
      },
      { status: statusCode }
    );
  }

  // Default server error
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Internal server error',
        timestamp,
        requestId,
      },
    },
    { status: 500 }
  );
}; 