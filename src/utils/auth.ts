import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase';

const auth = typeof window !== 'undefined' ? getAuth(app) : null;

export const signInWithGoogle = () => {
  if (!auth) return Promise.reject('Auth not initialized');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithEmail = (email: string, password: string) => {
  if (!auth) return Promise.reject('Auth not initialized');
  return signInWithEmailAndPassword(auth, email, password);
};

export const checkAuthState = (callback: (user: User | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

