import React from 'react';
import { motion, AnimatePresence } from "motion/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  hideHeader?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl", hideHeader = false }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* MODAL CONTAINER */}
          <div className="fixed inset-0 flex items-center justify-center z-[70] px-4 pointer-events-none">
            {/* MODAL CONTENT */}
              <motion.div
              layout
              className={`bg-[var(--bg-primary)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-[var(--card-padding)] md:p-[calc(var(--card-padding)*1.5)] w-full shadow-[0_20px_50px_var(--shadow-color)] text-[var(--text-primary)] pointer-events-auto relative overflow-hidden ${maxWidth}`}
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Optional Floating Glow */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent)]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

              {/* HEADER */}
              {!hideHeader && (
                <div className="flex justify-between items-center mb-[var(--grid-gap)] border-b border-[var(--border)] pb-4 relative z-10">
                  <h2 className="text-2xl md:text-3xl font-serif text-[var(--accent)] drop-shadow-sm">{title}</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>
              )}
              {hideHeader && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card-bg)] hover:bg-[var(--accent)] text-[var(--text-primary)] transition-colors z-50"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              )}

              {/* CONTENT */}
              <div className="max-h-[75vh] min-h-[40vh] overflow-y-auto text-sm md:text-base text-[var(--text-secondary)] font-light leading-relaxed custom-scrollbar pr-2 relative z-10">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
