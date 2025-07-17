import { NextRequest, NextResponse } from 'next/server';
import { KeyGenerationService } from '../../../lib/services/KeyGenerationService';

export async function POST(request: NextRequest) {
  try {
    const keyService = new KeyGenerationService();
    
    // Generate a random page number using a robust random generator
    const randomPage = keyService.generateSecureRandomPage();
    
    // Generate the page data
    const pageData = await keyService.generatePage(randomPage);
    
    return NextResponse.json({
      pageNumber: pageData.pageNumber.toString(),
      keys: pageData.keys.map(key => ({
        ...key,
        pageNumber: key.pageNumber.toString(), // Convert BigInt to string
      })),
      totalPageBalance: pageData.totalPageBalance,
      generatedAt: pageData.generatedAt.toISOString(),
      balancesFetched: pageData.balancesFetched,
    });
  } catch (error) {
    console.error('Error generating random page:', error);
    return NextResponse.json(
      { error: 'Failed to generate random page' },
      { status: 500 }
    );
  }
} 