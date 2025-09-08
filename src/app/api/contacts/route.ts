import { NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';

export async function GET() {
  try {
    // Get contacts from Firebase
    const contacts = await FirebaseService.getContacts();
    
    return NextResponse.json({
      success: true,
      contacts: contacts,
      count: contacts.length,
      message: 'Contacts retrieved from Firebase'
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    return NextResponse.json(
      { error: 'Failed to get contacts' },
      { status: 500 }
    );
  }
}
