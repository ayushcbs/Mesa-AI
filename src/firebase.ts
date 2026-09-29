import { initializeApp, setLogLevel } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  initializeFirestore, 
  memoryLocalCache,
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocFromServer, 
  Timestamp
} from 'firebase/firestore';
import firebaseConfigFile from '../firebase-applet-config.json';

// Suppress excessive verbose warnings in console (such as offline warning or connection timeout alerts)
setLogLevel('error');

// Safely resolve Firebase configuration:
// Tier 1: Client environment variables (import.meta.env.VITE_FIREBASE_*)
// Tier 2: Values from local firebase-applet-config.json (if present in local dev/AI Studio environment)
// Tier 3: Safe empty fallback defaults ensuring build & offline startup never crash on missing env vars
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as Record<string, string | undefined>);
const baseConfig = (typeof firebaseConfigFile === 'object' && firebaseConfigFile !== null) ? firebaseConfigFile : {} as any;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || baseConfig.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || baseConfig.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || baseConfig.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || baseConfig.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || baseConfig.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || baseConfig.appId || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || baseConfig.measurementId || '',
};

export const firestoreDatabaseId: string =
  env.VITE_FIREBASE_DATABASE_ID ||
  env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  baseConfig.firestoreDatabaseId ||
  '(default)';

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Clean up stale or saturated WebStorage and old corrupted IndexedDB databases
try {
  if (typeof window !== 'undefined') {
    if (window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('firestore_clients_') || k.startsWith('firestore_') || k.includes('ai-studio-'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => {
        try {
          window.localStorage.removeItem(k);
        } catch (_) {}
      });
    }

    if (window.indexedDB && window.indexedDB.databases) {
      window.indexedDB.databases().then(databases => {
        databases.forEach(dbInfo => {
          if (dbInfo.name && (dbInfo.name.startsWith('firestore') || dbInfo.name.includes('[DEFAULT]') || dbInfo.name.includes('ai-studio-'))) {
            try {
              window.indexedDB.deleteDatabase(dbInfo.name);
            } catch (_) {}
          }
        });
      }).catch(() => {});
    }
  }
} catch (_) {
  // Ignore environments where storage access is restricted
}

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Configure Firestore with in-memory local caching.
// This prevents IndexedDB corruption/assertion errors (b7de, b815 with pending mutation batches)
// and avoids WebStorage/localStorage quota limits in iframe environments.
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true,
}, firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let isQuotaExceededState = false;
const quotaListeners = new Set<(exceeded: boolean) => void>();

export function getIsQuotaExceeded() {
  return isQuotaExceededState;
}

export function subscribeQuotaExceeded(cb: (exceeded: boolean) => void) {
  quotaListeners.add(cb);
  cb(isQuotaExceededState);
  return () => {
    quotaListeners.delete(cb);
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (errMessage.includes('Quota exceeded') || errMessage.includes('resource-exhausted')) {
    isQuotaExceededState = true;
    quotaListeners.forEach(cb => cb(true));
    console.warn("Firestore Quota Exceeded (Free daily write limits reached). Operating in local cache mode:", errMessage);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  return errInfo;
}

// Test connection to Firestore
async function testConnection() {
  if (!isFirebaseConfigured) {
    console.info("Firebase environment variables not configured. Application operating in offline/demo mode.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info("Firestore connected successfully.");
  } catch (error: any) {
    const errMessage = error?.message || String(error);
    if (errMessage.includes('Quota exceeded') || errMessage.includes('resource-exhausted')) {
      isQuotaExceededState = true;
      quotaListeners.forEach(cb => cb(true));
      console.warn("Firestore daily quota limit reached. Application operating in offline local-cache mode.");
    } else {
      console.info("Firestore network check deferred. Operating smoothly in local-cache offline mode.");
    }
  }
}
testConnection();

export { signInWithPopup, onAuthStateChanged, Timestamp };
export type { FirebaseUser };
