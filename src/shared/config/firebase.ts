import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence fallback
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { app, auth };

