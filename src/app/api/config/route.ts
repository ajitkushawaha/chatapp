import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/lib/config';

export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    config,
    hasConfig: !!config
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { accessToken, phoneNumberId, verifyToken, webhookUrl } = body;
    
    if (!accessToken || !phoneNumberId || !verifyToken || !webhookUrl) {
      return NextResponse.json(
        { error: 'Missing required configuration fields' },
        { status: 400 }
      );
    }

    // Store the configuration
    setConfig({
      accessToken,
      phoneNumberId,
      verifyToken,
      webhookUrl
    });

    return NextResponse.json({
      message: 'Configuration updated successfully',
      config: {
        accessToken: accessToken.substring(0, 10) + '...',
        phoneNumberId,
        verifyToken,
        webhookUrl
      }
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// Export the config functions for use in webhook
export { getConfig };
