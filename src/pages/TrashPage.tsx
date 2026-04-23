import React, { useState } from 'react';
import { Trash2, RotateCcw, Folder, Music, FileText, LayoutGrid } from 'lucide-react';
import { useTrash } from '../store/useTrash';
import { useFiles } from '../store/useFiles';
import { useMusic } from '../store/useMusic';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrashPage() {
  const { items, emptyTrash, permanentlyDelete, restore } = useTrash();
  const [filter, setFilter] = useState('all');

  const handleRestore = (item: any) => {
    const { id, type, data } = item;
    if (type === 'folder') {
       useFiles.setState(state => ({ folders: [...state.folders, data] }));
    } else if (type === 'album') {
       useMusic.setState(state => ({ albums: [...state.albums, data] }));
    } else if (type === 'file') {
       if (data.folderId) {
          useFiles.setState(state => {
            const fIdx = state.folders.findIndex(f => f.id === data.folderId);
            if (fIdx === -1) {
               const rootExists = state.folders.find(f => f.name === 'Restored Files');
               if(rootExists) {
                  return { folders: state.folders.map(f => f.id === rootExists.id ? {...f, files: [...f.files, data]} : f) }
               } else {
                  return { folders: [...state.folders, { id: 'restored', name: 'Restored Files', files: [data], createdAt: Date.now() }] }
               }
            }
            return {
               folders: state.folders.map(f => f.id === data.folderId ? {...f, files: [...f.files, data]} : f)
            };
          })
       }
    } else if (type === 'track') {
       if (data.albumId) {
          useMusic.setState(state => {
            const aIdx = state.albums.findIndex(a => a.id === data.albumId);
            if (aIdx === -1) {
               const rootExists = state.albums.find(a => a.name === 'Restored Tracks');
               if(rootExists) {
                  return { albums: state.albums.map(a => a.id === rootExists.id ? {...a, tracks: [...a.tracks, data]} : a) }
               } else {
                  return { albums: [...state.albums, { id: 'restored', name: 'Restored Tracks', description: 'Restored tracks', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop', tracks: [data], createdAt: Date.now() }] }
               }
            }
            return {
               albums: state.albums.map(a => a.id === data.albumId ? {...a, tracks: [...a.tracks, data]} : a)
            };
          })
       }
    }
    restore(id);
  };

  const handleRestoreAll = () => {
    const currentItems = useTrash.getState().items;
    currentItems.forEach(item => handleRestore(item));
  };
  
  const filteredItems = items.filter(item => 
    filter === 'all' ? true : 
    filter === 'folder' ? item.type === 'folder' || item.type === 'file' : 
    filter === 'album' ? item.type === 'album' || item.type === 'track' : 
    item.type === filter
  );

  return (
    <div className="max-w-6xl mx-auto space-y-[var(--grid-gap)] pb-10 relative">
      <div className="absolute inset-x-0 -top-40 h-[500px] bg-[var(--accent)]/5 blur-[120px] pointer-events-none rounded-full" />

      <motion.header layout className="flex flex-col md:flex-row gap-4 items-start md:items-center md:justify-between relative z-10 mb-[var(--grid-gap)]">
        <div>
          <h2 className="text-4xl font-serif text-[var(--text-primary)] mb-2 tracking-tight">Trash</h2>
          <p className="text-[var(--text-secondary)] font-light italic opacity-80">“Nothing is truly lost… unless you decide it is.”</p>
        </div>
        
        {items.length > 0 && (
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={handleRestoreAll}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl hover:bg-green-500/20 hover:border-green-500/30 transition-all font-medium"
            >
              <RotateCcw size={18} />
              Restore All
            </button>
            <button 
              onClick={emptyTrash}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] rounded-xl hover:bg-[var(--danger)]/20 hover:border-[var(--danger)]/40 transition-all font-medium hover:shadow-[0_0_15px_var(--danger)] group"
            >
              <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
              Empty Trash
            </button>
          </div>
        )}
      </motion.header>

      {/* Filters */}
      {items.length > 0 && (
        <div className="flex gap-2 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors ${filter === 'all' ? 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] shadow-sm' : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
          >
            <LayoutGrid size={16} /> All
          </button>
          <button 
            onClick={() => setFilter('folder')}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors ${filter === 'folder' ? 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] shadow-sm' : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
          >
            <Folder size={16} /> Folders
          </button>
          <button 
            onClick={() => setFilter('album')}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-colors ${filter === 'album' ? 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] shadow-sm' : 'bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
          >
            <Music size={16} /> Albums
          </button>
        </div>
      )}

      <section className="relative z-10 min-h-[500px]">
        {items.length === 0 ? (
          <div className="h-[500px] flex flex-col items-center justify-center text-center">
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 rounded-3xl bg-[var(--card-bg)] backdrop-blur-sm flex items-center justify-center text-[var(--text-secondary)] mb-6 border border-[var(--border)] shadow-[0_0_50px_var(--shadow-color)]"
            >
              <Trash2 size={40} className="drop-shadow-[0_0_10px_var(--shadow-color)]" />
            </motion.div>
            <h3 className="text-2xl font-serif text-[var(--text-primary)] mb-2">Trash is empty</h3>
            <p className="text-[var(--text-secondary)] italic font-light tracking-wide text-lg">Your space is clean… nothing to recover.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--grid-gap)]">
            <AnimatePresence>
              {filteredItems.map(item => (
                <TrashCard key={item.id} item={item} onRestore={() => handleRestore(item)} onDelete={() => permanentlyDelete(item.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}

const TrashCard: React.FC<{ item: any; onRestore: () => void; onDelete: () => Promise<void> | void }> = ({ item, onRestore, onDelete }) => {
  const getIcon = () => {
    switch(item.type) {
      case 'folder': return <Folder size={20} className="text-[var(--accent)]" />;
      case 'album': return <Music size={20} className="text-[var(--accent)]" />;
      case 'file': return <FileText size={20} className="text-[var(--text-secondary)]" />;
      case 'track': return <Music size={20} className="text-[var(--text-secondary)]" />;
      default: return <FileText size={20} className="text-[var(--text-primary)]" />;
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-[var(--list-padding)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 hover:scale-[1.02] hover:bg-[var(--bg-primary)] hover:border-[var(--danger)]/30 hover:shadow-[0_0_20px_var(--shadow-color)] transition-all group duration-300"
    >
      <div className="flex items-center gap-4 overflow-hidden w-full sm:w-auto">
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center shrink-0 border border-[var(--border)]">
           {getIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[var(--text-primary)] font-medium truncate">{item.name || item.data?.title || 'Unknown'}</p>
          <span className="text-xs text-[var(--text-secondary)] capitalize tracking-wide block truncate">{item.type}</span>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={onRestore}
          className="p-2.5 text-green-500/80 hover:text-green-500 hover:bg-green-500/10 rounded-lg hover:scale-110 transition-all border border-transparent hover:border-green-500/20"
          title="Restore"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={onDelete}
          className="p-2.5 text-[var(--danger)]/80 hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg hover:scale-110 transition-all hover:shadow-[0_0_10px_var(--shadow-color)] border border-transparent hover:border-[var(--danger)]/20"
          title="Delete Permanently"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
