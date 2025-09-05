import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { Server as ServerIO } from 'socket.io';

// Extend global type to include io
declare global {
  var io: ServerIO | undefined;
}

// Import configuration from shared config
import { getConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const hubMode = searchParams.get('hub.mode');
  const hubVerifyToken = searchParams.get('hub.verify_token');
  const hubChallenge = searchParams.get('hub.challenge');

  // Use configured verify token or fallback to default
  const config = getConfig();
  const expectedVerifyToken = config?.verifyToken || '123456';

  if (hubMode === 'subscribe' && hubVerifyToken === expectedVerifyToken) {
    console.log('Webhook verified with token:', expectedVerifyToken);
    return new NextResponse(hubChallenge);
  } else {
    console.log('Webhook verification failed. Expected:', expectedVerifyToken, 'Received:', hubVerifyToken);
    return new NextResponse('Forbidden', { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract WhatsApp message data
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    if (!value) {
      return new NextResponse('Invalid webhook data', { status: 400 });
    }

    const contacts = value.contacts?.[0];
    const messages = value.messages?.[0];
    const metadata = value.metadata;

    if (!contacts || !messages || !metadata) {
      return new NextResponse('Missing required data', { status: 400 });
    }

    const waId = contacts.wa_id;
    const contactName = contacts.profile?.name;
    const messageBody = messages.text?.body;
    const messageType = messages.type;
    const phoneNumberId = metadata.phone_number_id;

    console.log("===========================");
    console.log('Phone Number From:', waId);
    console.log('Contact Name:', contactName);
    console.log('Message Body:', messageBody);
    console.log('Message Type:', messageType);

    // Emit to Socket.io for real-time display
    console.log('Message received for Socket.io broadcast:', messageBody);
    
    // Emit to all connected clients via Socket.io
    if (global.io) {
      global.io.emit('apiData', messageBody);
    }

    // Auto-reply to WhatsApp
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: waId,
      type: "text",
      text: {
        preview_url: false,
        body: `Hello SlowCoder, Your message received: "${messageBody}"`
      }
    };

    // Use configured access token or fallback to environment variable
    const config = getConfig();
    const accessToken = config?.accessToken || process.env.WHATSAPP_TOKEN;
    
    if (!accessToken) {
      console.error('No WhatsApp access token configured');
      return new NextResponse('Access token not configured', { status: 500 });
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`
    };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        payload,
        { headers }
      );

      console.log('Message sent successfully:', response?.data);

      const contact = response?.data?.contacts?.[0];
      if (contact) {
        console.log(`Message sent to: ${contact?.input}`);
      } else {
        console.error('No contacts returned in the response');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseData = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: unknown } }).response?.data 
        : null;
      console.error('Error sending message:', responseData || errorMessage);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
