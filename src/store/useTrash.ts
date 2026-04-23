import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface TrashItem {
  id: string; // Mapped from _id
  _id?: string;
  name?: string;
  type: 'folder' | 'file' | 'album' | 'track' | string;
  data: any; // original item data
  deletedAt: number;
}

interface TrashState {
  items: TrashItem[];
  loading: boolean;
  fetchTrash: () => Promise<void>;
  addToTrash: (item: TrashItem) => void;
  restore: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  restoreAll: () => Promise<void>;
}

const mapMongoTrash = (doc: any) => {
  if (!doc) return doc;
  if (doc._id) doc.id = doc._id;
  // Try to derive a distinct name
  if (doc.data) {
    doc.name = doc.data.title || doc.data.name || 'Untitled';
  }
  return doc;
};

export const useTrash = create<TrashState>((set, get) => ({
  items: [],
  loading: false,

  fetchTrash: async () => {
    set({ loading: true });
    try {
      const items = await apiFetch('/trash');
      set({ items: items.map(mapMongoTrash), loading: false });
    } catch (e) {
      console.error("Failed to fetch trash", e);
      set({ loading: false });
    }
  },

  addToTrash: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),

  restore: async (id) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      await apiFetch(`/trash/restore/${id}`, { method: "POST" });
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        loading: false
      }));
    } catch (e) {
      set({ loading: false });
    }
  },

  permanentlyDelete: async (id) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      await apiFetch(`/trash/${id}`, { method: "DELETE" });
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        loading: false
      }));
    } catch (e) {
      set({ loading: false });
    }
  },

  emptyTrash: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      await apiFetch('/trash/all', { method: 'DELETE' });
      set({ items: [], loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  restoreAll: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      await apiFetch('/trash/restore-all', { method: 'POST' });
      set({ items: [], loading: false });
    } catch (e) {
      set({ loading: false });
    }
  }
}));
