import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyChYIHs3NL1kU1L6N95NQ5FsgCGWJurFfI",
    authDomain: "askme-d018c.firebaseapp.com",
    projectId: "askme-d018c",
    storageBucket: "askme-d018c.appspot.com",
    messagingSenderId: "1018314548876",
    appId: "1:1018314548876:web:e9090d7eb8f8d431d2fda9"
};

// Initialize Firebase - check if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firebase Storage
const storage = getStorage(app);

export { auth, storage };