import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateAIResponse, ChatMessage } from '@/lib/openai';
import { ChatFlow } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, userId, conversationId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Get user's active flows
    const flowsQuery = query(
      collection(db, 'flows'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    const flowsSnapshot = await getDocs(flowsQuery);
    const flows: ChatFlow[] = flowsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as ChatFlow[];

    // Get conversation history
    const conversationQuery = query(
      collection(db, 'conversations'),
      where('conversationId', '==', conversationId || 'default'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const conversationSnapshot = await getDocs(conversationQuery);
    const conversationHistory: ChatMessage[] = conversationSnapshot.docs
      .reverse()
      .map(doc => {
        const data = doc.data();
        return {
          role: data.role as 'user' | 'assistant',
          content: data.message,
        };
      });

    // Generate AI response
    const aiResponse = await generateAIResponse(message, conversationHistory, flows);

    // Save user message
    const userMessageRef = await addDoc(collection(db, 'conversations'), {
      conversationId: conversationId || 'default',
      userId,
      message,
      role: 'user',
      timestamp: new Date(),
      type: 'text',
    });

    // Save bot response
    const botMessageRef = await addDoc(collection(db, 'conversations'), {
      conversationId: conversationId || 'default',
      userId,
      message: aiResponse,
      role: 'assistant',
      timestamp: new Date(),
      type: 'text',
    });

    return NextResponse.json({
      success: true,
      response: aiResponse,
      messageId: botMessageRef.id,
      conversationId: conversationId || 'default',
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get conversation history
    const conversationQuery = query(
      collection(db, 'conversations'),
      where('conversationId', '==', conversationId || 'default'),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );
    const conversationSnapshot = await getDocs(conversationQuery);
    const messages = conversationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));

    return NextResponse.json({
      success: true,
      messages,
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
