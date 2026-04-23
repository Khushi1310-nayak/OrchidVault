import { Link, useLocation } from 'react-router-dom';
import { Home, Music, FolderOpen, Settings, Trash2, LogOut, Menu, X, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Study Vault', path: '/files', icon: FolderOpen },
    { name: 'Music Library', path: '/music', icon: Music },
    { name: 'Trash', path: '/trash', icon: Trash2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg text-[var(--text-primary)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed md:static inset-y-0 left-0 w-64 bg-[var(--bg-primary)] border-r border-[var(--border)] p-[calc(var(--card-padding)*1.5)] flex flex-col z-40 shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 mb-10 mt-12 md:mt-0">
          <img src="/branding/splash.png" alt="OrchidVault" className="w-8 h-8 rounded-full object-cover drop-shadow-[0_0_10px_var(--accent)]" />
          <h1 className="text-[var(--text-primary)] text-xl font-serif font-semibold tracking-wide">OrchidVault</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="relative block w-full group"
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 bg-[var(--bg-secondary)] rounded-lg shadow-[0_0_15px_var(--shadow-color)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative flex items-center gap-4 px-[var(--list-padding)] py-[calc(var(--list-padding)*0.75)] rounded-lg transition-colors duration-200",
                  isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)] hover:shadow-sm"
                )}>
                  <Icon size={20} className={cn(isActive && "text-[var(--accent)]")} />
                  <span className="font-medium">{link.name}</span>
                </div>
              </Link>
            );
          })}
          
          {deferredPrompt && (
            <button 
              onClick={handleInstall}
              className="w-full flex items-center gap-4 px-[var(--list-padding)] py-[calc(var(--list-padding)*0.75)] rounded-lg text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors font-medium border border-[var(--accent)]/20 mt-4"
            >
              <Download size={20} />
              Install App
            </button>
          )}
        </nav>

        <button 
          onClick={() => signOut(auth)}
          className="flex items-center gap-4 px-[var(--list-padding)] py-[calc(var(--list-padding)*0.75)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-colors mt-auto font-medium"
        >
          <LogOut size={20} />
          Log out
        </button>
      </div>
    </>
  );
}
