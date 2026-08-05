/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { DriveExplorer } from './pages/DriveExplorer';
import { Profile } from './pages/Profile';
import { Analytics } from './pages/Analytics';
import { CrossDriveView } from './pages/CrossDriveView';
import { ConnectedDrives } from './pages/ConnectedDrives';
import { ThemeProvider } from './components/ThemeProvider';
import { UploadManager } from './components/dashboard/UploadManager';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Cloud } from 'lucide-react';

function AppContent() {
  const { checkAuth, isLoading } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg mb-4 animate-bounce">
          <Cloud className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/drives/:id" element={<DriveExplorer />} />
            
            <Route path="/files" element={<CrossDriveView mode="all" />} />
            <Route path="/recent" element={<CrossDriveView mode="recent" />} />
            <Route path="/starred" element={<CrossDriveView mode="starred" />} />
            <Route path="/shared" element={<CrossDriveView mode="shared" />} />
            <Route path="/drives" element={<ConnectedDrives />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/trash" element={<CrossDriveView mode="trash" />} />
            <Route path="/settings" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
      <UploadManager />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
