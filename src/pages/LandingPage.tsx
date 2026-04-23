import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Book, Music, Clock, PlayCircle, Shield, ChevronRight, Folder, FileText, Settings, Settings2, Sparkles, AudioWaveform } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useSettings } from '../store/useSettings';

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setRotateX(-((y - centerY) / centerY) * 4);
    setRotateY(((x - centerX) / centerX) * 4);
    setMouseX(x);
    setMouseY(y);
  };

  return (
    <motion.div
      className={`relative transform-gpu perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotateX(0); setRotateY(0); }}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-[100]"
        style={{ 
          opacity: isHovered ? 1 : 0, 
          background: `radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(215, 197, 214, 0.08), transparent 40%)` 
        }}
      />
    </motion.div>
  );
};

const Navbar = ({ setActiveModal }: { setActiveModal: (val: any) => void }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 w-11/12 max-w-5xl z-50 flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 ${
        scrolled ? 'backdrop-blur-xl bg-white/10 shadow-lg scale-95' : 'backdrop-blur-md bg-white/5'
      }`}
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3">
        <img src="/branding/splash.png" alt="OrchidVault Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover drop-shadow-[0_0_8px_rgba(136,112,163,0.5)]" />
        <span className="font-serif font-semibold text-xl tracking-wide text-plum-blossom hidden sm:block">OrchidVault</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-iris-mist">
        {['Experience', 'Manifesto', 'Library'].map((link) => (
          <button key={link} onClick={() => setActiveModal(link.toLowerCase())} className="hover:text-plum-blossom hover:scale-105 transition-all outline-none text-left">
            {link}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
        <Link 
          to="/login" 
          className="text-[10px] sm:text-xs md:text-sm font-medium px-3 sm:px-5 py-2 text-silver-wisteria hover:text-white transition group relative overflow-hidden flex items-center gap-2"
        >
          <span className="hidden xs:inline">Enter Vault</span>
          <span className="xs:hidden">Enter</span>
          <span className="absolute left-0 bottom-0 w-full h-[1px] bg-plum-blossom scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </Link>
        <Link
          to="/signup"
          className="text-[10px] sm:text-xs md:text-sm font-medium px-3 sm:px-5 py-2 rounded-xl bg-plum-blossom/10 border border-plum-blossom/20 text-plum-blossom hover:bg-plum-blossom/20 transition-all shadow-sm whitespace-nowrap"
        >
          <span className="hidden xs:inline">Create Sanctuary</span>
          <span className="xs:hidden">Join</span>
        </Link>
      </div>
    </motion.nav>
  );
};

const Particles = ({ theme }: { theme: string }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${theme === 'orchid' ? 'opacity-20' : 'opacity-100'}`}>
      {[...Array(25)].map((_, i) => {
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-plum-blossom/50 blur-[1px]"
            style={{
              width: Math.random() * 4 + 2 + "px",
              height: Math.random() * 4 + 2 + "px",
              left: left + "%",
              top: "100%",
            }}
            animate={{
              y: [0, -window.innerHeight * 1.5],
              x: [0, (Math.random() - 0.5) * 100],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        );
      })}
    </div>
  );
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme } = useSettings();
  const [activeModal, setActiveModal] = useState<'experience' | 'manifesto' | 'library' | 'privacy' | 'terms' | 'contact' | null>(null);

  if (loading) return <div className="min-h-screen bg-deep-void flex items-center justify-center text-silver-wisteria">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleOpenModal = (modalName: any) => {
    setActiveModal(modalName);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-void to-midnight-orchid overflow-x-hidden selection:bg-dusky-lilac/50 font-sans tracking-wide">
      <Navbar setActiveModal={handleOpenModal} />

      {/* --- HERO SECTION --- */}
      <section className="relative flex items-center justify-center min-h-screen overflow-hidden pt-20">
        <Particles theme={theme} />
        
        {theme === 'orchid' && (
          <div className="absolute inset-0 pointer-events-none opacity-40 z-0 bg-[radial-gradient(ellipse_at_top,var(--bg-secondary),transparent_70%)]" style={{ background: 'conic-gradient(from 180deg at 50% 0%, rgba(255,255,255,0.1) 0deg, rgba(255,255,255,0.4) 180deg, rgba(255,255,255,0.1) 360deg)' }} />
        )}

        {/* Glow effect */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] bg-dusky-lilac rounded-full blur-[120px] pointer-events-none z-0" 
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          whileHover={{ rotateX: 2, rotateY: -2 }}
          className="backdrop-blur-xl bg-glass-bg border border-glass-border rounded-[2rem] p-10 md:p-16 text-center max-w-4xl shadow-[0_20px_50px_var(--shadow-color)] z-10 mx-6 transform-gpu perspective-1000"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full border border-dusky-lilac/30 bg-dusky-lilac/10"
          >
            <p className="text-xs tracking-[0.2em] font-semibold text-iris-mist">
              A STUDY & MUSIC COMPANION
            </p>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-serif text-silver-wisteria leading-tight drop-shadow-md">
            Your Personal <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-plum-blossom to-dusky-lilac">Focus Sanctuary</span>
          </h1>

          <p className="mt-6 text-lg text-iris-mist font-light max-w-xl mx-auto leading-relaxed">
            A contemplative environment where deep study meets curated auditory bliss. Step away from the noise.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center">
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-plum-blossom text-deep-void font-semibold shadow-[0_0_20px_rgba(215,197,214,0.3)] hover:shadow-[0_0_30px_rgba(215,197,214,0.5)] transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent z-10" />
                <span className="relative z-20 flex items-center gap-2">Enter Vault <ChevronRight size={18} /></span>
              </motion.button>
            </Link>

            <Link to="/signup">
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/20 text-silver-wisteria transition-colors"
              >
                Create Sanctuary
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="experience" className="py-20 md:py-32 relative z-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center justify-center">
          
          <FadeIn className="relative aspect-auto sm:aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden glass-panel border-white/10 shadow-[0_0_50px_rgba(136,112,163,0.15)] group transition-all duration-700 hover:shadow-[0_0_70px_rgba(136,112,163,0.3)] bg-gradient-to-br from-deep-void/80 to-midnight-orchid/80 backdrop-blur-md w-full">
            <TiltCard className="absolute inset-0 w-full h-full p-6 flex flex-col justify-center">
              
              {/* --- Ambient Floating Layer --- */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                <div className="absolute w-72 h-72 bg-dusky-lilac/20 blur-[100px] top-10 -left-10 animate-pulse rounded-full" />
                <div className="absolute w-64 h-64 bg-plum-blossom/10 blur-[100px] bottom-10 -right-10 animate-pulse rounded-full" style={{ animationDuration: '8s' }} />
              </div>

              <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 gap-6 h-full items-center">
                
                {/* --- Dashboard Preview Card --- */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl h-48 sm:h-[85%] flex flex-col justify-between hover:shadow-[0_0_20px_rgba(215,197,214,0.1)] transition-all group-hover:-translate-y-1">
                  <div className="h-4 w-32 bg-white/10 rounded mb-4 animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-3 flex-1 min-h-[80px]">
                    <div className="bg-white/5 rounded-lg animate-pulse h-full"></div>
                    <div className="bg-white/5 rounded-lg animate-pulse h-full"></div>
                    <div className="bg-white/5 rounded-lg animate-pulse h-full"></div>
                    <div className="bg-white/5 rounded-lg animate-pulse h-full"></div>
                  </div>
                </div>

                {/* --- Live Music Preview Card --- */}
                <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group/player hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(215,197,214,0.15)] transition-all duration-300 flex flex-col items-center justify-center h-48 sm:h-[85%]">
                  <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6 group-hover/player:shadow-[0_0_25px_rgba(215,197,214,0.4)] transition-all duration-500 bg-white/5">
                    <PlayCircle size={28} className="text-plum-blossom ml-0.5 animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-iris-mist mb-1">Now Playing</p>
                  <p className="text-silver-wisteria font-medium text-center leading-tight">Lo-fi Focus Flow</p>
                  
                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-6 overflow-hidden">
                    <div className="h-full bg-plum-blossom rounded-full animate-progress" />
                  </div>
                </div>

              </div>
            </TiltCard>
          </FadeIn>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-serif text-plum-blossom mb-4">Elegant Organization</h2>
              <p className="text-iris-mist font-light leading-relaxed">
                Experience a clutter-free interface designed to reduce cognitive load. Every element serves your focus.
              </p>
            </div>

            <div className="space-y-4">
              <FadeIn delay={0.1}>
                <TiltCard className="group glass-panel p-6 border-white/5 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(136,112,163,0.2)] hover:border-dusky-lilac/30 transition-all duration-300">
                  <div className="w-12 h-12 bg-dusky-lilac/20 rounded-xl flex items-center justify-center mb-4 text-plum-blossom">
                    <Book size={24} />
                  </div>
                  <h3 className="text-xl font-medium text-silver-wisteria mb-2">Academic Vault</h3>
                  <p className="text-iris-mist/80 text-sm">Store, organize, and access your PDFs and notes securely in a private cloud.</p>
                </TiltCard>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <TiltCard className="group glass-panel p-6 border-white/5 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(136,112,163,0.2)] hover:border-dusky-lilac/30 transition-all duration-300">
                  <div className="w-12 h-12 bg-dusky-lilac/20 rounded-xl flex items-center justify-center mb-4 text-plum-blossom">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-xl font-medium text-silver-wisteria mb-2">Privacy First</h3>
                  <p className="text-iris-mist/80 text-sm">Your data belongs to you. Secured by top-tier encryption and zero-ads architecture.</p>
                </TiltCard>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* --- MUSIC EXPERIENCE --- */}
      <section className="py-32 bg-deep-void/40 relative border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <FadeIn>
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <Music size={48} className="text-plum-blossom drop-shadow-[0_0_20px_rgba(215,197,214,0.5)]" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-serif text-silver-wisteria mb-6">Sound That Moves With You</h2>
            <p className="text-iris-mist font-light max-w-2xl mx-auto mb-16 text-lg">
              A built-in persistent music player ensures your curated focus playlists never drop a beat, even as you navigate between files and settings.
            </p>

            <div className="flex items-center justify-center gap-1.5 h-24">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 md:w-2 bg-gradient-to-t from-dusky-lilac to-plum-blossom rounded-full"
                  animate={{ height: ["10%", `${Math.random() * 80 + 20}%`, "10%"] }}
                  transition={{ 
                    duration: Math.random() * 1.5 + 1, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: i * 0.05 
                  }}
                />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- PHILOSOPHY --- */}
      <section id="manifesto" className="py-40 relative px-6 overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-midnight-orchid/0 to-dusky-lilac/10 rounded-full blur-3xl -z-10"
        />
        <FadeIn className="max-w-4xl mx-auto text-center" delay={0.2}>
          <motion.blockquote 
            whileHover={{ scale: 1.02 }}
            className="text-3xl md:text-5xl font-serif text-plum-blossom leading-relaxed font-light italic"
          >
            "In an age of endless distraction,<br/> attention is the greatest luxury."
          </motion.blockquote>
          <p className="mt-10 text-silver-wisteria uppercase tracking-[0.3em] text-sm">Our Core Philosophy</p>
        </FadeIn>
      </section>

      {/* --- STUDY TIMER --- */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <FadeIn>
            <h2 className="text-4xl font-serif text-plum-blossom mb-6">Master Your Time</h2>
            <p className="text-iris-mist font-light leading-relaxed mb-8 text-lg">
              Embrace the Pomodoro technique. Work intensely for 25 minutes, then drift into a restorative break. Rhythm builds empires.
            </p>
            <ul className="space-y-4 text-silver-wisteria/80">
              {['Seamless task switching', 'Customizable focus intervals', 'Integrated ambient alerts'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-dusky-lilac" /> {feat}
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn delay={0.2} className="flex justify-center">
            {/* Square glass panel container */}
            <TiltCard className="relative w-72 h-72 rounded-3xl border border-white/10 flex items-center justify-center glass-panel shadow-[0_0_50px_rgba(136,112,163,0.15)] group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-0" />
              
              {/* Perfectly bounded inner circular timer */}
              <div className="relative w-56 h-56 flex items-center justify-center z-10">
                <motion.div
                  className="absolute inset-0 rounded-full border-[3px] border-t-plum-blossom border-r-plum-blossom/30 border-b-transparent border-l-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full bg-plum-blossom/5"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <div className="text-5xl font-mono text-silver-wisteria font-light flex flex-col items-center gap-2">
                  <div className="flex items-center">
                    25<span className="text-2xl text-plum-blossom animate-pulse mx-1">:</span>00
                  </div>
                  <span className="text-xs font-sans uppercase tracking-widest text-iris-mist mt-1"><Clock size={14} className="inline mr-1" /> Focus</span>
                </div>
              </div>
            </TiltCard>
          </FadeIn>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-20 relative px-6 text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-6xl font-serif text-silver-wisteria mb-12 drop-shadow-lg">
            Begin Your Academic Ascendance
          </h2>
          <Link to="/signup">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-5 rounded-2xl font-semibold text-deep-void text-lg shadow-[0_0_20px_rgba(230,201,138,0.4)] hover:shadow-[0_0_40px_rgba(230,201,138,0.6)] transition-all duration-300 relative overflow-hidden group"
              style={{ background: 'linear-gradient(135deg, #E6C98A, #C9A85D)' }}
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out bg-gradient-to-r from-transparent via-white/50 to-transparent z-10" />
              <span className="relative z-20 flex items-center gap-3">Create Your Vault Now <ChevronRight /></span>
            </motion.button>
          </Link>
        </FadeIn>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 pt-16 pb-8 bg-[#0F0B1A]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-dusky-lilac to-plum-blossom opacity-80" />
            <span className="font-serif font-semibold text-lg text-iris-mist">OrchidVault</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-silver-wisteria/50">
            <button onClick={() => handleOpenModal('privacy')} className="hover:text-silver-wisteria hover:[text-shadow:0_0_8px_rgba(215,197,214,0.6)] transition-all">Privacy Policy</button>
            <button onClick={() => handleOpenModal('terms')} className="hover:text-silver-wisteria hover:[text-shadow:0_0_8px_rgba(215,197,214,0.6)] transition-all">Terms of Service</button>
            <button onClick={() => handleOpenModal('contact')} className="hover:text-silver-wisteria hover:[text-shadow:0_0_8px_rgba(215,197,214,0.6)] transition-all">Contact</button>
          </div>
        </div>
        <div className="text-center mt-12 text-xs text-silver-wisteria/30">
          © {new Date().getFullYear()} OrchidVault. All rights reserved.
        </div>
      </footer>

      {/* =========================================
          IMMERSIVE PORTAL MODALS
          ========================================= */}

      <Modal isOpen={activeModal === 'experience'} onClose={() => setActiveModal(null)} title="Experience" maxWidth="max-w-4xl" hideHeader>
        <div className="space-y-16 pb-8 relative">
          <motion.div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-dusky-lilac/20 rounded-full blur-[80px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          <FadeIn>
            <div className="text-center pt-8">
              <Sparkles className="mx-auto text-plum-blossom mb-4" size={32} />
              <h2 className="text-3xl font-serif text-white mb-2">A space where focus flows effortlessly</h2>
              <p className="text-iris-mist">Step inside the vault.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <TiltCard className="glass-panel p-8 border-white/10 hover:shadow-[0_0_30px_rgba(136,112,163,0.3)] hover:scale-[1.01] transition-all duration-500">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-20 h-20 bg-dusky-lilac/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden">
                  <Music className="text-plum-blossom" size={32} />
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-plum-blossom/20 to-transparent"
                    animate={{ y: [20, 0, 20] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-serif text-white mb-2">Persistent Soundscape</h3>
                  <p className="text-iris-mist/80 text-base">Music flows with you across every page. No interruptions. Just rhythm. A deep companion to your study sessions.</p>
                </div>
              </div>
            </TiltCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TiltCard className="glass-panel p-8 border-white/10 hover:shadow-[0_0_30px_rgba(136,112,163,0.3)] hover:scale-[1.01] transition-all duration-500">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-20 h-20 bg-dusky-lilac/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                  <Folder className="text-plum-blossom" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif text-white mb-2">Your Academic Sanctuary</h3>
                  <p className="text-iris-mist/80 text-base">Organize notes, assignments, and research in structured calm. Tag collections by color and instantly retrieve your critical literature.</p>
                </div>
              </div>
            </TiltCard>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TiltCard className="glass-panel p-8 border-white/10 hover:shadow-[0_0_30px_rgba(136,112,163,0.3)] hover:scale-[1.01] transition-all duration-500 relative overflow-hidden">
              <motion.div 
                 className="absolute inset-0 bg-gradient-to-r from-deep-void/50 to-midnight-orchid/50"
                 animate={{ opacity: [0.5, 0.8, 0.5] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative z-10 text-center py-6">
                <h3 className="text-3xl font-serif text-plum-blossom mb-3">Deep Work Mode</h3>
                <p className="text-silver-wisteria text-lg">Minimal distractions. Maximum clarity.</p>
              </div>
            </TiltCard>
          </FadeIn>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'manifesto'} onClose={() => setActiveModal(null)} title="Manifesto" maxWidth="max-w-4xl" hideHeader>
        <div className="space-y-24 py-12 text-center relative">
          
          <FadeIn>
            <motion.h2 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-4xl md:text-5xl font-serif text-silver-wisteria leading-snug max-w-2xl mx-auto"
            >
              “We believe focus is not forced.<br/>
              It is <span className="text-plum-blossom italic">invited.</span>”
            </motion.h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <FadeIn delay={0.2}>
              <TiltCard className="h-full glass-panel p-8 border-white/5 hover:border-white/20 transition duration-500 hover:shadow-[0_0_20px_rgba(136,112,163,0.2)]">
                <span className="text-2xl mb-4 block">🌿</span>
                <h4 className="text-white font-medium mb-2 text-lg">Clarity over chaos</h4>
                <p className="text-silver-wisteria/60">Your mind deserves stillness. We built a space devoid of ads and algorithmic feeds.</p>
              </TiltCard>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <TiltCard className="h-full glass-panel p-8 border-white/5 hover:border-white/20 transition duration-500 hover:shadow-[0_0_20px_rgba(136,112,163,0.2)]">
                <span className="text-2xl mb-4 block">🎧</span>
                <h4 className="text-white font-medium mb-2 text-lg">Sound as a companion</h4>
                <p className="text-silver-wisteria/60">Not noise. Not silence. The perfect balance of curated audio bridging study states.</p>
              </TiltCard>
            </FadeIn>

            <FadeIn delay={0.6}>
              <TiltCard className="h-full glass-panel p-8 border-white/5 hover:border-white/20 transition duration-500 hover:shadow-[0_0_20px_rgba(136,112,163,0.2)]">
                <span className="text-2xl mb-4 block">📚</span>
                <h4 className="text-white font-medium mb-2 text-lg">Intentional productivity</h4>
                <p className="text-silver-wisteria/60">Work with purpose, not pressure. Grow your knowledge garden at your own rhythm.</p>
              </TiltCard>
            </FadeIn>
          </div>

          <FadeIn delay={0.4}>
            <motion.p 
              whileHover={{ scale: 1.05 }}
              className="text-2xl md:text-3xl font-serif text-plum-blossom mt-20 pb-10 cursor-default"
            >
              “OrchidVault is not just a tool.<br/> It is a state of mind.”
            </motion.p>
          </FadeIn>

        </div>
      </Modal>

      <Modal isOpen={activeModal === 'library'} onClose={() => setActiveModal(null)} title="Library" maxWidth="max-w-5xl" hideHeader>
        <div className="space-y-16 py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-white mb-2">The Collection</h2>
            <p className="text-iris-mist">Everything you need, nothing you don't.</p>
          </div>

          {/* Grid Layout for Features */}
          <div className="grid md:grid-cols-2 gap-8">
            
            <FadeIn>
              <TiltCard className="h-full glass-panel p-8 border-white/5 hover:shadow-[0_0_30px_rgba(136,112,163,0.2)] transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <Folder className="text-plum-blossom" size={24} />
                  <h3 className="text-xl text-white font-medium">File System</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-silver-wisteria/80"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">📂</div> Create nested folders</li>
                  <li className="flex items-center gap-3 text-silver-wisteria/80"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">📄</div> Upload massive PDFs</li>
                  <li className="flex items-center gap-3 text-silver-wisteria/80"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">🎨</div> Apply custom color tags</li>
                </ul>
              </TiltCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <TiltCard className="h-full glass-panel p-8 border-white/5 hover:shadow-[0_0_30px_rgba(136,112,163,0.2)] transition-shadow relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-10 blur-xl group-hover:opacity-30 transition cursor-default">
                   <AudioWaveform size={140} />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <Music className="text-plum-blossom" size={24} />
                  <h3 className="text-xl text-white font-medium">Music System</h3>
                </div>
                <ul className="space-y-4 relative z-10">
                  <li className="flex items-center gap-3 text-silver-wisteria/80"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">🎵</div> Compile focus albums</li>
                  <li className="flex items-center gap-3 text-silver-wisteria/80"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">🖼️</div> Assign custom artwork</li>
                  <li className="flex items-center gap-3 text-silver-wisteria/80"><div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">▶️</div> Global floating playback</li>
                </ul>
              </TiltCard>
            </FadeIn>

            <FadeIn delay={0.1}>
              <TiltCard className="h-full glass-panel p-8 border-white/5 hover:shadow-[0_0_30px_rgba(136,112,163,0.2)] transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="text-plum-blossom" size={24} />
                  <h3 className="text-xl text-white font-medium">Smart Trash</h3>
                </div>
                <p className="text-silver-wisteria/60 text-sm mb-4 leading-relaxed">Safety nets built directly in. Accidental deletions aren't final until exactly 30 days have passed. Restore your notes with a single click, or securely shred files permanently.</p>
              </TiltCard>
            </FadeIn>

            <FadeIn delay={0.3}>
              <TiltCard className="h-full glass-panel p-8 border-white/5 hover:shadow-[0_0_30px_rgba(136,112,163,0.2)] transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <Settings2 className="text-plum-blossom" size={24} />
                  <h3 className="text-xl text-white font-medium">Personalization</h3>
                </div>
                <p className="text-silver-wisteria/60 text-sm mb-4 leading-relaxed">Mold your environment. Upload custom profile avatars, toggle gentle notification reminders, and configure auto-resume states for a seamless return to your session.</p>
              </TiltCard>
            </FadeIn>
            
          </div>
        </div>
      </Modal>

      {/* --- MODALS --- */}
      <Modal isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)} title="Privacy Policy">
        <p className="mb-4">
          Your data stays yours. OrchidVault does not sell, share, or misuse your personal information.
        </p>
        <p className="mb-4">
          All uploaded files and music are securely stored and accessible only to you.
        </p>
        <p>
          We use minimal analytics strictly to improve your experience.
        </p>
      </Modal>

      <Modal isOpen={activeModal === 'terms'} onClose={() => setActiveModal(null)} title="Terms of Service">
        <p className="mb-4">
          By using OrchidVault, you agree to use the platform responsibly.
        </p>
        <p className="mb-4">
          Upload only content you own or have permission to use.
        </p>
        <p>
          Misuse of the platform may result in account suspension.
        </p>
      </Modal>

      <Modal isOpen={activeModal === 'contact'} onClose={() => setActiveModal(null)} title="Contact">
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
            <span className="flex items-center gap-2"><span className="text-xl">📧</span> Email</span>
            <a href="mailto:khushinayak127@gmail.com" className="hover:text-plum-blossom transition hover:underline underline-offset-4">
              khushinayak127@gmail.com
            </a>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
            <span className="flex items-center gap-2"><span className="text-xl">💼</span> LinkedIn</span>
            <a href="https://www.linkedin.com/in/manisa-nayak-185bb5378/" target="_blank" rel="noreferrer" className="hover:text-plum-blossom transition hover:underline underline-offset-4">
              View Profile
            </a>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
            <span className="flex items-center gap-2"><span className="text-xl">💻</span> GitHub</span>
            <a href="https://github.com/Khushi1310-nayak" target="_blank" rel="noreferrer" className="hover:text-plum-blossom transition hover:underline underline-offset-4">
              View Projects
            </a>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
            <span className="flex items-center gap-2"><span className="text-xl">📱</span> Phone</span>
            <span className="font-mono text-plum-blossom">+91 7077780027</span>
          </div>
        </div>
      </Modal>

    </div>
  );
}
