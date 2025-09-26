import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';
import { ChatFlow } from '@/lib/openai';

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config({ path: 'env.local' });
}

// Debug environment variables
console.log('🔍 API Route Environment Check:');
console.log('FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Create FirebaseService instance
const firebaseService = new FirebaseService();

export async function POST(request: NextRequest) {
  try {
    const { name, triggers, response, isActive, userId } = await request.json();

    if (!name || !triggers || triggers.length === 0 || !response || response.trim() === '') {
      return NextResponse.json(
        { error: 'Name, triggers (at least one), and response are required' },
        { status: 400 }
      );
    }

    const newFlow = {
      name,
      triggers,
      response,
      isActive: isActive || false,
      userId: userId || 'default', // Default user if not provided
    };

    const flowId = await firebaseService.saveFlow(newFlow);

    return NextResponse.json({
      success: true,
      flow: {
        id: flowId,
        ...newFlow,
      },
    });

  } catch (error) {
    console.error('Create flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Pass environment variables directly to Firebase service
    const flows = await firebaseService.getFlows();

    return NextResponse.json({
      success: true,
      flows,
    });

  } catch (error) {
    console.error('Get flows error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { flowId, name, triggers, response, isActive } = await request.json();

    if (!flowId) {
      return NextResponse.json(
        { error: 'flowId is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (triggers !== undefined) updateData.triggers = triggers;
    if (response !== undefined) updateData.response = response;
    if (isActive !== undefined) updateData.isActive = isActive;

    await firebaseService.updateFlow(flowId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Flow updated successfully',
    });

  } catch (error) {
    console.error('Update flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flowId');

    if (!flowId) {
      return NextResponse.json(
        { error: 'flowId is required' },
        { status: 400 }
      );
    }

    await firebaseService.deleteFlow(flowId);

    return NextResponse.json({
      success: true,
      message: 'Flow deleted successfully',
    });

  } catch (error) {
    console.error('Delete flow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
