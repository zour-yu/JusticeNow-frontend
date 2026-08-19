import axios from 'axios';
import { auth } from '../config/firebase';

// NOTE: If testing on a physical device with Expo Go, change 'localhost' to your computer's local IP address (e.g., 192.168.1.100)
// For Android Emulator, use '10.0.2.2' instead of 'localhost'.
const BACKEND_URL = 'http://192.168.1.31:5000'; // I noticed this IP in your earlier Expo logs

const api = axios.create({
  baseURL: BACKEND_URL,
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
