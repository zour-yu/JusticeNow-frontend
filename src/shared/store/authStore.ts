import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
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
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<void>;
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
      console.error('Login Error:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to login', 
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
      console.error('Registration Error:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to register', 
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

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  changePassword: async (currentPass: string, newPass: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No authenticated user found");
      
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));
