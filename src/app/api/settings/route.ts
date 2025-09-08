import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase-service';

// GET - Fetch settings
export async function GET() {
  try {
    const firebaseService = new FirebaseService();
    const settings = await firebaseService.getSettings();
    
    return NextResponse.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Save settings
export async function POST(request: NextRequest) {
  try {
    const settingsData = await request.json();

    if (!settingsData) {
      return NextResponse.json(
        { error: 'Settings data is required' },
        { status: 400 }
      );
    }

    const firebaseService = new FirebaseService();
    const savedSettings = await firebaseService.saveSettings(settingsData);
    
    return NextResponse.json({
      success: true,
      settings: savedSettings,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
