import { create } from 'zustand';
import { Track } from './usePlayer';
import { apiFetch } from '../lib/api';

export interface AlbumItem {
  id: string; // Mapped from _id internally
  _id?: string;
  name: string;
  title?: string;
  description?: string;
  coverUrl?: string;
  cover?: string;
  tracks: Track[];
  songs?: any[];
  createdAt: number;
}

interface MusicState {
  albums: AlbumItem[];
  loading: boolean;
  fetchAlbums: () => Promise<void>;
  addAlbum: (name: string, description?: string, coverUrl?: string) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  updateAlbum: (id: string, updates: Partial<AlbumItem>) => Promise<void>;
  addTrackToAlbum: (albumId: string, track: Track) => Promise<void>;
  deleteTrack: (albumId: string, trackId: string) => void;
  renameTrack: (albumId: string, trackId: string, newTitle: string) => void;
}

const mapMongoAlbum = (doc: any) => {
  if (!doc) return doc;
  // Normalize naming differences between UI models and backend
  if (doc._id) doc.id = doc._id;
  if (doc.title && !doc.name) doc.name = doc.title;
  if (doc.cover && !doc.coverUrl) doc.coverUrl = doc.cover;
  
  doc.tracks = (doc.songs || []).map((s: any) => ({
    id: s._id || s.id,
    title: s.title,
    artist: doc.name,
    url: s.url,
    duration: s.duration || '0:00',
    coverUrl: doc.coverUrl || doc.cover
  }));
  return doc;
};

export const useMusic = create<MusicState>((set, get) => ({
  albums: [],
  loading: false,

  fetchAlbums: async () => {
    set({ loading: true });
    try {
      const albums = await apiFetch('/albums');
      set({ albums: albums.map(mapMongoAlbum), loading: false });
    } catch (e) {
      console.error("Failed to fetch albums", e);
      set({ loading: false });
    }
  },

  addAlbum: async (name, description, coverUrl) => {
    const newAlbum = await apiFetch('/albums', {
      method: "POST",
      body: JSON.stringify({ 
        title: name, 
        description: description || 'No description provided.', 
        cover: coverUrl || '' // No default cover, user provides it
      })
    });
    set((state) => ({ albums: [...state.albums, mapMongoAlbum(newAlbum)] }));
  },

  deleteAlbum: async (id) => {
    if (get().loading) return;
    set({ loading: true });
    try {
      await apiFetch(`/albums/${id}`, { method: "DELETE" });
      set((state) => ({ albums: state.albums.filter((a) => a.id !== id), loading: false }));
    } catch (e) {
      set({ loading: false });
    }
  },

  // Note: Backend now has a partial update route
  updateAlbum: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      albums: state.albums.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
    try {
      await apiFetch(`/albums/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error("Failed to update album", e);
      // We could revert optimistic update here, but user can refresh for now
    }
  },

  addTrackToAlbum: async (albumId, track) => {
    await apiFetch(`/albums/${albumId}/song`, {
      method: "POST",
      body: JSON.stringify({ title: track.title, url: track.url })
    });
    await get().fetchAlbums();
  },

  deleteTrack: async (albumId, trackId) => {
    try {
      await apiFetch(`/albums/${albumId}/song/${trackId}`, { method: "DELETE" });
      set((state) => ({
        albums: state.albums.map(a => 
          a.id === albumId ? { ...a, tracks: a.tracks.filter(t => t.id !== trackId) } : a
        )
      }));
    } catch (e) {
      console.error("Failed to delete track", e);
    }
  },

  renameTrack: async (albumId, trackId, newTitle) => {
    try {
      await apiFetch(`/albums/${albumId}/song/${trackId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle })
      });
      set((state) => ({
        albums: state.albums.map(a =>
          a.id === albumId ? { ...a, tracks: a.tracks.map(t => t.id === trackId ? { ...t, title: newTitle } : t) } : a
        )
      }));
    } catch (e) {
      console.error("Failed to rename track", e);
    }
  },
}));
