import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music as MusicIcon, Repeat, Shuffle } from 'lucide-react';
import { usePlayer } from '../../store/usePlayer';
import { useActivity } from '../../store/useActivity';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopPlayerBar() {
  const { currentTrack, isPlaying, togglePlay, next, prev, audio, isLooping, isShuffle, toggleLoop, toggleShuffle } = usePlayer();
  const { logActivity } = useActivity();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const progressBgRef = useRef<HTMLDivElement>(null);
  const volBgRef = useRef<HTMLDivElement>(null);

  // Activity Tracking
  const playStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      playStartRef.current = Date.now();
    } else {
      if (playStartRef.current) {
        const timePlayed = Math.floor((Date.now() - playStartRef.current) / 1000); // seconds
        if (timePlayed > 0) {
          logActivity({ musicTime: timePlayed });
        }
        playStartRef.current = null;
      }
    }
  }, [isPlaying, logActivity]);

  // Log on unmount if still playing
  useEffect(() => {
    return () => {
      if (playStartRef.current) {
        const timePlayed = Math.floor((Date.now() - playStartRef.current) / 1000);
        if (timePlayed > 0) logActivity({ musicTime: timePlayed });
      }
    };
  }, [logActivity]);

  useEffect(() => {
    let animationFrame: number;
    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
      animationFrame = requestAnimationFrame(updateProgress);
    };
    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateProgress);
    } else {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, audio]);

  useEffect(() => {
    // Initial volume
    setVolume(audio.volume);
  }, [audio]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBgRef.current || !duration) return;
    const rect = progressBgRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * duration;
    setProgress(pos * duration);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volBgRef.current) return;
    const rect = volBgRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.volume = pos;
    setVolume(pos);
  };

  const currentPercent = duration ? (progress / duration) * 100 : 0;
  const volPercent = volume * 100;

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[var(--card-bg)] backdrop-blur-xl border-b border-[var(--border)] flex flex-col md:flex-row items-center px-4 md:px-[calc(var(--card-padding)*1.5)] py-4 pl-16 md:pl-[calc(var(--card-padding)*1.5)] md:py-0 md:h-20 justify-between shrink-0 z-20 shadow-sm relative gap-4 md:gap-0"
        >
          {/* Song Info */}
          <div className="flex items-center gap-4 w-full md:w-1/3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border)] shrink-0 overflow-hidden relative group">
              {currentTrack?.coverUrl ? (
                <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <MusicIcon className="text-[var(--text-secondary)] opacity-60" size={24} />
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-[var(--accent)]/20 mix-blend-overlay"></div>
              )}
            </div>
            <div className="min-w-0 flex-1 pr-4">
              <h4 className="text-[var(--text-primary)] font-medium text-sm truncate">{currentTrack.title}</h4>
              <p className="text-xs text-[var(--text-secondary)] opacity-80 truncate">{currentTrack.artist || 'Unknown Artist'}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
            <div className="flex items-center gap-6 md:gap-5">
              <button 
                onClick={toggleShuffle}
                className={`transition ${isShuffle ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] opacity-70 hover:opacity-100 hover:text-[var(--text-primary)]'}`}
              >
                <Shuffle size={16} />
              </button>
              
              <button onClick={prev} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                <SkipBack size={20} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center hover:scale-105 transition shadow-[0_0_15px_var(--shadow-color)]"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>

              <button onClick={next} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                <SkipForward size={20} fill="currentColor" />
              </button>

              <button 
                onClick={toggleLoop}
                className={`transition ${isLooping ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] opacity-70 hover:opacity-100 hover:text-[var(--text-primary)]'}`}
              >
                <Repeat size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 w-full max-w-[300px]">
              <span className="text-[10px] text-[var(--text-secondary)] w-8 text-right opacity-80">
                {formatTime(progress)}
              </span>
              <div 
                ref={progressBgRef}
                onClick={handleSeek}
                className="flex-1 h-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full overflow-hidden cursor-pointer group"
              >
                <div 
                  className="h-full bg-[var(--accent)] rounded-full transition-all group-hover:brightness-110" 
                  style={{ width: `${currentPercent}%` }} 
                />
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] w-8 text-left opacity-80">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-1/3">
            <Volume2 size={16} className="text-[var(--text-secondary)]" />
            <div 
              ref={volBgRef}
              onClick={handleVolumeChange}
              className="w-24 h-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full overflow-hidden cursor-pointer group"
            >
              <div 
                className="h-full bg-[var(--text-primary)] opacity-80 rounded-full transition-all group-hover:bg-[var(--accent)] group-hover:opacity-100" 
                style={{ width: `${volPercent}%` }} 
              />
            </div>
          </div>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
