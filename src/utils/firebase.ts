// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const analytics = typeof window ! == 'undefined'? getAnalytics(app) : null;