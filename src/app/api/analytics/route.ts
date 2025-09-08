import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return empty analytics until Firebase is properly configured
    return NextResponse.json({
      success: true,
      analytics: null,
      message: 'Firebase not configured - returning empty analytics'
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
