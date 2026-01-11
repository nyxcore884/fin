'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, DependencyList } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, getAuth, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { firebaseConfig } from './config';

// Define the shape of the context
interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
  user: User | null;
  isUserLoading: boolean;
}

// Create the context
const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- Singleton Pattern for Firebase Initialization ---
const initializeFirebaseServices = () => {
  if (getApps().length === 0) {
    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const storage = getStorage(firebaseApp);
    return { firebaseApp, auth, firestore, storage };
  } else {
    const firebaseApp = getApp();
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const storage = getStorage(firebaseApp);
    return { firebaseApp, auth, firestore, storage };
  }
};
// --- End Singleton Pattern ---

/**
 * The main provider component. It initializes Firebase and makes services and user state available to its children.
 */
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<{
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
  } | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const initializedServices = initializeFirebaseServices();
    setServices(initializedServices);

    const unsubscribe = onAuthStateChanged(initializedServices.auth, (user) => {
      setUser(user);
      setIsUserLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({
    firebaseApp: services?.firebaseApp || null,
    auth: services?.auth || null,
    firestore: services?.firestore || null,
    storage: services?.storage || null,
    user,
    isUserLoading,
  }), [services, user, isUserLoading]);

  return (
    <FirebaseContext.Provider value={value}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to easily access the Firebase context
const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

// Export individual service hooks for convenience
export const useFirebaseApp = (): FirebaseApp | null => useFirebase().firebaseApp;
export const useAuth = (): Auth | null => useFirebase().auth;
export const useFirestore = (): Firestore | null => useFirebase().firestore;
export const useStorage = (): FirebaseStorage | null => useFirebase().storage;
export const useUser = () => {
    const { user, isUserLoading } = useFirebase();
    return { user, isUserLoading };
};

// Memoization hook for Firebase queries/refs to prevent re-renders
type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

// Re-export other necessary modules
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
