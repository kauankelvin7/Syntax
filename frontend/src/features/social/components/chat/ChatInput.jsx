/**
 * 🔲 SECTION CARD
 * * O wrapper padrão para blocos de conteúdo no sistema.
 * - Estilo: IDE / Clean Tech Dashboard
 * - Features: Hover effects dinâmicos e suporte a ações no header.
 */

import React from 'react';
import { motion } from 'framer-motion';

const SectionCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  actions, 
  className = '',
  noPadding = false 
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl 
        rounded-[24px] border border-slate-200/60 dark:border-slate-800/80 
        shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 
        transition-all duration-500 overflow-hidden
        ${className}
      `}
    >
      {/* 🔹 Barra Decorativa Superior (Code Style) */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-cyan-500/40 transition-all duration-700" />
      
      {/* 🔹 Indicador Lateral (Active Line) */}
      <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-r-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500 dark:group-hover:bg-cyan-500 transition-colors duration-500" />

      {/* ─── Header ─── */}
      {(title || Icon) && (
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                <Icon size={20} strokeWidth={2.5} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* ─── Content ─── */}
      <div className={`${noPadding ? 'p-0' : 'p-6 sm:p-8'}`}>
        {children}
      </div>
    </motion.section>
  );
};

export default SectionCard;