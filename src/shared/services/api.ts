import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

// Automatically detect host IP from Metro / Expo Go or Environment Variable
const getBackendUrl = () => {
  // 1. Dynamic detection from Metro host IP (automatically adapts to current Wi-Fi/Hotspot IP in dev)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000`;
  }

  // 2. Environment variable override (e.g. for standalone build or custom tunnel)
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }

  // 3. Fallback for physical device on current network
  if (Platform.OS === 'android') {
    return 'http://192.168.1.7:5000';
  }

  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();
console.log('🔗 Connecting to Backend at:', BACKEND_URL);

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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

// Intercept responses for helpful debugging on network failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn(
        `[API Network Error] Unable to reach backend at: ${error.config?.baseURL || BACKEND_URL}${error.config?.url || ''}. Check if your backend server is running on port 5000.`
      );
    }
    return Promise.reject(error);
  }
);

export default api;
