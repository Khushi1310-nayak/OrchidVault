import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  url: string;
  artist?: string;
  coverUrl?: string;
}

interface PlayerState {
  originalPlaylist: Track[];
  playlist: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  audio: HTMLAudioElement;
  isPlaying: boolean;
  isLooping: boolean;
  isShuffle: boolean;

  playTrack: (playlist: Track[], index: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
}

const audioObject = new Audio();

export const usePlayer = create<PlayerState>((set, get) => {
  audioObject.addEventListener('ended', () => {
    const { isLooping, next } = get();
    if (isLooping) {
      audioObject.currentTime = 0;
      audioObject.play().catch(console.error);
    } else {
      next();
    }
  });

  audioObject.addEventListener('play', () => set({ isPlaying: true }));
  audioObject.addEventListener('pause', () => set({ isPlaying: false }));

  return {
    originalPlaylist: [],
    playlist: [],
    currentIndex: 0,
    currentTrack: null,
    audio: audioObject,
    isPlaying: false,
    isLooping: false,
    isShuffle: false,

    playTrack: (newPlaylist, index) => {
      const { isShuffle, audio } = get();
      const track = newPlaylist[index];
      if (!track) return;
      
      audio.src = track.url;
      audio.play().catch(console.error);

      if (isShuffle) {
        const others = newPlaylist.filter((_, i) => i !== index).sort(() => Math.random() - 0.5);
        const shuffled = [track, ...others];
        set({
          originalPlaylist: newPlaylist,
          playlist: shuffled,
          currentIndex: 0,
          currentTrack: track,
        });
      } else {
        set({
          originalPlaylist: newPlaylist,
          playlist: newPlaylist,
          currentIndex: index,
          currentTrack: track,
        });
      }
    },

    togglePlay: () => {
      const { audio, isPlaying, playlist } = get();
      if (playlist.length === 0) return;
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(console.error);
      }
    },

    next: () => {
      const { playlist, currentIndex, audio } = get();
      if (playlist.length === 0) return;
      const nextIndex = (currentIndex + 1) % playlist.length;
      const track = playlist[nextIndex];
      audio.src = track.url;
      audio.play().catch(console.error);
      set({ currentIndex: nextIndex, currentTrack: track });
    },

    prev: () => {
      const { playlist, currentIndex, audio } = get();
      if (playlist.length === 0) return;
      const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
      const track = playlist[prevIndex];
      audio.src = track.url;
      audio.play().catch(console.error);
      set({ currentIndex: prevIndex, currentTrack: track });
    },

    toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
    
    toggleShuffle: () => set((state) => {
      const newShuffle = !state.isShuffle;
      if (newShuffle && state.playlist.length > 0) {
        const currentTrack = state.playlist[state.currentIndex];
        const others = state.originalPlaylist.filter(t => t.id !== currentTrack.id).sort(() => Math.random() - 0.5);
        return { isShuffle: true, playlist: [currentTrack, ...others], currentIndex: 0 };
      } else if (!newShuffle && state.playlist.length > 0) {
        const currentTrack = state.playlist[state.currentIndex];
        const newIndex = state.originalPlaylist.findIndex(t => t.id === currentTrack.id);
        return { isShuffle: false, playlist: state.originalPlaylist, currentIndex: Math.max(0, newIndex) };
      }
      return { isShuffle: newShuffle };
    }),
  };
});
