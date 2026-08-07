// src/store/driveStore.ts
import { create } from 'zustand';

interface Drive {
  id: string;
  provider: string;
  name: string;
  email: string;
  total_space: number;
  used_space: number;
}

interface DriveStore {
  drives: Drive[];
  isLoading: boolean;
  error: string | null;
  fetchDrives: () => Promise<void>;
  connectDemoDrive: (provider: string) => Promise<boolean>;
}

export const useDriveStore = create<DriveStore>((set) => ({
  drives: [],
  isLoading: false,
  error: null,

  fetchDrives: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/drives', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drives');
      }

      const data = await response.json();
      set({ drives: Array.isArray(data) ? data : [], isLoading: false });
    } catch (err: any) {
      console.error('Fetch drives error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  connectDemoDrive: async (provider: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/drives/connect-demo', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider })
      });

      if (!response.ok) {
        throw new Error('Failed to connect drive');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh drives list
        const store = useDriveStore.getState();
        await store.fetchDrives();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Connect drive error:', err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  }
}));

