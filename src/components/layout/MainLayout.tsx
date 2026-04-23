import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopPlayerBar from './TopPlayerBar';
import { useAuth } from '../../context/AuthContext';
import { useFiles } from '../../store/useFiles';
import { useMusic } from '../../store/useMusic';
import { useTrash } from '../../store/useTrash';
import { useActivity } from '../../store/useActivity';
import { useSettings } from '../../store/useSettings';
import { apiFetch } from '../../lib/api';
import { Toaster, toast } from 'sonner';

export default function MainLayout() {
  const { user, loading } = useAuth();
  const { fetchFolders } = useFiles();
  const { fetchAlbums } = useMusic();
  const { fetchTrash } = useTrash();
  const { fetchActivity } = useActivity();
  const { fetchSettings } = useSettings();

  useEffect(() => {
    if (user) {
      // Connect to backend user endpoint to ensure User document is synced
      apiFetch('/user', { method: 'POST' }).catch(console.error);

      // Hydrate Zustand stores with backend data
      fetchFolders();
      fetchAlbums();
      fetchTrash();
      fetchActivity();
      fetchSettings();
    }
  }, [user]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center text-[var(--accent)] text-lg animate-pulse">Entering Sanctuary...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      {/* Toast Notifications */}
      <Toaster 
        theme="system"
        toastOptions={{
          style: {
            background: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(10px)'
          }
        }} 
      />
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] relative z-0">
         <TopPlayerBar />
         <div className="flex-1 overflow-y-auto p-4 pt-16 md:p-[calc(var(--card-padding)*1.5)] custom-scrollbar z-10 relative">
           <Outlet />
         </div>
      </main>
    </div>
  );
}
