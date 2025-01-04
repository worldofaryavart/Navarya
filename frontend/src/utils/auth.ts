import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase';
import { useEffect, useState } from 'react';

const getAuthInstance = () => {
  if (typeof window !== 'undefined') {
    return getAuth(app);
  }
  return null;
};

export const signInWithGoogle = async () => {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Auth not initialized');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithEmail = async (email: string, password: string) => {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    // After successful signup, automatically sign in
    await signInWithEmail(email, password);
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const checkAuthState = (callback: (user: User | null) => void) => {
  const auth = getAuthInstance();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};
