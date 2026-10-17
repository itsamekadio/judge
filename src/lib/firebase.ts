import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCZXSOxcSgq4W4C_WRS3oebbCe5DBGb6y0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "judge-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "judge-platform",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "judge-platform.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "946727971005",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:946727971005:web:880c42ce68b3695443afd4"
};

export const isFirebaseConfigured = true;

// Initialize singleton app
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);

// Cloud Firestore
export const db = getFirestore(app);
