import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ waId: string }> }
) {
  try {
    const { waId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Get messages and contact info from Firebase
    const messages = await FirebaseService.getMessages(waId, limit);
    const contact = await FirebaseService.getContact(waId);
    
    return NextResponse.json({
      success: true,
      contact: contact,
      messages: messages,
      count: messages.length,
      message: `Retrieved ${messages.length} messages from Firebase for ${waId}`
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}
