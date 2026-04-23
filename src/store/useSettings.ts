import { create } from 'zustand';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';

interface SettingsState {
  theme: string;
  accent: string;
  density: 'compact' | 'comfortable';
  appNotifications: boolean;
  studyReminders: boolean;
  musicSuggestions: boolean;
  setTheme: (theme: string) => void;
  setAccent: (accent: string) => void;
  setDensity: (density: 'compact' | 'comfortable') => void;
  toggleAppNotifications: () => void;
  toggleStudyReminders: () => void;
  toggleMusicSuggestions: () => void;
  syncToBackend: () => Promise<void>;
  fetchSettings: () => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  theme: 'dark',
  accent: '#8870A3',
  density: 'comfortable',
  appNotifications: true,
  studyReminders: true,
  musicSuggestions: true,
  setTheme: (theme) => set({ theme }),
  setAccent: (accent) => set({ accent }),
  setDensity: (density) => set({ density }),
  toggleAppNotifications: () => set((state) => ({ appNotifications: !state.appNotifications })),
  toggleStudyReminders: () => set((state) => ({ studyReminders: !state.studyReminders })),
  toggleMusicSuggestions: () => set((state) => ({ musicSuggestions: !state.musicSuggestions })),
  fetchSettings: async () => {
    try {
      const user = await apiFetch('/user');
      if (user && user.settings) {
        set({
          theme: user.settings.theme || 'dark',
          accent: user.settings.accent || '#8870A3',
          appNotifications: user.settings.notifications ?? true
        });
      }
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  },
  syncToBackend: async () => {
    try {
      const state = get();
      await apiFetch('/user/settings', {
        method: 'PUT',
        body: JSON.stringify({
          theme: state.theme,
          accent: state.accent,
          notifications: state.appNotifications
        })
      });
      toast.success("Settings saved ✨");
    } catch (e) {
      toast.error("Failed to sync settings");
    }
  }
}));
