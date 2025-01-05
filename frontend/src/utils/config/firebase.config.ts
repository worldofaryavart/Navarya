import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC47S8ZtUNn4BykQMJscO1pBhjz9LdkaY4",
  authDomain: "aaryai.firebaseapp.com",
  projectId: "aaryai",
  storageBucket: "aaryai.appspot.com",
  messagingSenderId: "17638987596",
  appId: "1:17638987596:web:82dcba0368fad70284e1e9",
  measurementId: "G-2MWW1LB3QG"
};

let app: FirebaseApp | undefined;
let auth: import('firebase/auth').Auth | undefined;
let db: import('firebase/firestore').Firestore | undefined;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export const getAuthInstance = () => {
  if (!auth && app) {
    auth = getAuth(app);
  }
  return auth;
};

// Function to wait for auth to initialize
export const waitForAuth = () => {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject(new Error('Auth not initialized'));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

export { app, auth, db };