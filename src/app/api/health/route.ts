import { NextResponse } from 'next/server';

export async function GET() {
  const hasAccessToken = !!process.env.WHATSAPP_TOKEN;
  const hasPhoneNumberId = !!process.env.PHONE_NUMBER_ID;
  const verifyToken = process.env.VERIFY_TOKEN || '123456';
  const webhookUrl = process.env.WEBHOOK_URL || '';

  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    config: {
      hasAccessToken,
      hasPhoneNumberId,
      verifyToken,
      webhookUrl
    }
  });
}
