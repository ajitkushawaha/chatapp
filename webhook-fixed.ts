import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';
import { generateAIResponse } from '@/lib/openai';

// WhatsApp Business API Configuration
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || '123456';

// AI-powered auto-reply system (temporarily disabled due to quota)
async function getAIResponse(message: string, contactName: string): Promise<string> {
  // Temporarily disabled AI due to quota exceeded
  // TODO: Re-enable after adding credits to OpenAI account
  console.log('AI temporarily disabled - using keyword-based responses');
  return await getKeywordResponse(message);
}

// Keyword-based fallback system with custom keywords from database
async function getKeywordResponse(message: string): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  try {
    // Get custom keywords from database
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/keywords`);
    const data = await response.json();
    
    if (data.success && data.keywords && data.keywords.length > 0) {
      // Check custom keywords first
      for (const keyword of data.keywords) {
        if (keyword.isActive && lowerMessage.includes(keyword.keyword.toLowerCase())) {
          console.log(`Custom keyword match: "${keyword.keyword}"`);
          return keyword.response;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching custom keywords:', error);
  }

  // Fallback to default Klance Marketing Agency responses
  const keywordResponses: { [key: string]: string } = {
    'hello': 'Hello! 👋 Welcome to Klance Marketing Agency. We craft smart, creative, and data-driven digital marketing strategies. How can I help you today?',
    'hi': 'Hi there! 😊 Thanks for reaching out to Klance Marketing. We help businesses boost visibility, attract the right audience, and turn clicks into loyal customers. What can I assist you with?',
    'help': 'I\'m here to help! 🤝 At Klance Marketing, we offer:\n• SEO (Search Engine Optimization)\n• Digital Marketing\n• Web Development\n• App Development\n• E-Commerce Development\n• Content Marketing\n\nWhat service interests you?',
    'services': 'Our services at Klance Marketing include:\n🔍 SEO - Improve your search engine visibility\n📱 Digital Marketing - Data-driven strategies\n💻 Web Development - Clean, responsive websites\n📱 App Development - iOS & Android apps\n🛒 E-Commerce - Shopify & WooCommerce stores\n📝 Content Marketing - Engaging content strategies\n\nWhich service would you like to know more about?',
    'seo': 'Great choice! 🔍 Our SEO services help improve your visibility on search engines with smart, white-hat tactics. We optimize your site to rank higher and reach the right audience. Would you like a free consultation?',
    'marketing': 'Excellent! 📈 Our digital marketing services grow your brand with data-driven strategies. We manage social media, ads, email, and content to boost your online presence. Ready to transform your digital presence?',
    'website': 'Perfect! 💻 We build fast, scalable, and user-friendly websites that are clean, responsive, and built to perform. Whether static or dynamic, we create solutions that match your goals. Interested in a custom website?',
    'app': 'Awesome! 📱 We develop conversion-focused mobile apps for Android and iOS. From idea to launch, we handle the full development lifecycle. What type of app are you thinking about?',
    'ecommerce': 'Great! 🛒 We develop conversion-focused online stores on platforms like Shopify and WooCommerce. From product setup to payment gateways — all covered. Ready to start selling online?',
    'price': 'Great question about pricing! 💰 Our services are competitively priced and tailored to your business needs. We offer free consultations to discuss your specific requirements. Would you like to schedule a consultation?',
    'contact': 'You can reach Klance Marketing through:\n📧 Email: Marketing@klance.net\n📞 Phone: +1 (437) 260-1195\n🌐 Website: https://klance.net/\n📍 Location: Etobicoke, Ontario, Canada\n\nOr just reply here for immediate assistance!',
    'consultation': 'Perfect! 🎯 We offer free consultations to discuss your digital marketing needs. Our team will analyze your business goals and create a tailored strategy. Would you like to schedule a consultation?',
    'portfolio': 'Great question! 🎨 We\'ve worked with 100+ clients on successful projects including:\n• Abbrella (Jewellery)\n• Sultan Fitness (Sports)\n• Maple Tattoo Supplies\n• Wigs R Us Toronto\n\nVisit https://klance.net/ to see our full portfolio!',
    'hours': 'Our business hours are:\n🕘 Monday - Friday: 9 AM - 6 PM EST\n🕘 Saturday: 10 AM - 4 PM EST\n🕘 Sunday: Closed\n\nWe\'re here to help during these times!',
    'thanks': 'You\'re welcome! 😊 Happy to help. At Klance Marketing, we\'re committed to driving real business growth. Let me know if you need anything else!',
    'bye': 'Goodbye! 👋 Have a great day and feel free to reach out anytime. Remember, at Klance Marketing, we don\'t just do digital marketing — we drive real business growth!',
    'default': 'Thanks for your message! 😊 At Klance Marketing, we help businesses get noticed, attract the right audience, and turn clicks into loyal customers. You can ask me about:\n• Our services (SEO, Digital Marketing, Web/App Development)\n• Pricing & consultations\n• Our portfolio\n• Contact information\n\nWhat would you like to know?'
  };

  // Check for exact keyword matches first
  for (const [keyword, response] of Object.entries(keywordResponses)) {
    if (keyword !== 'default' && lowerMessage.includes(keyword)) {
      return response;
    }
  }

  // Check for partial matches with higher priority keywords (Klance-specific)
  const priorityKeywords = ['help', 'support', 'problem', 'issue', 'price', 'cost', 'service', 'seo', 'marketing', 'website', 'app', 'ecommerce', 'consultation', 'portfolio', 'contact'];
  for (const keyword of priorityKeywords) {
    if (lowerMessage.includes(keyword)) {
      return keywordResponses[keyword];
    }
  }

  // Return default response
  return keywordResponses.default;
}

// Send auto-reply via WhatsApp API
async function sendAutoReply(waId: string, originalMessage: string, phoneNumberId: string, contactName: string): Promise<boolean> {
  if (!WHATSAPP_TOKEN) {
    console.error('No access token configured for auto-reply');
    return false;
  }

  try {
    // Get AI-powered response
    const responseMessage = await getAIResponse(originalMessage, contactName);
    
    console.log(`AI-powered response for "${originalMessage}": ${responseMessage}`);

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: waId,
      type: "text",
      text: {
        preview_url: false,
        body: responseMessage
      }
    };

    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Auto-reply sent successfully:', result);
      return true;
    } else {
      const error = await response.json();
      console.error('Failed to send auto-reply:', error);
      return false;
    }
  } catch (error) {
    console.error('Error sending auto-reply:', error);
    return false;
  }
}

// Emit message to Socket.io clients
function emitToSocket(messageData: any) {
  if ((global as any).io) {
    (global as any).io.emit('apiData', messageData);
    console.log('Message emitted to Socket.io clients:', messageData);
  } else {
    console.log('Socket.io not available, message not emitted:', messageData);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.log('Webhook verification failed');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Process webhook data
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Check if this is a message (not just status update)
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                const waId = message.from;
                const messageBody = message.text?.body || '';
                const messageType = message.type;
                const phoneNumberId = value.metadata.phone_number_id;

                // FIXED: Better contact name extraction
                let contactName = message.profile?.name;
                if (!contactName && value.contacts && value.contacts.length > 0) {
                  const contact = value.contacts.find((c: any) => c.wa_id === waId);
                  contactName = contact?.profile?.name || `User ${waId}`;
                } else {
                  contactName = contactName || `User ${waId}`;
                }

                console.log('Processing message:');
                console.log('From:', waId);
                console.log('Contact Name:', contactName);
                console.log('Message Body:', messageBody);
                console.log('Message Type:', messageType);
                console.log('Phone Number ID:', phoneNumberId);

                // Create message data for Socket.io
                const messageData = {
                  id: Date.now().toString(),
                  text: messageBody,
                  timestamp: new Date(),
                  from: waId,
                  contactName: contactName,
                  type: messageType,
                  direction: 'inbound' as const,
                  phoneNumberId: phoneNumberId
                };

                // Save message to Firebase
                try {
                  await FirebaseService.saveMessage(messageData);
                } catch (error) {
                  console.error('❌ Failed to save message to Firebase:', error);
                  // Continue processing even if Firebase fails
                }

                // Update contact information in Firebase
                try {
                  await FirebaseService.updateContact(waId, contactName, messageBody, new Date());
                  console.log(`✅ Contact updated in Firebase: ${waId} - ${contactName}`);
                } catch (error) {
                  console.error('❌ Failed to update contact in Firebase:', error);
                  // Continue processing even if Firebase fails
                }

                // Emit to Socket.io for real-time display
                emitToSocket(messageData);

                // Auto-reply to WhatsApp
                const autoReplyResult = await sendAutoReply(waId, messageBody, phoneNumberId, contactName);
                
                if (autoReplyResult) {
                  // Get the response message for Socket.io emission
                  const responseMessage = await getAIResponse(messageBody, contactName);
                  
                  // FIXED: Auto-reply associated with original user instead of separate chat
                  const autoReplyData = {
                    id: `auto_${Date.now()}`,
                    text: responseMessage,
                    timestamp: new Date(),
                    from: waId, // ✅ Associate with original user
                    contactName: `Bot Reply to ${contactName}`, // ✅ Show it's a bot reply
                    type: 'text',
                    direction: 'outbound' as const,
                    phoneNumberId: phoneNumberId,
                    originalMessage: messageBody
                  };
                  
                  // Save auto-reply to Firebase
                  try {
                    await FirebaseService.saveMessage(autoReplyData);
                  } catch (error) {
                    console.error('❌ Failed to save auto-reply to Firebase:', error);
                    // Continue processing even if Firebase fails
                  }

                  // Update contact with auto-reply message
                  try {
                    await FirebaseService.updateContact(waId, contactName, responseMessage, new Date());
                    console.log(`✅ Contact updated with auto-reply: ${waId} - ${contactName}`);
                  } catch (error) {
                    console.error('❌ Failed to update contact with auto-reply:', error);
                    // Continue processing even if Firebase fails
                  }
                  
                  // Emit auto-reply to Socket.io
                  emitToSocket(autoReplyData);
                }
              }
            } else {
              console.log('Missing required data in webhook');
            }
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
