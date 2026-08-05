import { create } from 'zustand';

export interface UploadTask {
  id: string;
  file: File;
  driveId: string;
  folderId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'error' | 'canceled';
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  xhr?: XMLHttpRequest; // To abort the upload
  speed?: number; // bytes per second
  eta?: number; // seconds remaining
  startTime?: number; // timestamp in ms
  uploadUrl?: string; // Google Drive resumable upload session URL
}

interface UploadState {
  tasks: UploadTask[];
  addTask: (file: File, driveId: string, folderId: string) => void;
  removeTask: (id: string) => void;
  pauseTask: (id: string) => void;
  resumeTask: (id: string) => void;
  cancelTask: (id: string) => void;
  clearCompleted: () => void;
  updateTaskProgress: (id: string, uploadedBytes: number) => void;
  setTaskStatus: (id: string, status: UploadTask['status'], error?: string) => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  tasks: [],

  addTask: (file, driveId, folderId) => {
    const newTask: UploadTask = {
      id: crypto.randomUUID(),
      file,
      driveId,
      folderId,
      progress: 0,
      status: 'pending',
      uploadedBytes: 0,
      totalBytes: file.size,
    };
    set(state => ({ tasks: [...state.tasks, newTask] }));
    
    // Automatically start upload
    get().resumeTask(newTask.id);
  },

  removeTask: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  pauseTask: (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task && task.status === 'uploading') {
      if (task.xhr) {
        task.xhr.abort(); // Abort current chunk/upload
      }
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'paused' } : t)
      }));
    }
  },

  resumeTask: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task && (task.status === 'paused' || task.status === 'pending' || task.status === 'error')) {
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'uploading' } : t)
      }));
      
      let uploadUrl = task.uploadUrl;

      if (!uploadUrl) {
        try {
          const res = await fetch(`/api/drives/${task.driveId}/upload/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: task.file.name,
              mimeType: task.file.type || 'application/octet-stream',
              parentId: task.folderId,
              size: task.file.size
            })
          });

          if (!res.ok) throw new Error('Failed to create upload session');
          const data = await res.json();
          uploadUrl = data.uploadUrl;

          // Save uploadUrl in case we need to resume later
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, uploadUrl } : t)
          }));
        } catch (err) {
          get().setTaskStatus(id, 'error', 'Session error');
          return;
        }
      }

      if (!uploadUrl) {
        get().setTaskStatus(id, 'error', 'No upload URL');
        return;
      }

      if (uploadUrl === 'mock-upload-url') {
        // Fallback for mock demo user
        setTimeout(() => get().setTaskStatus(id, 'completed'), 1000);
        return;
      }

      const xhr = new XMLHttpRequest();
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, xhr, startTime: Date.now() } : t)
      }));

      // In a real resumable upload, we should query the current status if we are resuming.
      // For simplicity, if we are starting fresh or resuming from 0, we PUT the whole file.
      // If we want true resume, we'd do a PUT with Content-Range to check status first.
      
      xhr.open('PUT', uploadUrl, true);
      // Note: We don't need credentials for the upload URL as it has a token embedded
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          get().updateTaskProgress(id, event.loaded);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          get().setTaskStatus(id, 'completed');
        } else {
          get().setTaskStatus(id, 'error', 'Upload failed');
        }
      };

      xhr.onerror = () => {
        get().setTaskStatus(id, 'error', 'Network error');
      };

      xhr.send(task.file);
    }
  },

  cancelTask: (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      if (task.xhr) task.xhr.abort();
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'canceled' } : t)
      }));
    }
  },

  clearCompleted: () => {
    set(state => ({
      tasks: state.tasks.filter(t => t.status !== 'completed' && t.status !== 'canceled')
    }));
  },

  updateTaskProgress: (id, uploadedBytes) => {
    set(state => ({
      tasks: state.tasks.map(t => {
        if (t.id === id) {
          const progress = Math.round((uploadedBytes / t.totalBytes) * 100);
          const now = Date.now();
          const elapsed = (now - (t.startTime || now)) / 1000;
          let speed = t.speed;
          let eta = t.eta;
          if (elapsed > 0.5) { // Only calculate after 0.5s to avoid infinity
            speed = uploadedBytes / elapsed;
            if (speed > 0) {
              eta = (t.totalBytes - uploadedBytes) / speed;
            }
          }
          return { ...t, uploadedBytes, progress, speed, eta };
        }
        return t;
      })
    }));
  },

  setTaskStatus: (id, status, error) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, status, error } : t)
    }));
  }
}));
