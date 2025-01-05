import { NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getAuthInstance } from '@/utils/config/firebase.config';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const auth = getAuthInstance();

    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase auth not initialized' },
        { status: 500 }
      );
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    return NextResponse.json({ 
      message: 'User created successfully',
      uid: user.uid 
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 400 }
    );
  }
}
