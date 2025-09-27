import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: 'Demo User',
      plan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      user: {
        uid: user.uid,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Error creating demo user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json({
        success: true,
        message: 'Demo user already exists',
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create demo user' 
      },
      { status: 500 }
    );
  }
}
