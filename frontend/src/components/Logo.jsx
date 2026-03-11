/**
 * 💻 Logo Component & Showcase - Syntax Theme
 * * Componente da logo oficial com transições e tamanhos adaptativos.
 * * Tema: Engenharia de Software (Indigo/Cyan).
 */

import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ className = '', size = 'medium', iconOnly = false }) => {
  const sizes = {
    small:  { icon: 34, text: 'text-[18px]', sub: 'text-[9px]',  gap: 'gap-2' },
    medium: { icon: 48, text: 'text-[24px]', sub: 'text-[11px]', gap: 'gap-3' },
    large:  { icon: 72, text: 'text-[36px]', sub: 'text-[14px]', gap: 'gap-4' },
  };

  const s = sizes[size] || sizes.medium;

  const LogoIcon = ({ w = s.icon }) => (
    <img
      src="/android-chrome-512x512.png"
      width={w}
      height={w}
      alt="Syntax logo"
      style={{ 
        display: 'block', 
        objectFit: 'contain', 
        transform: 'scale(1.25)', 
        transformOrigin: 'center' 
      }}
    />  
  );

  if (iconOnly) {
    return <LogoIcon />;
  }

  return (
    <motion.div
      className={`flex items-center ${s.gap} ${className} select-none`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="shrink-0 flex items-center justify-center">
        <LogoIcon />
      </div>

      <div className="flex flex-col justify-center">
        <span 
          className={`${s.text} font-black tracking-tighter leading-none bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400`}
        >
          Syntax
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-[2px] w-3 bg-indigo-500 dark:bg-cyan-400 rounded-full" />
          <span className={`${s.sub} text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] uppercase`}>
            Engenharia de Software
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Logo;

/* ─────────────────────────────────────────
   SHOWCASE — Área de testes visuais da Logo
───────────────────────────────────────── */
export function Showcase() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* LIGHT THEME SHOWCASE */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-10 sm:gap-14 px-6 sm:px-10 py-12 sm:py-16"
        style={{ background: 'linear-gradient(150deg, #eef2ff 0%, #ecfeff 100%)' }}
      >
        <p className="text-[10px] sm:text-xs font-black tracking-[0.35em] uppercase text-indigo-500">
          Tema Claro
        </p>

        <div className="flex flex-col items-start gap-8 sm:gap-10">
          <Logo size="large" />
          <Logo size="medium" />
          <Logo size="small" />
        </div>

        <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center w-full max-w-2xl">
          <Logo size="medium" iconOnly />
          <Logo size="small"  iconOnly />

          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white transition-transform hover:scale-105 cursor-pointer"
            style={{ boxShadow: '0 4px 20px rgba(79, 70, 229, 0.15)' }}
          >
            <Logo size="small" iconOnly />
            <span className="text-indigo-600 font-extrabold text-[14px] tracking-tight">
              Syntax
            </span>
          </div>

          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl cursor-pointer shadow-[0_8px_20px_rgba(6,182,212,0.3)]"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            }}
          >
            <Logo size="small" iconOnly />
            <span className="text-white font-bold text-[14px]">
              Acessar IDE
            </span>
          </motion.div>
        </div>
      </div>

      {/* DARK THEME SHOWCASE */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-10 sm:gap-14 px-6 sm:px-10 py-12 sm:py-16"
        style={{ background: 'linear-gradient(150deg, #0f172a 0%, #1e1b4b 100%)' }}
      >
        <p className="text-[10px] sm:text-xs font-black tracking-[0.35em] uppercase text-cyan-400">
          Tema Escuro
        </p>

        <div className="flex flex-col items-start gap-8 sm:gap-10">
          <Logo size="large" />
          <Logo size="medium" />
          <Logo size="small" />
        </div>

        <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center w-full max-w-2xl">
          <Logo size="medium" iconOnly />
          <Logo size="small"  iconOnly />

          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-transform hover:scale-105 cursor-pointer"
            style={{ 
              background: 'rgba(6, 182, 212, 0.1)', 
              border: '1px solid rgba(6, 182, 212, 0.3)' 
            }}
          >
            <Logo size="small" iconOnly />
            <span className="text-cyan-400 font-extrabold text-[14px] tracking-tight">
              Syntax
            </span>
          </div>

          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl cursor-pointer shadow-[0_8px_24px_rgba(79,70,229,0.3)]"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            }}
          >
            <Logo size="small" iconOnly />
            <span className="text-white font-bold text-[14px]">
              Deploy App
            </span>
          </motion.div>
        </div>
      </div>

    </div>
  );
}