import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../firebase/config';

let firebaseApp: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;

// Ensure Firebase app is initialized only once globally
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

// Initialize Firestore with offline persistence
// This should be done only once globally for the client-side application
db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache(),
  // tabManager: persistentMultipleTabManager() // Optional: if you want to sync cache across tabs
});

// Get the Firebase Storage instance
storage = getStorage(firebaseApp);

export { firebaseApp, db, storage };