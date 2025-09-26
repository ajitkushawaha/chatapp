import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';

export async function POST(request: NextRequest) {
  try {
    // Create test conversation data
    const testContacts = [
      {
        waId: '1234567890',
        contactName: 'John Doe',
        profileName: 'John',
        lastMessage: 'Hello! I need help with your services.',
        lastMessageAt: new Date(),
        messageCount: 3,
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(),
      },
      {
        waId: '0987654321',
        contactName: 'Jane Smith',
        profileName: 'Jane',
        lastMessage: 'What are your pricing plans?',
        lastMessageAt: new Date(Date.now() - 3600000), // 1 hour ago
        messageCount: 5,
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(),
      },
      {
        waId: '5555555555',
        contactName: 'Mike Johnson',
        profileName: 'Mike',
        lastMessage: 'Thanks for the quick response!',
        lastMessageAt: new Date(Date.now() - 1800000), // 30 minutes ago
        messageCount: 2,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        updatedAt: new Date(),
      }
    ];

    // Create test messages for each contact
    const testMessages = [
      // John Doe messages
      {
        id: 'msg_1',
        text: 'Hello! I need help with your services.',
        timestamp: new Date(Date.now() - 3600000),
        from: '1234567890',
        contactName: 'John Doe',
        type: 'text',
        direction: 'inbound',
        phoneNumberId: '810025062185756',
      },
      {
        id: 'msg_2',
        text: 'Hi John! I\'d be happy to help you. What specific services are you interested in?',
        timestamp: new Date(Date.now() - 3500000),
        from: '1234567890',
        contactName: 'John Doe',
        type: 'text',
        direction: 'outbound',
        phoneNumberId: '810025062185756',
        originalMessage: 'Hello! I need help with your services.',
      },
      {
        id: 'msg_3',
        text: 'I\'m looking for digital marketing services.',
        timestamp: new Date(Date.now() - 3400000),
        from: '1234567890',
        contactName: 'John Doe',
        type: 'text',
        direction: 'inbound',
        phoneNumberId: '810025062185756',
      },
      // Jane Smith messages
      {
        id: 'msg_4',
        text: 'What are your pricing plans?',
        timestamp: new Date(Date.now() - 1800000),
        from: '0987654321',
        contactName: 'Jane Smith',
        type: 'text',
        direction: 'inbound',
        phoneNumberId: '810025062185756',
      },
      {
        id: 'msg_5',
        text: 'Our pricing plans start at $29/month for the Pro plan. Would you like to schedule a consultation?',
        timestamp: new Date(Date.now() - 1700000),
        from: '0987654321',
        contactName: 'Jane Smith',
        type: 'text',
        direction: 'outbound',
        phoneNumberId: '810025062185756',
        originalMessage: 'What are your pricing plans?',
      },
      // Mike Johnson messages
      {
        id: 'msg_6',
        text: 'Thanks for the quick response!',
        timestamp: new Date(Date.now() - 900000),
        from: '5555555555',
        contactName: 'Mike Johnson',
        type: 'text',
        direction: 'inbound',
        phoneNumberId: '810025062185756',
      },
      {
        id: 'msg_7',
        text: 'You\'re welcome, Mike! Is there anything else I can help you with?',
        timestamp: new Date(Date.now() - 800000),
        from: '5555555555',
        contactName: 'Mike Johnson',
        type: 'text',
        direction: 'outbound',
        phoneNumberId: '810025062185756',
        originalMessage: 'Thanks for the quick response!',
      }
    ];

    // Save contacts to Firebase
    for (const contact of testContacts) {
      try {
        await FirebaseService.updateContact(
          contact.waId,
          contact.contactName,
          contact.lastMessage,
          contact.lastMessageAt
        );
      } catch (error) {
        console.error('Error creating test contact:', error);
      }
    }

    // Save messages to Firebase
    for (const message of testMessages) {
      try {
        await FirebaseService.saveMessage(message);
      } catch (error) {
        console.error('Error creating test message:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test conversation data created successfully',
      contactsCreated: testContacts.length,
      messagesCreated: testMessages.length
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json(
      { error: 'Failed to create test data' },
      { status: 500 }
    );
  }
}
