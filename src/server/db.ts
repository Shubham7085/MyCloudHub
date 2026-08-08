import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountStr) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountStr);
    } catch (e) {
      try {
        serviceAccount = JSON.parse(Buffer.from(serviceAccountStr, 'base64').toString('utf8'));
      } catch (e2) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is invalid. Must be JSON or base64 encoded JSON.');
      }
    }
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    try {
      initializeApp({ credential: applicationDefault() });
    } catch (e) {
      throw new Error('Firebase init failed. Set FIREBASE_SERVICE_ACCOUNT_KEY env var in Vercel.');
    }
  }
}

export const db = getFirestore();

