import { create } from 'zustand';

export interface Drive {
  id: string;
  provider: 'google' | 'onedrive' | 'dropbox';
  provider_account_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  used_space: number;
  total_space: number;
  status: 'healthy' | 'syncing' | 'error';
  last_sync: string;
}

interface DriveState {
  drives: Drive[];
  isLoading: boolean;
  error: string | null;
  fetchDrives: () => Promise<void>;
  disconnectDrive: (id: string) => Promise<void>;
  syncDrive: (id: string) => Promise<void>;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  drives: [],
  isLoading: false,
  error: null,
  
  fetchDrives: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/drives', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        set({ drives: data.drives });
      } else {
        const err = await res.json();
        set({ error: err.error || 'Failed to fetch drives' });
      }
    } catch (err) {
      set({ error: 'Network error while fetching drives' });
    } finally {
      set({ isLoading: false });
    }
  },

  disconnectDrive: async (id: string) => {
    try {
      const res = await fetch(`/api/drives/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        set(state => ({ drives: state.drives.filter(d => d.id !== id) }));
      }
    } catch (err) {
      console.error('Failed to disconnect drive:', err);
    }
  },

  syncDrive: async (id: string) => {
    // Optimistic status update
    set(state => ({
      drives: state.drives.map(d => d.id === id ? { ...d, status: 'syncing' } : d)
    }));

    try {
      const res = await fetch(`/api/drives/${id}/sync`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          drives: state.drives.map(d => d.id === id ? data.drive : d)
        }));
      } else {
        set(state => ({
          drives: state.drives.map(d => d.id === id ? { ...d, status: 'error' } : d)
        }));
      }
    } catch (err) {
      set(state => ({
        drives: state.drives.map(d => d.id === id ? { ...d, status: 'error' } : d)
      }));
    }
  }
}));
