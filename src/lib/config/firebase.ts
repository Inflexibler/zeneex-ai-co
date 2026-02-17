import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase configuration for client-side
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Helper function to verify Firebase token
export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    throw new Error('Invalid token');
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  try {
    const user = await auth.getUserByEmail(email);
    return user;
  } catch (error) {
    console.error('User not found:', error);
    return null;
  }
}

// Helper function to create custom token
export async function createCustomToken(uid: string) {
  try {
    const customToken = await auth.createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error('Custom token creation failed:', error);
    throw new Error('Failed to create token');
  }
}

// Helper function to get Firestore user document
export async function getUserDocument(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Failed to get user document:', error);
    return null;
  }
}

// Helper function to create Firestore user document
export async function createUserDocument(uid: string, userData: Record<string, unknown>) {
  try {
    await db.collection('users').doc(uid).set({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Failed to create user document:', error);
    return false;
  }
}

// Helper function to update Firestore user document
export async function updateUserDocument(uid: string, userData: Record<string, unknown>) {
  try {
    await db.collection('users').doc(uid).update({
      ...userData,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Failed to update user document:', error);
    return false;
  }
}

export default app;
