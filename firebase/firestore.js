import { getFirestore, initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, getDoc, doc } from 'firebase/firestore';
import { app } from './config';
import { Platform } from 'react-native';

// Initialize Firestore with settings optimized for React Native
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true, // Use long polling for more stable connections
  useFetchStreams: false, // Disable fetch streams which can cause issues on some devices
  experimentalLongPollingOptions: {
    timeoutSeconds: 30, // Increase timeout to handle slow connections
    maxRetriesPerRequest: 5 // Allow more retries for better reliability
  }
});

// Enable offline persistence with improved error handling and delayed initialization
enablePersistence();

async function enablePersistence() {
  // Skip persistence on web platforms where IndexedDB might not be fully supported
  if (Platform.OS === 'web') {
    console.log('Skipping IndexedDB persistence on web platform');
    return;
  }
  
  try {
    // Wrap in setTimeout to avoid blocking the main thread during app startup
    // This helps prevent connection issues during sign-in
    setTimeout(async () => {
      try {
        await enableIndexedDbPersistence(db);
        console.log('Firestore offline persistence enabled successfully');
      } catch (error) {
        if (error.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (error.code === 'unimplemented') {
          console.warn('The current environment does not support IndexedDB persistence. Using memory-only cache.');
        } else {
          console.error('Error enabling Firestore persistence:', error);
          // Don't throw the error, just log it and continue with memory cache
        }
      }
    }, 1000); // Delay persistence initialization by 1 second
  } catch (error) {
    console.error('Critical error in persistence setup:', error);
    // App continues with default memory cache
  }
}

export { db };