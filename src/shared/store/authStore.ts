import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../services/api';

interface User {
  _id: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isProfileComplete: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Login with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Fetch user profile from backend
      const response = await api.get('/auth/me');
      const user = response.data.data;
      set({ user, isLoading: false });
      return user;
    } catch (error: any) {
      console.error('Login Error:', error.response?.data || error.message || error);
      const msg =
        error.response?.data?.message ||
        (error.code
          ? error.code.replace('auth/', '').replace(/-/g, ' ')
          : error.message) ||
        'Failed to login';
      set({ 
        error: msg.charAt(0).toUpperCase() + msg.slice(1), 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Create account in Firebase
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // 2. Sync profile data to backend
      const response = await api.post('/auth/sync', {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      });

      const user = response.data.data;
      set({ user, isLoading: false });
      return user;
    } catch (error: any) {
      console.error('Registration Error:', error.response?.data || error.message || error);
      const msg =
        error.response?.data?.message ||
        (error.code
          ? error.code.replace('auth/', '').replace(/-/g, ' ')
          : error.message) ||
        'Failed to register';
      set({ 
        error: msg.charAt(0).toUpperCase() + msg.slice(1), 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
