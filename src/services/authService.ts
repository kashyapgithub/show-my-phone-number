import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { getFirebaseInstances, isFirebaseConfigured } from '../config/firebase';

export interface AuthUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Sign in using Google Identity Provider with Firebase Authentication.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase credentials are not configured. Please add your Firebase project settings.');
  }

  const { auth, googleProvider } = getFirebaseInstances();
  if (!auth || !googleProvider) {
    throw new Error('Failed to initialize Firebase Authentication.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled by user.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in request was cancelled.');
    }
    console.error('Google Sign-In Error:', error);
    throw new Error(error.message || 'Failed to sign in with Google.');
  }
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOutUser(): Promise<void> {
  const { auth } = getFirebaseInstances();
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Listen for Firebase authentication state changes.
 */
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  const { auth } = getFirebaseInstances();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
