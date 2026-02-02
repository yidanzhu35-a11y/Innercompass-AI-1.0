import { auth, db } from '../firebase/config';
import * as firebase from 'firebase/compat/app';
import { UserData } from '../types';

// Register user
export const register = async (email: string, password: string, username: string) => {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Store user data in Firestore
    await db.collection('users').doc(user?.uid).set({
      username,
      email,
      createdAt: new Date().toISOString(),
      progress: {}
    });
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Login user
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): Promise<firebase.User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Get user data from Firestore
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return { id: userId, ...userDoc.data() } as UserData;
    } else {
      throw new Error('User data not found');
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Update user data in Firestore
export const updateUserData = async (userId: string, data: Partial<UserData>) => {
  try {
    await db.collection('users').doc(userId).update(data);
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};