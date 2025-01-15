import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
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

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: ReturnType<typeof getFirestore>;

// Check if we're running on the client side
const initializeFirebase = () => {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
  }
};

// Initialize on import
initializeFirebase();

export { app, auth, db };