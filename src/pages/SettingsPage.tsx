import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Trash2, Camera, AlertTriangle, Palette, Bell, Shield, Eye, EyeOff, Edit3, Check, Monitor } from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut, deleteUser, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../store/useSettings';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';

const COLORS = ["#D7C5D6", "#8870A3", "#BAB0C8", "#9a8c98", "#C3A6DF"];

function Toggle({ enabled, setEnabled }: { enabled: boolean, setEnabled: () => void }) {
  return (
    <div
      onClick={setEnabled}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shadow-inner
      ${enabled ? "bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" : "bg-[var(--bg-primary)] opacity-50"}`}
    >
      <div
        className={`w-4 h-4 bg-[var(--highlight)] rounded-full transform transition-transform duration-300 shadow-sm
        ${enabled ? "translate-x-6" : ""}`}
      />
    </div>
  );
}

function ThemePicker({ color, setColor }: { color: string, setColor: (c: string) => void }) {
  return (
    <div className="flex gap-4 md:gap-5 flex-wrap p-1">
      {COLORS.map((c) => (
        <div
          key={c}
          onClick={() => setColor(c)}
          className={`w-7 h-7 md:w-8 md:h-8 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center relative ${color === c ? 'shadow-[0_0_15px_currentColor]' : ''}`}
          style={{ background: c, color: c }}
        >
          {color === c && (
            <motion.div 
              layoutId="active-color"
              className="absolute -inset-1.5 border-2 border-[var(--text-primary)] rounded-full z-0 opacity-80"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <div className="w-full h-full rounded-full z-10 border border-white/10" />
        </div>
      ))}
    </div>
  );
}

function PasswordInput({ value, setValue, placeholder, error, valid }: { value: string, setValue: (v: string) => void, placeholder?: string, error?: boolean, valid?: boolean }) {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative w-full group ${error ? 'animate-shake' : ''}`}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 bg-[var(--bg-primary)] border rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]' : valid ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500' : 'border-[var(--border)]'}`}
      />
      <button
        onClick={() => setShow(!show)}
        type="button"
        className="absolute right-3 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function checkStrength(password: string) {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
}

export default function SettingsPage() {
  const { user } = useAuth();
  const settings = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile Edit
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [localDisplayName, setLocalDisplayName] = useState(user?.displayName || user?.email?.split('@')[0] || 'Sanctuary User');

  // Password Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSettingChange = (method: () => void) => {
    method();
    settings.syncToBackend();
  };

  const handleThemeChange = (theme: string) => {
    settings.setTheme(theme);
    settings.syncToBackend();
  };

  const handleAccentChange = (accent: string) => {
    settings.setAccent(accent);
    settings.syncToBackend();
  };

  const handleDensityChange = (density: 'compact' | 'comfortable') => {
    settings.setDensity(density);
    settings.syncToBackend();
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const photoURL = URL.createObjectURL(file);
      await updateProfile(user, { photoURL });
      await apiFetch('/user/profile', { method: 'PUT', body: JSON.stringify({ avatar: photoURL }) }).catch(console.error);
      toast.success("Avatar updated ✨");
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast.error("Failed to update avatar");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveName = async () => {
    if(!user || !displayName.trim()) return;
    setIsSavingName(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await apiFetch('/user/profile', { method: 'PUT', body: JSON.stringify({ name: displayName.trim() }) }).catch(console.error);
      setLocalDisplayName(displayName.trim());
      setIsEditingName(false);
      toast.success("Name updated ✨");
    } catch (e) {
      console.error(e);
      toast.error('Error updating display name.');
    } finally {
      setIsSavingName(false);
    }
  };

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!user || !user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setForgotPasswordSent(true);
      setTimeout(() => setForgotPasswordSent(false), 5000);
    } catch (e: any) {
      console.error(e);
      setPasswordError(e.message);
    }
  };

  const handleChangePassword = async () => {
    if (!user || user.email === null) return;
    setPasswordError('');
    setPasswordSuccess(false);
    
    if(!currentPassword || !newPassword) {
      setPasswordError('Please fill out both password fields.');
      return;
    }
    
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from the old one.');
      return;
    }

    const strength = checkStrength(newPassword);
    if (!strength.length || !strength.number || !strength.special) {
      setPasswordError('Password too weak. Ensure it meets all strength criteria.');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await sendPasswordResetEmail(auth, user.email);
      
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (e: any) {
      console.error(e);
      if (e.message.includes('invalid-credential')) {
        setPasswordError('Incorrect current password.');
      } else if (e.message.includes('weak-password')) {
        setPasswordError('Password too weak.');
      } else if (e.message.includes('requires-recent-login')) {
        setPasswordError('Session expired. Please login again.');
      } else {
        setPasswordError('Error updating password. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [reauthError, setReauthError] = useState('');

  const handleReauthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !user.email) return;
    
    setIsReauthenticating(true);
    setReauthError('');
    
    try {
      const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
      
      if (isGoogle) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithCredential(user, GoogleAuthProvider.credentialFromResult(await signInWithPopup(auth, provider))!);
      } else {
        if (!reauthPassword) {
          setReauthError('Please enter your password.');
          setIsReauthenticating(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email, reauthPassword);
        await reauthenticateWithCredential(user, credential);
      }
      
      setShowReauthModal(false);
      setReauthPassword('');
      toast.success("Successfully re-authenticated ✨");
    } catch (err: any) {
      console.error('Re-authentication failed:', err);
      setReauthError(err.message || 'Re-authentication failed.');
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await apiFetch('/user', { method: 'DELETE' }).catch(console.error);
      await deleteUser(user);
    } catch (err: any) {
      console.error('Error deleting account:', err);
      if (err.code === 'auth/requires-recent-login') {
        setShowReauthModal(true);
      } else {
        toast.error(err.message || 'Failed to delete account.');
      }
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="relative max-w-4xl mx-auto pb-16 px-2 sm:px-0">
      
      <header className="mb-8 md:mb-10 relative z-10 pt-4">
        <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-primary)] mb-2 tracking-tight">Settings</h2>
        <p className="text-[var(--text-secondary)] font-light tracking-wide text-sm md:text-base">Personalize your sanctuary</p>
      </header>

      <motion.div 
        layout
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 md:space-y-[calc(var(--grid-gap)*1.5)] relative z-10"
      >
        
        {/* Profile Section 👤 */}
        <motion.section layout variants={itemVariants} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 md:p-[calc(var(--card-padding)*1.5)] shadow-[0_0_8px_var(--shadow-color)] hover:shadow-[0_0_20px_var(--shadow-color)] transition-all duration-500 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--accent)] rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />
          
          <h3 className="text-xl font-medium text-[var(--text-primary)] mb-8 flex items-center gap-3">
            <User size={22} className="text-[var(--accent)]" /> Profile
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 relative z-10 text-center sm:text-left">
            <div className="relative group/avatar cursor-pointer shrink-0">
              <div className="absolute inset-0 bg-[var(--accent)] rounded-full blur-md opacity-20 group-hover/avatar:opacity-50 transition-opacity duration-300 scale-110" />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-[var(--text-primary)] text-4xl font-serif shadow-xl ring-4 ring-[var(--border)] overflow-hidden"
                style={{ background: `linear-gradient(to top right, var(--bg-primary), var(--accent))` }}
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                ) : (
                  <span>{(user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}</span>
                )}
                
                <div className="absolute inset-0 bg-black opacity-0 group-hover/avatar:opacity-40 transition-opacity duration-300 flex flex-col items-center justify-center gap-1">
                  {uploading ? (
                     <div className="w-6 h-6 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera size={22} className="text-white" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-white">Change</span>
                    </>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleAvatarSelect} 
                accept="image/*"
              />
            </div>
            
            <div className="flex-1 space-y-2 w-full">
              {isEditingName ? (
                <div className="flex items-center gap-2 max-w-sm mx-auto sm:mx-0">
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 min-w-0 bg-[var(--bg-primary)] border border-[var(--accent)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition disabled:opacity-50"
                    autoFocus
                    disabled={isSavingName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <button 
                    onClick={handleSaveName} 
                    disabled={isSavingName}
                    className="p-2 w-9 h-9 flex items-center justify-center text-[var(--text-primary)] bg-[var(--accent)] rounded-lg hover:opacity-90 transition disabled:opacity-50 shrink-0"
                  >
                    {isSavingName ? (
                      <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                  </button>
                  <button 
                    onClick={() => setIsEditingName(false)} 
                    disabled={isSavingName}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] rounded-lg transition disabled:opacity-50 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-3 group/name">
                  <h4 className="text-[var(--text-primary)] font-medium text-2xl md:text-3xl font-serif truncate">{localDisplayName}</h4>
                  <button onClick={() => setIsEditingName(true)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] rounded-md transition opacity-100 sm:opacity-0 sm:group-hover/name:opacity-100 flex-shrink-0">
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
              <p className="text-[var(--text-secondary)] font-mono text-xs md:text-sm tracking-wide truncate">{user?.email}</p>
            </div>
          </div>
        </motion.section>

        {/* Preferences Section 🎨 */}
        <motion.section layout variants={itemVariants} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 md:p-[calc(var(--card-padding)*1.5)] shadow-[0_0_8px_var(--shadow-color)] hover:shadow-[0_0_20px_var(--shadow-color)] transition-all duration-500 backdrop-blur-sm group">
          <h3 className="text-xl font-medium text-[var(--text-primary)] mb-8 flex items-center gap-3">
            <Palette size={22} className="text-[var(--accent)]" /> Preferences
          </h3>
          
          <div className="space-y-8 max-w-2xl px-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[var(--text-primary)] font-medium text-lg">Theme Appearance</h4>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Switch between Dark and Orchid modes.</p>
              </div>
              <div className="flex bg-[var(--bg-primary)] p-1.5 rounded-xl border border-[var(--border)] w-full sm:w-fit">
                <button 
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === 'dark' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  Dark
                </button>
                <button 
                  onClick={() => handleThemeChange('orchid')}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === 'orchid' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  Orchid
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-[var(--border)]" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xs">
                <h4 className="text-[var(--text-primary)] font-medium text-lg">Accent Color</h4>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Personalize your UI highlights.</p>
              </div>
              <div className="w-full sm:w-auto bg-[var(--bg-primary)]/50 p-4 rounded-2xl border border-[var(--border)] overflow-visible">
                <ThemePicker color={settings.accent} setColor={handleAccentChange} />
              </div>
            </div>

            <div className="h-px w-full bg-[var(--border)]" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[var(--text-primary)] font-medium text-lg">UI Density</h4>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Spacing of interface elements.</p>
              </div>
              <div className="flex bg-[var(--bg-primary)] p-1.5 rounded-xl border border-[var(--border)] w-full sm:w-fit overflow-x-auto">
                <button 
                  onClick={() => handleDensityChange('compact')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${settings.density === 'compact' ? 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  <Monitor size={16} className="inline mr-2 opacity-70" /> Compact
                </button>
                <button 
                  onClick={() => handleDensityChange('comfortable')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${settings.density === 'comfortable' ? 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  <Monitor size={16} className="inline mr-2 opacity-70" /> Comfortable
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Notifications Section 🔔 */}
        <motion.section layout variants={itemVariants} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 md:p-[calc(var(--card-padding)*1.5)] shadow-[0_0_8px_var(--shadow-color)] hover:shadow-[0_0_20px_var(--shadow-color)] transition-all duration-500 backdrop-blur-sm group">
          <h3 className="text-xl font-medium text-[var(--text-primary)] mb-8 flex items-center gap-3">
            <Bell size={22} className="text-[var(--accent)]" /> Notifications
          </h3>
          
          <div className="space-y-4 md:space-y-[calc(var(--grid-gap)*0.75)] max-w-2xl px-1">
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--bg-primary)] transition-colors border border-transparent hover:border-[var(--border)] gap-4">
              <div className="min-w-0">
                <h4 className="text-[var(--text-primary)] font-medium">App Alerts</h4>
                <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-1 truncate">Alerts about system updates.</p>
              </div>
              <Toggle enabled={settings.appNotifications} setEnabled={() => handleSettingChange(settings.toggleAppNotifications)} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--bg-primary)] transition-colors border border-transparent hover:border-[var(--border)] gap-4">
              <div className="min-w-0">
                <h4 className="text-[var(--text-primary)] font-medium">Study Reminders</h4>
                <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-1 truncate">Productivity nudges.</p>
              </div>
              <Toggle enabled={settings.studyReminders} setEnabled={() => handleSettingChange(settings.toggleStudyReminders)} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--bg-primary)] transition-colors border border-transparent hover:border-[var(--border)] gap-4">
              <div className="min-w-0">
                <h4 className="text-[var(--text-primary)] font-medium">Music Suggestions</h4>
                <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-1 truncate">Recommendations.</p>
              </div>
              <Toggle enabled={settings.musicSuggestions} setEnabled={() => handleSettingChange(settings.toggleMusicSuggestions)} />
            </div>
          </div>
        </motion.section>

        {/* Security Section 🔐 */}
        <motion.section layout variants={itemVariants} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl md:rounded-3xl p-6 md:p-[calc(var(--card-padding)*1.5)] shadow-[0_0_8px_var(--shadow-color)] hover:shadow-[0_0_20px_var(--shadow-color)] transition-all duration-500 backdrop-blur-sm group">
          <h3 className="text-xl font-medium text-[var(--text-primary)] mb-8 flex items-center gap-3">
            <Shield size={22} className="text-[var(--accent)]" /> Security
          </h3>
          
          <div className="max-w-md space-y-[calc(var(--grid-gap)*0.75)]">
            <div className="relative">
              <AnimatePresence>
                {passwordSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--card-bg)] backdrop-blur-md rounded-2xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)] text-center p-4"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                      <Check size={28} className="text-green-500" />
                    </div>
                    <p className="text-green-500 font-medium text-base md:text-lg">Password Changed!</p>
                    <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-2">A confirmation email has been sent.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <h4 className="text-[var(--text-primary)] font-medium mb-4">Change Password</h4>
              <div className="space-y-4">
                <PasswordInput 
                  value={currentPassword} 
                  setValue={setCurrentPassword} 
                  placeholder="Current Password" 
                  error={!!passwordError && (passwordError.toLowerCase().includes('current') || passwordError.includes('both'))}
                />
                
                <div className="space-y-2">
                  <PasswordInput 
                    value={newPassword} 
                    setValue={setNewPassword} 
                    placeholder="New Password" 
                    error={!!passwordError && (passwordError.includes('weak') || passwordError.includes('different') || passwordError.includes('both'))}
                    valid={newPassword.length > 0 && checkStrength(newPassword).length && checkStrength(newPassword).number && checkStrength(newPassword).special}
                  />
                  
                  {/* Password Strength UI */}
                  {newPassword.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-semibold mt-2 px-1">
                      <span className={`${checkStrength(newPassword).length ? 'text-green-500' : 'text-[var(--text-secondary)]/60'}`}>8+ Chars</span>
                      <span className="text-[var(--text-secondary)]/30 hidden sm:inline">•</span>
                      <span className={`${checkStrength(newPassword).number ? 'text-green-500' : 'text-[var(--text-secondary)]/60'}`}>Number</span>
                      <span className="text-[var(--text-secondary)]/30 hidden sm:inline">•</span>
                      <span className={`${checkStrength(newPassword).special ? 'text-green-500' : 'text-[var(--text-secondary)]/60'}`}>Special</span>
                    </div>
                  )}
                </div>
                
                {passwordError && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[var(--danger)]/80 text-sm">{passwordError}</motion.p>
                )}
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                  <button 
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordSent}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 text-left"
                  >
                    {forgotPasswordSent ? 'Reset Email Sent ✓' : 'Forgot password?'}
                  </button>

                  <button 
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword}
                    className="py-2.5 px-6 shrink-0 bg-[var(--bg-primary)] border border-[var(--accent)]/50 rounded-xl text-[var(--accent)] font-medium hover:bg-[var(--accent)] hover:text-[var(--bg-primary)] hover:shadow-[0_0_15px_var(--accent)] transition-all drop-shadow-sm disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                  >
                    {isChangingPassword ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Account Section ❌ */}
        <motion.section layout variants={itemVariants} className="bg-[var(--card-bg)] border border-[var(--danger)]/30 rounded-2xl md:rounded-3xl p-6 md:p-[calc(var(--card-padding)*1.5)] shadow-[0_0_8px_var(--shadow-color)] hover:shadow-[0_0_20px_var(--danger)] transition-all duration-500 backdrop-blur-sm">
          <h3 className="text-xl font-medium text-[var(--text-primary)] mb-6 flex items-center gap-3">
            <AlertTriangle size={22} className="text-[var(--danger)]" /> Danger Zone
          </h3>
          
          <div className="space-y-4 max-w-2xl px-1">
            <button 
              onClick={() => signOut(auth)}
              className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--bg-primary)] hover:bg-opacity-80 border border-[var(--border)] transition-all duration-300 group gap-4"
            >
              <div className="text-left">
                <span className="text-[var(--text-primary)] font-medium group-hover:text-[var(--accent)] transition-colors block">Sign Out</span>
                <span className="text-sm text-[var(--text-secondary)] block mt-1">End your current session across this device.</span>
              </div>
              <LogOut size={22} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] sm:group-hover:-translate-x-1 transition-all shrink-0 self-end sm:self-center" />
            </button>

            <div>
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-[var(--danger)]/5 hover:bg-[var(--danger)]/10 border border-[var(--danger)]/20 transition-all duration-300 group gap-4"
                >
                  <div className="text-left">
                    <span className="text-[var(--danger)] font-medium tracking-wide block">Delete Account</span>
                    <span className="text-sm text-[var(--danger)]/70 block mt-1">Permanently remove your identity and all data.</span>
                  </div>
                  <Trash2 size={22} className="text-[var(--danger)]/50 group-hover:text-[var(--danger)] transition-colors shrink-0 self-end sm:self-center" />
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  className="p-5 md:p-6 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 overflow-hidden relative mt-2"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Trash2 size={120} className="text-[var(--danger)]" />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start gap-4 mb-6 text-[var(--danger)] relative z-10">
                    <AlertTriangle size={24} className="text-[var(--danger)] shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-[var(--danger)] text-lg">Are you absolutely sure?</h4>
                      <p className="text-sm mt-2 opacity-80 leading-relaxed max-w-md">This action cannot be undone. All your encrypted files, albums, and identity data will be permanently wiped.</p>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end relative z-10 border-t border-[var(--danger)]/20 pt-4">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="px-5 py-2.5 font-medium text-[var(--danger)] hover:opacity-80 bg-[var(--danger)]/10 rounded-xl transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="px-6 py-2.5 bg-[var(--danger)] text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                      Confirm Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

      </motion.div>

      {/* Re-authentication Modal */}
      <Modal 
        isOpen={showReauthModal} 
        onClose={() => {
          setShowReauthModal(false);
          setReauthError('');
          setReauthPassword('');
        }} 
        title="Session Verification"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mb-2">
              <Shield size={32} className="text-[var(--accent)]" />
            </div>
            <h4 className="text-[var(--text-primary)] font-semibold text-lg">Sensitive Action Verification</h4>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              For your security, we need you to verify your identity before performing this sensitive operation.
            </p>
          </div>

          <form onSubmit={handleReauthenticate} className="space-y-4">
            {user?.providerData.some(p => p.providerId === 'google.com') ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleReauthenticate()}
                  disabled={isReauthenticating}
                  className="w-full py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                >
                  {isReauthenticating ? (
                    <div className="w-5 h-5 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-[#4285F4]" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Verify with Google
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <PasswordInput 
                  value={reauthPassword} 
                  setValue={setReauthPassword} 
                  placeholder="Enter current password"
                  error={!!reauthError}
                />
                
                {reauthError && (
                  <p className="text-[var(--danger)] text-xs text-center">{reauthError}</p>
                )}

                <button
                  type="submit"
                  disabled={isReauthenticating || !reauthPassword}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] font-bold hover:opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isReauthenticating ? (
                    <div className="w-5 h-5 border-2 border-[var(--bg-primary)] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify Identity'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </Modal>
    </div>
  );
}
