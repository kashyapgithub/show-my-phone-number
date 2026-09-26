import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY = 'show_number_firebase_config';

/**
 * Retrieve Firebase configuration from local storage or environment variables.
 */
export function getFirebaseConfig(): FirebaseConfig | null {
  // Check user-configured override in localStorage first
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.projectId && parsed.appId) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored Firebase config:', e);
    }
  }

  // Fallback to Vite environment variables
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (envApiKey && envProjectId && envAppId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: envAppId,
    };
  }

  return null;
}

/**
 * Save user-provided Firebase configuration to localStorage.
 */
export function saveFirebaseConfig(config: FirebaseConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

/**
 * Clear user-provided Firebase configuration from localStorage.
 */
export function clearFirebaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Check whether Firebase credentials are configured.
 */
export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedProvider: GoogleAuthProvider | null = null;

/**
 * Initialize or get active Firebase instances.
 */
export function getFirebaseInstances(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  googleProvider: GoogleAuthProvider | null;
} {
  const config = getFirebaseConfig();
  if (!config) {
    return { app: null, auth: null, db: null, googleProvider: null };
  }

  try {
    if (!cachedApp) {
      const apps = getApps();
      cachedApp = apps.length > 0 ? getApp() : initializeApp(config);
      cachedAuth = getAuth(cachedApp);
      cachedDb = getFirestore(cachedApp);
      cachedProvider = new GoogleAuthProvider();
      cachedProvider.setCustomParameters({ prompt: 'select_account' });
    }
    return {
      app: cachedApp,
      auth: cachedAuth,
      db: cachedDb,
      googleProvider: cachedProvider,
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return { app: null, auth: null, db: null, googleProvider: null };
  }
}

/**
 * Re-initialize instances if config changed.
 */
export function resetFirebaseInstances(): void {
  cachedApp = null;
  cachedAuth = null;
  cachedDb = null;
  cachedProvider = null;
}
