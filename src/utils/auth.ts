import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const checkAuthState = (callback: ( user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
}

