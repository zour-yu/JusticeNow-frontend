import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

const getBackendUrl = (): string => {
  // 1. Web environment
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:5000`;
    }
    return process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  }

  // 2. Production or explicit HTTPS/Tunnel backend URL (e.g., ngrok, Cloudflare, deployed cloud server)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl;
  }

  // 3. Dynamically extract host IP from Expo's Metro bundler connection (Expo Go / Dev Client)
  // This ensures that switching Wi-Fi / Mobile Hotspot automatically adapts without manual config!
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000`;
    }
  }

  // 4. Android emulator fallback if hostUri is not available
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  // 5. Explicit local IP from .env or fallback
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  return 'http://172.20.10.3:5000';
};

const BACKEND_URL = getBackendUrl();
console.log(`[API Service] Base backend URL configured as: ${BACKEND_URL}`);

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
