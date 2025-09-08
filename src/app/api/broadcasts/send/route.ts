import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';

// Send message to WhatsApp API
async function sendWhatsAppMessage(to: string, message: string) {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: {
      preview_url: false,
      body: message
    }
  };

  const response = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const result = await response.json();
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
      result: result
    };
  } else {
    const error = await response.json();
    console.error('Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error
    };
  }
}

// POST - Send broadcast to recipients
export async function POST(request: NextRequest) {
  try {
    const { broadcastId, recipients } = await request.json();

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: 'WhatsApp configuration missing' },
        { status: 400 }
      );
    }

    if (!broadcastId) {
      return NextResponse.json(
        { error: 'Broadcast ID is required' },
        { status: 400 }
      );
    }

    const firebaseService = new FirebaseService();
    
    // Get broadcast details
    const broadcasts = await firebaseService.getBroadcasts();
    const broadcast = broadcasts.find(b => b.id === broadcastId);
    
    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Get recipients - either from request or from broadcast
    let targetRecipients = recipients;
    if (!targetRecipients || targetRecipients.length === 0) {
      // Get all contacts from Firebase
      const contacts = await FirebaseService.getContacts();
      targetRecipients = contacts.map(contact => ({
        phoneNumber: contact.waId,
        name: contact.contactName
      }));
    }

    if (!targetRecipients || targetRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found' },
        { status: 400 }
      );
    }

    console.log(`📢 Starting broadcast "${broadcast.name}" to ${targetRecipients.length} recipients`);

    const results = {
      total: targetRecipients.length,
      sent: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Send messages to each recipient
    for (const recipient of targetRecipients) {
      try {
        const result = await sendWhatsAppMessage(recipient.phoneNumber, broadcast.message);
        
        if (result.success) {
          results.sent++;
          console.log(`✅ Sent to ${recipient.name} (${recipient.phoneNumber})`);
          
          // Save the sent message to Firebase
          const messageData = {
            id: `broadcast_${Date.now()}_${recipient.phoneNumber}`,
            text: broadcast.message,
            timestamp: new Date(),
            from: 'system',
            contactName: `Broadcast: ${broadcast.name}`,
            type: 'text',
            direction: 'outbound',
            phoneNumberId: PHONE_NUMBER_ID,
            recipient: recipient.phoneNumber,
            broadcastId: broadcastId
          };
          
          await FirebaseService.saveMessage(messageData);
          
          // Update contact with broadcast message
          await FirebaseService.updateContact(
            recipient.phoneNumber, 
            recipient.name, 
            broadcast.message, 
            new Date()
          );
          
        } else {
          results.failed++;
          results.errors.push({
            recipient: recipient.phoneNumber,
            error: result.error
          });
          console.log(`❌ Failed to send to ${recipient.name} (${recipient.phoneNumber}):`, result.error);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          recipient: recipient.phoneNumber,
          error: error
        });
        console.error(`❌ Error sending to ${recipient.phoneNumber}:`, error);
      }
    }

    // Update broadcast status
    await firebaseService.updateBroadcast(broadcastId, {
      status: 'sent',
      sentAt: new Date(),
      results: results,
      updatedAt: new Date()
    });

    console.log(`📢 Broadcast completed: ${results.sent}/${results.total} sent successfully`);

    return NextResponse.json({
      success: true,
      message: `Broadcast sent to ${results.sent} out of ${results.total} recipients`,
      results: results
    });

  } catch (error) {
    console.error('Error sending broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}
