import { NextRequest, NextResponse } from 'next/server';

// POST - Test WhatsApp API connection
export async function POST(request: NextRequest) {
  try {
    const { accessToken, phoneNumberId } = await request.json();

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: 'Access token and phone number ID are required' },
        { status: 400 }
      );
    }

    // Test the WhatsApp API connection by fetching phone number details
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: 'WhatsApp API connection successful',
        data: {
          phoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
          status: data.code_verification_status,
          qualityRating: data.quality_rating
        }
      });
    } else {
      const error = await response.json();
      return NextResponse.json(
        { 
          success: false,
          error: 'WhatsApp API connection failed',
          details: error 
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error testing WhatsApp connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test WhatsApp connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
