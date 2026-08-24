import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence may not be in the public typings for all Firebase versions
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration extracted from google-services.json
const firebaseConfig = {
  apiKey: 'AIzaSyBvAmnr43B0xzR6hd29o8uUU1F7NJ0S9n4',
  authDomain: 'justice-now.firebaseapp.com',
  projectId: 'justice-now',
  storageBucket: 'justice-now.firebasestorage.app',
  messagingSenderId: '110044162693',
  appId: '1:110044162693:android:3075ac7c446ed4b98a17ec',
};

// Initialize Firebase App (guard against duplicate initialization in hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with React Native AsyncStorage persistence
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (e.g. hot-reload) — grab the existing instance
  auth = getAuth(app);
}

export { app, auth };
