import { initializeApp } from 'firebase/app';

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

import { getAuth } from 'firebase/auth';

// Initialize Firebase Auth
const auth = getAuth(app);

export { app, auth };
