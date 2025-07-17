import { NextRequest, NextResponse } from 'next/server';
import '../../../lib/ecc-init'; // Import ECC initialization

export async function POST(request: NextRequest) {
  try {
    const { KeyGenerationService } = await import('../../../lib/services/KeyGenerationService');
    const service = new KeyGenerationService();
    
    const randomPage = service.generateSecureRandomPage();
    
    // Convert BigInt to string for JSON serialization
    return NextResponse.json({ 
      randomPage: randomPage.toString() 
    });
  } catch (error) {
    console.error('Error generating random page:', error);
    return NextResponse.json(
      { error: 'Failed to generate random page', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 