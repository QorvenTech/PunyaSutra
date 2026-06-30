import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBKLoZ1QkuM2TGzwsaOp-GVQ5CKlCS3lu8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bhaktisetu-e0e1a.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bhaktisetu-e0e1a',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bhaktisetu-e0e1a.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '415010856816',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:415010856816:web:replace-with-web-app-id',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = (() => {
  try {
    return initializeFirestore(app, {}, 'default');
  } catch (error) {
    return getFirestore(app, 'default');
  }
})();

export const auth = getAuth(app);
export const firebaseProjectId = firebaseConfig.projectId;
