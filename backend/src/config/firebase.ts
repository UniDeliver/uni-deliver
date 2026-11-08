import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { env } from './env';

let isFirebaseInitialized = false;

if (getApps().length === 0) {
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    isFirebaseInitialized = true;
    console.log('[Firebase] Admin initialized with service account.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({
      credential: applicationDefault(),
    });
    isFirebaseInitialized = true;
    console.log('[Firebase] Admin initialized with application default credentials.');
  } else {
    console.warn('[Firebase] Warning: Firebase Admin credentials not found. Using local fallback.');
    try {
      initializeApp({
        projectId: env.FIREBASE_PROJECT_ID || 'unideliver-local',
      });
      isFirebaseInitialized = true;
    } catch (e) {
      console.warn('[Firebase] Could not initialize fallback app:', e);
    }
  }
} else {
  isFirebaseInitialized = true;
}

export const firebaseAuth: Auth = getAuth();
export const hasLiveFirebaseCredentials = !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
