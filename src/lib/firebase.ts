import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator 
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';

// Environment variables or fallback defaults for JUDGE Educational Platform
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyJUDGE_PLACEHOLDER_KEY_FOR_DEV_TEST",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "judge-educational.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "judge-educational",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "judge-educational.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100000000000:web:abcdef123456"
};

// Check if actual configuration is present
export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Try enabling offline persistence for zero-cost caching
try {
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore offline persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore offline persistence is not supported in this browser');
      }
    });
  }
} catch (e) {
  // Silent catch
}
