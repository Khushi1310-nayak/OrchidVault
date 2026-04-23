import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F0B1A]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <img
          src="/branding/splash.png"
          alt="OrchidVault logo"
          className="w-40 h-40 md:w-56 md:h-56 rounded-full object-cover drop-shadow-[0_0_30px_rgba(136,112,163,0.3)]"
          onError={(e) => {
             // Fallback if image not generated yet
             e.currentTarget.style.display = 'none';
          }}
        />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-[#DAD4DF] text-2xl md:text-3xl tracking-[0.3em] font-serif font-light drop-shadow-sm"
      >
        ORCHIDVAULT
      </motion.h1>

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
        className="mt-6 h-1 bg-gradient-to-r from-transparent via-[#8870A3] to-transparent rounded-full opacity-50"
      />
    </div>
  );
}
