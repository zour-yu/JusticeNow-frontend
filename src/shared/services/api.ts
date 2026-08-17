import axios from 'axios';
import { Platform } from 'react-native';

// NOTE: For testing on a physical phone with Expo Go, replace YOUR_LOCAL_IP with your PC's Wi-Fi IPv4 address (e.g. 'http://192.168.1.15:5000')
// For Android emulator: 'http://10.0.2.2:5000'
// For iOS simulator: 'http://localhost:5000'
const DEFAULT_LOCAL_IP = '192.168.1.100'; // Change to your machine's IP if testing live backend

export const API_BASE_URL = 
  Platform.OS === 'android' && !__DEV__
    ? `http://${DEFAULT_LOCAL_IP}:5000`
    : `http://localhost:5000`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Firebase Auth token if available
let userAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  userAuthToken = token;
};

api.interceptors.request.use(
  (config) => {
    if (userAuthToken) {
      config.headers.Authorization = `Bearer ${userAuthToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
