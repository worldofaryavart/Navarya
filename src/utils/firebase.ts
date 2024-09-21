import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Analytics, getAnalytics } from "firebase/analytics";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

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
let analytics: Analytics | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, analytics, auth, db };