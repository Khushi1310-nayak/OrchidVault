import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, User as UserIcon, Eye, EyeOff, AudioWaveform } from 'lucide-react';

// Password Strength Helper
const validatePassword = (password: string) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
};

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isLogin = location.pathname === '/login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [pwValidation, setPwValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPwValidation(validatePassword(password));
  }, [password]);

  useEffect(() => {
    // Autofocus email input when switching modes
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
    // Clear errors when switching
    setError('');
    setPassword('');
  }, [isLogin]);

  if (authLoading) return <div className="min-h-screen bg-midnight-orchid flex items-center justify-center text-silver-wisteria">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const strengthScore = Object.values(pwValidation).filter(Boolean).length;
  const strengthText = strengthScore <= 1 ? 'Weak' : strengthScore <= 3 ? 'Medium' : 'Strong';
  const strengthColor = strengthScore <= 1 ? 'bg-red-400' : strengthScore <= 3 ? 'bg-yellow-400' : 'bg-green-400';

  const switchMode = () => {
    navigate(isLogin ? '/signup' : '/login');
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
          avatar: userCredential.user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (strengthScore < 4) {
          throw new Error('Please ensure your password meets all requirements.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: displayName || userCredential.user.email?.split('@')[0],
          avatar: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please use Google Login.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      
      {/* 🌌 LEFT SIDE (Immersive Visual Panel) */}
      <Link to="/" className="fixed top-6 left-6 md:top-8 md:left-8 text-[var(--accent)] hover:text-[var(--text-primary)] transition font-serif text-xl md:text-2xl z-50">
        OrchidVault
      </Link>

      <div className="hidden lg:flex w-1/2 h-screen bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)] relative overflow-hidden items-center justify-center">
        {/* Glow blobs */}
        <div className="absolute w-72 h-72 bg-[var(--accent)]/20 blur-[120px] animate-pulse rounded-full top-20 left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-[var(--accent)]/10 blur-[150px] animate-pulse rounded-full bottom-20 right-20 pointer-events-none" style={{ animationDuration: '6s' }} />
        
        {/* Particles */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549421255-eb541c469b62?q=80&w=2942&auto=format&fit=crop')] opacity-10 bg-cover bg-center pointer-events-none" style={{ mixBlendMode: 'overlay' }} />
        
        <div className="relative z-10 flex flex-col items-center">
          <AudioWaveform size={64} className="text-[var(--accent)] mb-8 opacity-80 animate-pulse" style={{ animationDuration: '4s' }} />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-2xl font-serif text-[var(--text-secondary)] italic tracking-wide max-w-sm text-center leading-relaxed drop-shadow-sm"
          >
            "Focus begins where noise fades."
          </motion.p>
        </div>
      </div>

      {/* 🧾 RIGHT SIDE — FORM CARD */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center relative p-4 sm:p-6 bg-[var(--bg-primary)]">
        
        {/* Ambient Background for Mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 bg-[var(--accent)]/10 blur-[100px] top-[-10%] left-[-10%] rounded-full" />
          <div className="absolute w-64 h-64 bg-[var(--accent)]/5 blur-[100px] bottom-[-10%] right-[-10%] rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[400px] bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_8px_32px_var(--shadow-color)] relative max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible custom-scrollbar z-10"
          >
            <h2 className="text-2xl md:text-3xl font-serif text-[var(--accent)] mb-1">
              {isLogin ? 'Enter Vault' : 'Create Sanctuary'}
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm opacity-80">
              {isLogin ? 'Welcome back. The space is still and waiting.' : 'Begin your focused journey today.'}
            </p>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm leading-relaxed shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3 mb-5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_var(--shadow-color)] transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg className="w-5 h-5 text-[#4285F4]" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="w-full flex items-center gap-4 mb-5 text-[var(--text-secondary)] opacity-60 text-sm font-medium">
              <div className="flex-1 h-px bg-[var(--border)]"></div>
              <span>OR</span>
              <div className="flex-1 h-px bg-[var(--border)]"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-[calc(var(--grid-gap)*0.75)]">
              
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Display Name</label>
                  <div className="relative group/input">
                    <UserIcon className="absolute left-3.5 top-3.5 text-[var(--text-secondary)] opacity-50 transition-colors group-focus-within/input:text-[var(--accent)]" size={18} />
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] placeholder-opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition-all font-medium"
                      placeholder="Elara"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Email</label>
                <div className="relative group/input">
                  <Mail className="absolute left-3.5 top-3.5 text-[var(--text-secondary)] opacity-50 transition-colors group-focus-within/input:text-[var(--accent)]" size={18} />
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] placeholder-opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition-all font-medium"
                    placeholder="elara@orchid.vault"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Password</label>
                <div className="relative group/input">
                  <Lock className="absolute left-3.5 top-3.5 text-[var(--text-secondary)] opacity-50 transition-colors group-focus-within/input:text-[var(--accent)]" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-10 text-[var(--text-primary)] placeholder-[var(--text-secondary)] placeholder-opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]/50 transition-all font-medium tracking-wide"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[var(--text-secondary)] opacity-50 hover:text-[var(--accent)] transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* 🔐 Password Strength Checker For Signup */}
                {!isLogin && password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                    <div className="flex gap-1 mb-2 h-1.5 w-full rounded-full overflow-hidden bg-[var(--bg-primary)]">
                      <div className={`h-full transition-all duration-300 ${pwValidation.length ? strengthColor : 'bg-transparent'}`} style={{ width: '25%' }} />
                      <div className={`h-full transition-all duration-300 ${pwValidation.length && (pwValidation.uppercase || pwValidation.number || pwValidation.special) ? strengthColor : 'bg-transparent'}`} style={{ width: '25%' }} />
                      <div className={`h-full transition-all duration-300 ${strengthScore >= 3 ? strengthColor : 'bg-transparent'}`} style={{ width: '25%' }} />
                      <div className={`h-full transition-all duration-300 ${strengthScore === 4 ? strengthColor : 'bg-transparent'}`} style={{ width: '25%' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-[var(--text-secondary)]">
                      <span className={pwValidation.length ? 'text-green-500' : 'text-[var(--text-secondary)] opacity-50'}>
                        {pwValidation.length ? '✔' : '✖'} 8+ chars
                      </span>
                      <span className={pwValidation.uppercase ? 'text-green-500' : 'text-[var(--text-secondary)] opacity-50'}>
                        {pwValidation.uppercase ? '✔' : '✖'} Uppercase
                      </span>
                      <span className={pwValidation.number ? 'text-green-500' : 'text-[var(--text-secondary)] opacity-50'}>
                        {pwValidation.number ? '✔' : '✖'} Number
                      </span>
                      <span className={pwValidation.special ? 'text-green-500' : 'text-[var(--text-secondary)] opacity-50'}>
                        {pwValidation.special ? '✔' : '✖'} Symbol
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-6 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] font-bold text-base hover:shadow-[0_0_20px_var(--shadow-color)] transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:pointer-events-none relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                {loading ? <Loader2 className="animate-spin" size={24} /> : (isLogin ? 'Enter Vault' : 'Create Sanctuary')}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-[var(--text-secondary)] opacity-80 text-sm">
              {isLogin ? "Don't have an account?" : "Already have one?"}
              <button onClick={switchMode} className="ml-2 font-medium text-[var(--accent)] hover:text-[var(--text-primary)] hover:underline underline-offset-4 transition-all">
                {isLogin ? 'Create one' : 'Enter Vault'}
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
