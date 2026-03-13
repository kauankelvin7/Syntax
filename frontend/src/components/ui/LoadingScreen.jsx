/*
 * 🌀 LOADING SCREEN
 * * Tema focado no Universo Tech / Engenharia de Software.
 * * Animações de orbes, partículas e SVG rotativo suave.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Z } from '../../constants/zIndex';
import Logo from '../Logo'; // Certifique-se de que o caminho está correto

// Partícula flutuante individual (Estilo "Data particles")
const Particle = ({ delay, x, duration, colorClass }) => (
  <motion.div
    className={`absolute w-1.5 h-1.5 rounded-full shadow-sm ${colorClass}`}
    style={{ left: `${x}%`, bottom: '20%' }}
    animate={{
      y: [0, -80, -180],
      x: [0, Math.random() * 20 - 10, Math.random() * 30 - 15], // Leve balanço lateral
      opacity: [0, 0.8, 0],
      scale: [0.2, 1.2, 0.2],
    }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

// Dot de loading sincronizado
const LoadingDot = ({ delay }) => (
  <motion.span
    className="block w-1.5 h-1.5 rounded-full bg-cyan-500/80 dark:bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
    transition={{ duration: 1.4, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

const LoadingScreen = () => {
  return (
    <>
      {/* Keyframes CSS para o shimmer Premium (Tech Colors: Indigo/Cyan) */}
      <style>{`
        @keyframes text-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #64748b 0%,
            #4f46e5 30%, /* Indigo */
            #06b6d4 50%, /* Cyan */
            #4f46e5 70%, /* Indigo */
            #64748b 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shimmer 3s ease-in-out infinite;
        }
        .dark .shimmer-text {
          background: linear-gradient(
            90deg,
            #475569 0%,
            #6366f1 30%, /* Indigo Light */
            #22d3ee 50%, /* Cyan Light */
            #6366f1 70%, /* Indigo Light */
            #475569 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl overflow-hidden"
        style={{ zIndex: Z.onboarding + 20 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* ── Camada 1: Orbe Grande (Atmosfera Base Indigo) ── */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[100px] pointer-events-none"
          animate={{ 
            scale: [1, 1.1, 1], 
            opacity: [0.3, 0.6, 0.3],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Camada 2: Orbe Cyan (Contraste Tech) ── */}
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-[80px] pointer-events-none"
          animate={{ 
            scale: [1.1, 0.9, 1.1], 
            opacity: [0.2, 0.5, 0.2],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* ── Partículas flutuantes (Bicolores Indigo/Cyan) ── */}
        {[
          { delay: 0,   x: 42, duration: 3.5, colorClass: "bg-indigo-500/50 dark:bg-indigo-400/40" },
          { delay: 1.2, x: 55, duration: 4.2, colorClass: "bg-cyan-500/50 dark:bg-cyan-400/40" },
          { delay: 2.5, x: 48, duration: 3.8, colorClass: "bg-indigo-500/50 dark:bg-indigo-400/40" },
          { delay: 0.8, x: 58, duration: 4.5, colorClass: "bg-cyan-500/50 dark:bg-cyan-400/40" },
          { delay: 3.0, x: 38, duration: 3.2, colorClass: "bg-indigo-500/50 dark:bg-indigo-400/40" },
        ].map((p, i) => (
          <Particle key={i} {...p} />
        ))}

        {/* ── Centro: Logo e Spinner Clean ── */}
        <div className="relative flex flex-col items-center z-10">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex items-center justify-center p-4"
          >
            {/* Anel SVG giratório Tech */}
            <motion.svg
              width="110" 
              height="110" 
              viewBox="0 0 100 100" 
              className="absolute inset-0 drop-shadow-lg"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            >
              <defs>
                <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="1" /> {/* Indigo */}
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" /> {/* Cyan */}
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" /> {/* Transparente */}
                </linearGradient>
              </defs>
              <rect 
                x="4" y="4" width="92" height="92" rx="30" 
                fill="none" 
                stroke="url(#spinner-grad)" 
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="140 100"
              />
            </motion.svg>

            {/* Logo do App */}
            <Logo size="large" iconOnly />
          </motion.div>

          {/* ── Nome e Status ── */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <h1 className="shimmer-text text-[15px] font-black tracking-[0.4em] uppercase select-none ml-2">
              Syntax
            </h1>

            <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-5 py-2.5 rounded-[12px] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Compilando
              </span>
              <div className="flex items-center gap-1.5">
                <LoadingDot delay={0}    />
                <LoadingDot delay={0.2}  />
                <LoadingDot delay={0.4}  />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default LoadingScreen;