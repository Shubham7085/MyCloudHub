import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  
  checkAuth: async () => {
    try {
      // DEV DEMO MODE BYPASS
      if (import.meta.env.DEV && localStorage.getItem('dev_demo_user')) {
        const demoUser = JSON.parse(localStorage.getItem('dev_demo_user')!);
        set({ user: demoUser, isAuthenticated: true });
        return;
      }

      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (err) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      if (import.meta.env.DEV) {
        localStorage.removeItem('dev_demo_user');
      }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  }
}));
