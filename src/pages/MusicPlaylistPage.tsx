import React, { useState, useRef } from 'react';
import { Music, Plus, Play, Trash2, Upload, MoreVertical, Search, Edit2, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { useMusic, AlbumItem } from '../store/useMusic';
import { useTrash } from '../store/useTrash';
import { usePlayer, Track } from '../store/usePlayer';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

export default function MusicPlaylistPage() {
  const { albums, addAlbum, deleteAlbum, addTrackToAlbum, deleteTrack, renameTrack, updateAlbum } = useMusic();
  const { addToTrash } = useTrash();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  // Modals state
  const [isNewAlbumModalOpen, setIsNewAlbumModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  
  const [editAlbumConfirm, setEditAlbumConfirm] = useState<AlbumItem | null>(null);
  const [editAlbumName, setEditAlbumName] = useState('');
  const [editAlbumDesc, setEditAlbumDesc] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'album'|'track', albumId?: string, item: any } | null>(null);
  
  const [renamingTrackId, setRenamingTrackId] = useState<string | null>(null);
  const [newTrackName, setNewTrackName] = useState('');

  // Data Filtering
  const filteredAlbums = albums.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.description?.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeAlbum = albums.find(a => a.id === activeAlbumId);
  const filteredTracks = activeAlbum ? activeAlbum.tracks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())) : [];


  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAlbumName.trim()) {
      try {
        await addAlbum(newAlbumName.trim(), newAlbumDesc.trim());
        toast.success("Album saved ✨");
      } catch(err) {
        toast.error("Failed to create album");
      }
      setNewAlbumName('');
      setNewAlbumDesc('');
      setIsNewAlbumModalOpen(false);
    }
  };

  const handleEditAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (editAlbumConfirm && editAlbumName.trim()) {
      updateAlbum(editAlbumConfirm.id, {
        name: editAlbumName.trim(),
        description: editAlbumDesc.trim()
      });
      setEditAlbumConfirm(null);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editAlbumConfirm) return;
    setUploadingCover(true);
    try {
      const url = URL.createObjectURL(file);
      updateAlbum(editAlbumConfirm.id, { coverUrl: url });
      setEditAlbumConfirm(prev => prev ? { ...prev, coverUrl: url } : null);
    } catch (err) {
      console.error('Cover upload failed:', err);
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'album') {
      addToTrash({
        id: Date.now().toString(),
        name: deleteConfirm.item.name,
        type: 'album',
        data: deleteConfirm.item,
        deletedAt: Date.now()
      });
      deleteAlbum(deleteConfirm.id);
      if (activeAlbumId === deleteConfirm.id) setActiveAlbumId(null);
    } else if (deleteConfirm.type === 'track' && deleteConfirm.albumId) {
      addToTrash({
        id: Date.now().toString(),
        name: deleteConfirm.item.title,
        type: 'track',
        data: { ...deleteConfirm.item, albumId: deleteConfirm.albumId },
        deletedAt: Date.now()
      });
      deleteTrack(deleteConfirm.albumId, deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const handleSongUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (albums.length === 0) {
      addAlbum('My Uploads', 'My uploaded tracks');
    }
    const targetAlbumId = activeAlbumId || albums[0]?.id || Date.now().toString();

    setUploading(true);
    try {
      const url = URL.createObjectURL(file);

      addTrackToAlbum(targetAlbumId, {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
        url,
        coverUrl: albums.find(a => a.id === targetAlbumId)?.coverUrl
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-[var(--grid-gap)] pb-10">
      
      {/* Top Bar Area */}
      <motion.header layout className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-[var(--grid-gap)]">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-primary)] mb-2">Music Library</h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">Sound that moves with you, not against you.</p>
        </div>
      </motion.header>

      {/* Control Bar */}
      <motion.div layout className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--card-bg)] border border-[var(--border)] p-[calc(var(--card-padding)*0.6)] rounded-2xl backdrop-blur-md shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)] opacity-60" size={18} />
          <input 
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] placeholder-opacity-60 focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsNewAlbumModalOpen(true)}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Create Album</span>
          </button>
          
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleSongUpload} 
            accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 blur-0"
          >
            {uploading ? <div className="w-4 h-4 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" /> : <Upload size={18} />}
            <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload Song'}</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      {!activeAlbum ? (
        <section>
          {albums.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-2xl text-[var(--text-secondary)] opacity-80">
              <Music size={48} className="mb-4 opacity-50 text-[var(--accent)]" />
              <p className="text-lg">No albums yet.</p>
              <p className="text-sm mt-1">Create one to curate your sounds.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[var(--grid-gap)]">
              <AnimatePresence>
                {filteredAlbums.map((album, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    key={album.id} 
                    onClick={() => setActiveAlbumId(album.id)}
                    className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-[var(--card-padding)] cursor-pointer hover:scale-[1.03] hover:shadow-[0_4px_25px_var(--shadow-color)] hover:border-[var(--accent)] transition-all duration-300 relative group shadow-sm"
                  >
                    <div className="aspect-square bg-[var(--bg-primary)] rounded-xl mb-4 overflow-hidden relative border border-[var(--border)]">
                      <img 
                        src={album.coverUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                        alt="cover" 
                      />
                      <div className="absolute inset-0 bg-[var(--bg-primary)] opacity-0 group-hover:opacity-40 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                         {/* overlay hit area */}
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(album.tracks.length > 0) playTrack(album.tracks, 0); }}
                          className="w-14 h-14 bg-[var(--accent)] rounded-full text-[var(--bg-primary)] flex items-center justify-center hover:scale-110 transition-all disabled:opacity-50 z-10"
                          disabled={album.tracks.length === 0}
                        >
                          <Play size={26} className="ml-1" fill="currentColor" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-[var(--text-primary)] font-medium truncate text-lg pr-6">{album.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{album.description}</p>
                    <p className="text-xs text-[var(--text-secondary)] opacity-50 mt-2">{album.tracks.length} tracks</p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ id: album.id, type: 'album', item: album });
                      }}
                      className="absolute top-6 right-6 p-2 bg-[var(--bg-primary)] backdrop-blur-md rounded-full text-[var(--danger)]/50 hover:text-[var(--danger)] hover:bg-[var(--danger)]/20 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditAlbumName(album.name);
                        setEditAlbumDesc(album.description || '');
                        setEditAlbumConfirm(album);
                      }}
                      className="absolute top-6 left-6 p-2 bg-[var(--bg-primary)] backdrop-blur-md rounded-full text-[var(--text-secondary)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      ) : (
        <section>
          {/* Inside Album View */}
          <motion.div layout className="mb-[var(--grid-gap)] flex flex-col md:flex-row items-center md:items-end gap-[var(--grid-gap)] bg-[var(--card-bg)] border border-[var(--border)] p-[var(--card-padding)] rounded-2xl relative overflow-hidden shadow-sm text-center md:text-left">
             
             {/* Gradient Background Blur */}
             <div 
               className="absolute inset-0 opacity-20 blur-3xl pointer-events-none"
               style={{ backgroundImage: `url(${activeAlbum.coverUrl})`, backgroundSize: 'cover' }}
             />

             <button 
               onClick={() => setActiveAlbumId(null)}
               className="absolute top-4 left-4 md:right-4 md:left-auto p-2 bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition z-10 border border-[var(--border)]"
             >
               <ChevronLeft size={20} className="inline" /> <span className="hidden sm:inline">Back</span>
             </button>

             <div className="w-40 h-40 md:w-48 md:h-48 mt-8 md:mt-0 rounded-xl overflow-hidden shrink-0 shadow-[0_10px_30px_var(--shadow-color)] relative z-10 border border-[var(--border)]">
                <img src={activeAlbum.coverUrl} className="w-full h-full object-cover" alt="cover" />
             </div>
             
             <div className="flex-1 relative z-10 w-full">
                <p className="text-[var(--accent)] text-xs tracking-widest font-bold uppercase mb-2">Album</p>
                <h3 className="text-3xl md:text-6xl font-bold text-[var(--text-primary)] mb-4 tracking-tight drop-shadow-md break-words">{activeAlbum.name}</h3>
                <p className="text-[var(--text-secondary)] mb-2 max-w-2xl mx-auto md:mx-0">{activeAlbum.description}</p>
                <p className="text-sm text-[var(--text-secondary)] opacity-60">{activeAlbum.tracks.length} tracks</p>
             </div>
          </motion.div>

          <div className="space-y-2">
            <AnimatePresence>
              {filteredTracks.map((track, idx) => {
                const isActive = currentTrack?.id === track.id;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={track.id} 
                    onClick={() => playTrack(activeAlbum.tracks, idx)}
                    className={`p-[var(--list-padding)] rounded-xl flex justify-between items-center cursor-pointer group transition-all duration-300 ${
                      isActive 
                        ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-[0_0_15px_var(--shadow-color)]' 
                        : 'bg-[var(--card-bg)] border border-transparent hover:bg-[var(--bg-primary)] hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                      <div className="w-8 text-center text-[var(--text-secondary)] opacity-40 font-mono text-sm group-hover:hidden">
                        {isActive && isPlaying ? (
                           <div className="flex justify-center gap-0.5 h-3 items-end">
                             <div className="w-1 bg-[var(--accent)] animate-[bounce_1s_infinite_0ms]" />
                             <div className="w-1 bg-[var(--accent)] animate-[bounce_1s_infinite_200ms]" />
                             <div className="w-1 bg-[var(--accent)] animate-[bounce_1s_infinite_400ms]" />
                           </div>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="w-8 text-center text-[var(--text-primary)] hidden group-hover:block">
                        <Play size={14} fill="currentColor" className="ml-2" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {renamingTrackId === track.id ? (
                          <input 
                            autoFocus
                            value={newTrackName}
                            onChange={(e) => setNewTrackName(e.target.value)}
                            onBlur={() => {
                              if (newTrackName.trim()) renameTrack(activeAlbum.id, track.id, newTrackName.trim());
                              setRenamingTrackId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (newTrackName.trim()) renameTrack(activeAlbum.id, track.id, newTrackName.trim());
                                setRenamingTrackId(null);
                              } else if (e.key === 'Escape') setRenamingTrackId(null);
                            }}
                            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] w-full max-w-sm focus:outline-none focus:border-[var(--accent)]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={`block truncate ${isActive ? 'text-[var(--accent)] font-medium drop-shadow-sm' : 'text-[var(--text-primary)]'}`}>
                            {track.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setNewTrackName(track.title);
                           setRenamingTrackId(track.id);
                         }}
                         className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/10 transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setDeleteConfirm({ id: track.id, type: 'track', albumId: activeAlbum.id, item: track });
                         }}
                         className="p-2 text-[var(--danger)]/60 hover:text-[var(--danger)] rounded-lg hover:bg-[var(--danger)]/10 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredTracks.length === 0 && (
               <div className="text-silver-wisteria/50 text-sm py-4 italic border border-dashed border-white/10 rounded-xl flex justify-center items-center h-32">
                 No tracks inside. Upload some sounds.
               </div>
            )}
          </div>
        </section>
      )}

      {/* New Album Modal */}
      <Modal isOpen={isNewAlbumModalOpen} onClose={() => setIsNewAlbumModalOpen(false)} title="New Album">
        <form onSubmit={handleCreateAlbum} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-silver-wisteria">Album Title</label>
            <input 
              type="text" 
              required
              autoFocus
              value={newAlbumName}
              onChange={e => setNewAlbumName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-iris-mist/30 focus:outline-none focus:border-plum-blossom/50 transition-colors"
              placeholder="e.g. Deep Work Focus"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-silver-wisteria">Description <span className="text-white/30 text-xs">(optional)</span></label>
            <input 
              type="text" 
              value={newAlbumDesc}
              onChange={e => setNewAlbumDesc(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-iris-mist/30 focus:outline-none focus:border-plum-blossom/50 transition-colors"
              placeholder="A vibe for coding..."
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded-xl bg-plum-blossom text-midnight-orchid font-medium hover:brightness-110 transition mt-4"
          >
            Create Album
          </button>
        </form>
      </Modal>

      {/* Edit Album Modal */}
      <Modal isOpen={!!editAlbumConfirm} onClose={() => setEditAlbumConfirm(null)} title="Edit Album">
        <form onSubmit={handleEditAlbum} className="space-y-5">
          <div className="flex gap-4 items-center mb-2">
            <div className="w-24 h-24 rounded-xl overflow-hidden relative group border border-white/10 shrink-0">
               <img src={editAlbumConfirm?.coverUrl} className="w-full h-full object-cover" alt="cover" />
               <div 
                 onClick={() => coverInputRef.current?.click()}
                 className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
               >
                 {uploadingCover ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <><ImageIcon size={20} className="text-white mb-1" /><span className="text-[10px] text-white">Change</span></>
                 )}
               </div>
               <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1 text-sm text-silver-wisteria/70">
               Click the cover image to upload a new one. Ideal size: 500x500px.
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-silver-wisteria">Album Title</label>
            <input 
              type="text" 
              required
              value={editAlbumName}
              onChange={e => setEditAlbumName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-iris-mist/30 focus:outline-none focus:border-plum-blossom/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-silver-wisteria">Description</label>
            <textarea 
              value={editAlbumDesc}
              onChange={e => setEditAlbumDesc(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-plum-blossom/50 transition-colors resize-none h-24"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded-xl bg-plum-blossom text-midnight-orchid font-medium hover:brightness-110 transition"
          >
            Save Changes
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Are you sure?">
        <div className="space-y-6">
          <p className="text-silver-wisteria">
            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm?.item.title || deleteConfirm?.item.name}</span>?
            {deleteConfirm?.type === 'album' && ' It will be moved to Trash.'}
            {deleteConfirm?.type === 'track' && ' This track will be permanently removed from the album.'}
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-silver-wisteria hover:text-white transition"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
