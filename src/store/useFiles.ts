import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface FileItem {
  id: string; // Mapped from _id internally
  _id?: string;
  name: string;
  url: string;
  type: string;
  color?: string;
  createdAt: number;
}

export interface FolderItem {
  id: string;
  _id?: string;
  name: string;
  files: FileItem[];
  color?: string;
  createdAt: number;
}

interface FilesState {
  folders: FolderItem[];
  currentFolder: FolderItem | null;
  loading: boolean;
  fetchFolders: () => Promise<void>;
  addFolder: (name: string, color?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  openFolder: (folder: FolderItem | null) => void;
  addFileToFolder: (folderId: string, file: any) => Promise<void>;
  deleteFile: (folderId: string, fileId: string) => Promise<void>;
  renameFile: (folderId: string, fileId: string, newName: string) => Promise<void>;
  updateFileColor: (folderId: string, fileId: string, color: string) => Promise<void>;
}

const mapMongoId = (doc: any) => {
  if (!doc) return doc;
  if (doc._id) {
    doc.id = doc._id;
  }
  if (doc.files) {
    doc.files = doc.files.map((f: any) => ({ ...f, id: f._id || f.id }));
  }
  return doc;
};

export const useFiles = create<FilesState>((set, get) => ({
  folders: [],
  currentFolder: null,
  loading: false,

  fetchFolders: async () => {
    set({ loading: true });
    try {
      const folders = await apiFetch('/folders');
      set({ folders: folders.map(mapMongoId), loading: false });
    } catch (e) {
      console.error("Failed to fetch folders", e);
      set({ loading: false });
    }
  },

  addFolder: async (name, color) => {
    const newFolder = await apiFetch('/folders', {
      method: "POST",
      body: JSON.stringify({ name, color })
    });
    set((state) => ({ folders: [...state.folders, mapMongoId(newFolder)] }));
  },

  deleteFolder: async (id) => {
    await apiFetch(`/folders/${id}`, { method: "DELETE" });
    set((state) => {
      const newFolders = state.folders.filter((f) => f.id !== id);
      return {
        folders: newFolders,
        currentFolder: state.currentFolder?.id === id ? null : state.currentFolder
      };
    });
  },

  openFolder: (folder) => set({ currentFolder: folder }),

  addFileToFolder: async (folderId, file) => {
    await apiFetch(`/folders/${folderId}/file`, {
      method: "POST",
      body: JSON.stringify(file)
    });
    // Re-fetch to get updated structure with proper _ids
    await get().fetchFolders();
    const state = get();
    if (state.currentFolder?.id === folderId) {
      set({ currentFolder: state.folders.find(f => f.id === folderId) || null });
    }
  },

  // Note: These now use backend routes
  deleteFile: async (folderId, fileId) => {
    try {
      await apiFetch(`/folders/${folderId}/file/${fileId}`, { method: "DELETE" });
      set((state) => {
        const updatedFolders = state.folders.map(f =>
          f.id === folderId ? { ...f, files: f.files.filter((file) => file.id !== fileId) } : f
        );
        return {
          folders: updatedFolders,
          currentFolder: state.currentFolder?.id === folderId ? updatedFolders.find(f => f.id === folderId) : state.currentFolder
        };
      });
    } catch (e) {
      console.error("Failed to delete file", e);
    }
  },

  renameFile: async (folderId, fileId, newName) => {
    try {
      await apiFetch(`/folders/${folderId}/file/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName })
      });
      set((state) => {
        const updatedFolders = state.folders.map(f =>
          f.id === folderId ? { ...f, files: f.files.map((file) => file.id === fileId ? { ...file, name: newName } : file) } : f
        );
        return {
          folders: updatedFolders,
          currentFolder: state.currentFolder?.id === folderId ? updatedFolders.find(f => f.id === folderId) : state.currentFolder
        };
      });
    } catch (e) {
      console.error("Failed to rename file", e);
    }
  },

  updateFileColor: async (folderId, fileId, color) => {
    try {
      await apiFetch(`/folders/${folderId}/file/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({ color })
      });
      set((state) => {
        const updatedFolders = state.folders.map(f =>
          f.id === folderId ? { ...f, files: f.files.map((file) => file.id === fileId ? { ...file, color } : file) } : f
        );
        return {
          folders: updatedFolders,
          currentFolder: state.currentFolder?.id === folderId ? updatedFolders.find(f => f.id === folderId) : state.currentFolder
        };
      });
    } catch (e) {
      console.error("Failed to update file color", e);
    }
  }
}));
