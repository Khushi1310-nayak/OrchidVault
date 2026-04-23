import React, { useState, useRef, useEffect } from 'react';
import { Search, Folder, FileText, Upload, Trash2, Edit2, ChevronLeft, LayoutGrid, List, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFiles, FolderItem, FileItem } from '../store/useFiles';
import { useTrash } from '../store/useTrash';
import { useActivity } from '../store/useActivity';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';

const COLORS = ["#D7C5D6", "#BAB0C8", "#8870A3"];

function ColorPicker({ onSelect, currentColor }: { onSelect: (c: string) => void, currentColor?: string }) {
  return (
    <div className="flex gap-2">
      {COLORS.map((c) => (
        <div
          key={c}
          onClick={(e) => { e.stopPropagation(); onSelect(c); }}
          className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110"
          style={{ background: c, border: currentColor === c ? '2px solid white' : 'none' }}
        />
      ))}
    </div>
  );
}

export default function FilesPage() {
  const { folders, currentFolder, addFolder, deleteFolder, openFolder, addFileToFolder, deleteFile, renameFile, updateFileColor } = useFiles();
  const { addToTrash } = useTrash();
  const { logActivity } = useActivity();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');

  // Rename File State
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'folder' | 'file', parentId?: string, item: any } | null>(null);

  // PDF Viewer / Study Tracking State
  const [viewingPdf, setViewingPdf] = useState<FileItem | null>(null);
  const studyStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (viewingPdf) {
      studyStartRef.current = Date.now();
    } else {
      if (studyStartRef.current) {
        const timeStudied = Math.floor((Date.now() - studyStartRef.current) / 1000); // seconds
        if (timeStudied > 0) logActivity({ studyTime: timeStudied });
        studyStartRef.current = null;
      }
    }
  }, [viewingPdf, logActivity]);

  useEffect(() => {
    return () => {
      if (studyStartRef.current) {
        const timeStudied = Math.floor((Date.now() - studyStartRef.current) / 1000);
        if (timeStudied > 0) logActivity({ studyTime: timeStudied });
      }
    };
  }, [logActivity]);

  // Filter logic
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = currentFolder ? currentFolder.files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) : [];

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      try {
        await addFolder(newFolderName.trim());
        logActivity({ foldersCreated: 1 });
        toast.success("Folder saved ✨");
      } catch (err) {
        toast.error("Failed to create folder");
      }
      setNewFolderName('');
      setIsNewFolderModalOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (folders.length === 0) {
      await addFolder('My Uploads');
    }
    const targetFolderId = currentFolder ? currentFolder.id : (folders[0]?.id || Date.now().toString());

    setUploading(true);
    try {
      let url = '';
      try {
        const storageRef = ref(storage, `vault-files/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        url = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error('Cloud upload failed, using local URL fallback:', err);
        url = URL.createObjectURL(file);
      }
      
      addFileToFolder(targetFolderId, {
        id: Date.now().toString(),
        name: file.name,
        url,
        type: file.type,
        createdAt: Date.now(),
        color: COLORS[0]
      });
      logActivity({ filesAdded: 1 });
      toast.success("File uploaded to vault 🔒");
    } catch (err) {
      console.error('Full upload process failed:', err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'folder') {
      addToTrash({
        id: Date.now().toString(),
        name: deleteConfirm.item.name,
        type: 'folder',
        data: deleteConfirm.item,
        deletedAt: Date.now()
      });
      deleteFolder(deleteConfirm.id);
    } else if (deleteConfirm.type === 'file' && deleteConfirm.parentId) {
      addToTrash({
        id: Date.now().toString(),
        name: deleteConfirm.item.name,
        type: 'file',
        data: { ...deleteConfirm.item, folderId: deleteConfirm.parentId }, // need parent ID to restore later if supported
        deletedAt: Date.now()
      });
      deleteFile(deleteConfirm.parentId, deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-[var(--grid-gap)] pb-10">
      
      {/* Top Bar Area */}
      <motion.header layout className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-[var(--grid-gap)]">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-primary)] mb-2">Study Vault</h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base">Your knowledge, organized like a calm mind.</p>
        </div>
      </motion.header>

      {/* Control Bar */}
      <motion.div layout className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-[var(--card-bg)] border border-[var(--border)] p-[calc(var(--card-padding)*0.6)] rounded-2xl backdrop-blur-md shadow-sm">
        
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 text-[var(--text-secondary)] opacity-60" size={18} />
          <input 
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] placeholder-opacity-60 focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-[var(--bg-primary)] rounded-xl p-1 border border-[var(--border)] mr-2 shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-[var(--card-bg)] text-[var(--accent)] border border-[var(--border)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-[var(--card-bg)] text-[var(--accent)] border border-[var(--border)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <List size={18} />
            </button>
          </div>

          <button 
            onClick={() => setIsNewFolderModalOpen(true)}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition min-w-[110px]"
          >
            <Folder size={18} />
            <span className="text-sm sm:text-base">New</span>
          </button>
          
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 blur-0 min-w-[110px]"
          >
            {uploading ? <div className="w-4 h-4 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" /> : <Upload size={18} />}
            <span className="text-sm sm:text-base">{uploading ? 'Uploading...' : 'Upload'}</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      {!currentFolder ? (
        <section>
          {folders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-2xl text-[var(--text-secondary)] opacity-80">
              <Folder size={48} className="mb-4 opacity-50 text-[var(--accent)]" />
              <p className="text-lg">No collections yet.</p>
              <p className="text-sm mt-1">Create a folder to begin organizing.</p>
            </div>
          ) : (
            <motion.div layout className={`grid gap-[var(--grid-gap)] ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
              <AnimatePresence>
                {filteredFolders.map(folder => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={folder.id} 
                    onClick={() => openFolder(folder)}
                    className={`bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-[var(--card-padding)] cursor-pointer hover:scale-[1.03] transition-all relative flex ${viewMode === 'grid' ? 'flex-col' : 'items-center gap-6'} hover:border-[var(--accent)] hover:shadow-[0_4px_25px_var(--shadow-color)] group shadow-sm`}
                  >
                    <div className={`${viewMode === 'grid' ? 'mb-4' : ''}`}>
                      <Folder className="text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors" size={viewMode === 'grid' ? 32 : 24} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[var(--text-primary)] font-medium text-lg leading-tight truncate">{folder.name}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {folder.files.length} {folder.files.length === 1 ? 'file' : 'files'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ id: folder.id, type: 'folder', item: folder });
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-red-500/50 hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>
      ) : (
        <section>
          {/* Inside Folder View */}
          <motion.div layout className="mb-[var(--grid-gap)] flex flex-col md:flex-row items-center justify-between bg-[var(--card-bg)] border border-[var(--border)] p-[var(--card-padding)] rounded-xl shadow-sm gap-4 md:gap-0">
             <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
               <button 
                 onClick={() => openFolder(null)}
                 className="p-2 bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:shadow-sm transition shrink-0"
               >
                 <ChevronLeft size={20} />
               </button>
               <div className="min-w-0">
                  <h3 className="text-xl font-medium text-[var(--text-primary)] truncate">{currentFolder.name}</h3>
               </div>
             </div>
          </motion.div>

          <div className="space-y-[calc(var(--list-padding)*0.5)] relative">
            <AnimatePresence>
              {filteredFiles.map(file => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={file.id} 
                  className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-[var(--list-padding)] flex flex-col sm:flex-row justify-between items-start sm:items-center group overflow-visible transition-colors hover:shadow-[0_0_15px_var(--shadow-color)] gap-3 sm:gap-0"
                  style={{ borderLeft: `6px solid ${file.color || COLORS[0]}` }}
                >
                  <div className="flex-1 min-w-0 pr-4 cursor-pointer w-full" onClick={() => setViewingPdf(file)}>
                    {renamingFileId === file.id ? (
                      <input 
                        autoFocus
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onBlur={() => {
                          if (newFileName.trim()) renameFile(currentFolder.id, file.id, newFileName.trim());
                          setRenamingFileId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (newFileName.trim()) renameFile(currentFolder.id, file.id, newFileName.trim());
                            setRenamingFileId(null);
                          } else if (e.key === 'Escape') {
                            setRenamingFileId(null);
                          }
                        }}
                        className="bg-black/40 border border-white/20 rounded px-2 py-1 text-[#DAD4DF] w-full focus:outline-none focus:border-plum-blossom"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <p className="text-[#DAD4DF] font-medium truncate hover:underline underline-offset-4 decoration-plum-blossom/50">{file.name}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto">
                    {/* Color Picker Dropdown Wrapper */}
                    <div className="relative group/picker px-2 py-2">
                       <div className="w-5 h-5 rounded-full ring-2 ring-white/10 cursor-pointer" style={{ background: file.color || COLORS[0] }} />
                       <div className="absolute right-0 top-full mt-2 bg-[#1A1625] border border-white/10 p-3 rounded-xl shadow-xl opacity-0 invisible group-hover/picker:opacity-100 group-hover/picker:visible transition-all z-20">
                          <ColorPicker 
                            currentColor={file.color}
                            onSelect={(c) => updateFileColor(currentFolder.id, file.id, c)} 
                          />
                       </div>
                    </div>

                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setNewFileName(file.name);
                         setRenamingFileId(file.id);
                       }}
                       className="p-2 text-silver-wisteria hover:text-plum-blossom rounded-lg hover:bg-plum-blossom/10 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setDeleteConfirm({ id: file.id, type: 'file', parentId: currentFolder.id, item: file });
                       }}
                       className="p-2 text-silver-wisteria hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredFiles.length === 0 && (
               <div className="text-silver-wisteria/50 text-sm py-4 italic border border-dashed border-white/10 rounded-xl flex justify-center items-center h-32">
                 No files inside. Upload a PDF.
               </div>
            )}
          </div>
        </section>
      )}

      {/* New Folder Modal */}
      <Modal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} title="New Collection">
        <form onSubmit={handleCreateFolder} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-silver-wisteria">Collection Name</label>
            <input 
              type="text" 
              required
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-iris-mist/30 focus:outline-none focus:border-plum-blossom/50 transition-colors"
              placeholder="e.g. Semester 4"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 rounded-xl bg-plum-blossom text-midnight-orchid font-medium hover:brightness-110 transition"
          >
            Create Collection
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Are you sure?">
        <div className="space-y-6">
          <p className="text-[var(--text-secondary)]">
            Are you sure you want to delete <span className="text-[var(--text-primary)] font-medium">{deleteConfirm?.item.name}</span>? 
            It will be moved to Trash.
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="px-6 py-2 bg-[var(--danger)] text-white rounded-lg hover:brightness-110 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* PDF Viewer */}
      {viewingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--card-bg)] w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border)]"
          >
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)] shrink-0">
              <h3 className="text-[var(--text-primary)] font-medium text-lg truncate pr-4">{viewingPdf.name}</h3>
              <button 
                onClick={() => setViewingPdf(null)}
                className="p-2 bg-[var(--bg-primary)] hover:bg-[var(--danger)] hover:text-white text-[var(--text-secondary)] rounded-xl transition-colors"
                title="Close Viewer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-[#2d2d2d] w-full h-full">
               <iframe 
                 src={viewingPdf.url} 
                 className="w-full h-full border-none" 
                 title="PDF Viewer" 
               />
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
