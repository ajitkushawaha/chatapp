import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';

// GET - Fetch all broadcasts
export async function GET() {
  try {
    const firebaseService = new FirebaseService();
    const broadcasts = await firebaseService.getBroadcasts();
    
    return NextResponse.json({
      success: true,
      broadcasts: broadcasts
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcasts' },
      { status: 500 }
    );
  }
}

// POST - Create new broadcast
export async function POST(request: NextRequest) {
  try {
    const { name, message, recipients, scheduledFor } = await request.json();

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      );
    }

    const firebaseService = new FirebaseService();
    const broadcast = {
      name,
      message,
      recipients: recipients || [],
      status: scheduledFor ? 'scheduled' : 'draft',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedBroadcast = await firebaseService.saveBroadcast(broadcast);
    
    return NextResponse.json({
      success: true,
      broadcast: savedBroadcast
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to create broadcast' },
      { status: 500 }
    );
  }
}

// PUT - Update broadcast
export async function PUT(request: NextRequest) {
  try {
    const { id, name, message, recipients, status, scheduledFor } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Broadcast ID is required' },
        { status: 400 }
      );
    }

    const firebaseService = new FirebaseService();
    const updateData = {
      ...(name && { name }),
      ...(message && { message }),
      ...(recipients && { recipients }),
      ...(status && { status }),
      ...(scheduledFor && { scheduledFor: new Date(scheduledFor) }),
      updatedAt: new Date()
    };

    const updatedBroadcast = await firebaseService.updateBroadcast(id, updateData);
    
    return NextResponse.json({
      success: true,
      broadcast: updatedBroadcast
    });
  } catch (error) {
    console.error('Error updating broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to update broadcast' },
      { status: 500 }
    );
  }
}

// DELETE - Delete broadcast
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Broadcast ID is required' },
        { status: 400 }
      );
    }

    const firebaseService = new FirebaseService();
    await firebaseService.deleteBroadcast(id);
    
    return NextResponse.json({
      success: true,
      message: 'Broadcast deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to delete broadcast' },
      { status: 500 }
    );
  }
}
