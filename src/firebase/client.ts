'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, memoryLocalCache, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with offline persistence
// It will fall back to memory cache if the browser doesn't support indexedDB.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});

const storage = getStorage(app);
const auth = getAuth(app);

// It's a good practice to explicitly enable the network connection after initialization
// if you want to ensure data is fetched on startup.
enableNetwork(db).catch(err => {
    console.error("Failed to enable Firestore network", err);
});


export { app, db, storage, auth };

    