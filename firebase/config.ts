import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBO5eXbOEUwE33F4T2uOFLNUHzKpuRgO2Q",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "innercompass-ai.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "innercompass-ai",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "innercompass-ai.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "579317528275",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:579317528275:web:bd33945fd0ad9af4e60626"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;