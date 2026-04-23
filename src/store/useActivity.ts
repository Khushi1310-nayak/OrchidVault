import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface ActivityDay {
  date: string;
  studyTime: number; // in seconds
  musicTime: number; // in seconds
  filesAdded: number;
  foldersCreated: number;
}

interface ActivityState {
  activities: ActivityDay[];
  isLoading: boolean;
  
  fetchActivity: () => Promise<void>;
  logActivity: (data: Partial<ActivityDay>) => Promise<void>;
}

export const useActivity = create<ActivityState>((set, get) => ({
  activities: [],
  isLoading: false,

  fetchActivity: async () => {
    set({ isLoading: true });
    try {
      const data = await apiFetch('/activity');
      set({ activities: data });
    } catch (error) {
      console.error("Error fetching activity", error);
    } finally {
      set({ isLoading: false });
    }
  },

  logActivity: async (data) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Optimistic update
    set((state) => {
      const activities = [...state.activities];
      const todayIndex = activities.findIndex(a => a.date === today);
      
      if (todayIndex >= 0) {
        const current = activities[todayIndex];
        activities[todayIndex] = {
          ...current,
          studyTime: current.studyTime + (data.studyTime || 0),
          musicTime: current.musicTime + (data.musicTime || 0),
          filesAdded: current.filesAdded + (data.filesAdded || 0),
          foldersCreated: current.foldersCreated + (data.foldersCreated || 0),
        };
      } else {
        activities.push({
          date: today,
          studyTime: data.studyTime || 0,
          musicTime: data.musicTime || 0,
          filesAdded: data.filesAdded || 0,
          foldersCreated: data.foldersCreated || 0,
        });
      }
      return { activities };
    });

    try {
      await apiFetch('/activity', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error("Error logging activity", error);
    }
  }
}));
