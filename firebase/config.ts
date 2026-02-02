import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = { 
  apiKey: "AIzaSyBO5eXbOEUwE33F4T2uOFLNUHzKpuRgO2Q", 
  authDomain: "innercompass-ai.firebaseapp.com", 
  projectId: "innercompass-ai", 
  storageBucket: "innercompass-ai.firebasestorage.app", 
  messagingSenderId: "579317528275", 
  appId: "1:579317528275:web:bd33945fd0ad9af4e60626", 
  measurementId: "G-5WN1CVXVS4" 
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize services
export const auth = firebase.auth();
export const db = firebase.firestore();

export default app;