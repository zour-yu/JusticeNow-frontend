import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

// Automatically detect host IP from Metro / Expo Go
const getBackendUrl = () => {
  // Extract host IP from Expo Constants if available (e.g. "192.168.1.7:8081" -> "192.168.1.7")
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }

  // Fallback for Android emulator / physical device on current network
  if (Platform.OS === 'android') {
    return 'http://192.168.1.7:5000';
  }

  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();
console.log('🔗 Connecting to Backend at:', BACKEND_URL);

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach the Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth?.currentUser;
      if (user) {
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore token retrieval errors if not signed in
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
