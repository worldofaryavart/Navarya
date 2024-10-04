import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/utils/firebase'; // Adjust this import based on your Firebase config file location

interface AuthState {
  user: User | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!,(user) => {
      setAuthState({
        user,
        loading: false,
      });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return authState;
};