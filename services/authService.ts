import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserData } from '../types';

// Register user
export const register = async (email: string, password: string, username: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Get user data from Firestore
export const getUserData = async (userId: string): Promise<UserData> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      // Add uid to user data
      return {
        ...userData,
        uid: userId
      };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Update user progress
export const updateUserProgress = async (userId: string, topicId: string, progressData: any) => {
  try {
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, {
      [`progress.${topicId}`]: progressData
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};