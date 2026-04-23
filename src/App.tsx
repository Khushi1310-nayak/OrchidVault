/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MusicPlaylistPage from './pages/MusicPlaylistPage';
import FilesPage from './pages/FilesPage';
import SettingsPage from './pages/SettingsPage';
import TrashPage from './pages/TrashPage';
import SplashScreen from './components/ui/SplashScreen';
import { useSettings } from './store/useSettings';

export default function App() {
  const { theme, accent, density } = useSettings();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial splash screen duration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Track PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (theme === 'orchid') {
      document.documentElement.setAttribute('data-theme', 'orchid');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  // Optional: dynamically override accent in root elements if selected from presets
  useEffect(() => {
    if (accent) {
      document.documentElement.style.setProperty('--accent', accent);
      // Derive a slightly lighter highlight if needed, or set both
    }
  }, [accent]);

  useEffect(() => {
    document.body.setAttribute('data-density', density);
  }, [density]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/music" element={<MusicPlaylistPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
