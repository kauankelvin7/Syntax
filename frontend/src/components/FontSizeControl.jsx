/**
 * 🔍 FontSizeControl Component - Acessibilidade a11y Premium
 * Theme: Syntax (Software Engineering)
 * * Controle visual de tamanho de fonte integrado ao Design System
 * Design premium com animações de deslizamento e feedback visual progressivo
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Type, Sparkles } from 'lucide-react';
import { useFontSize } from '../utils/useFontSize';

const FontSizeControl = ({ variant = 'default' }) => {
  const { fontSize, increaseFontSize, decreaseFontSize, setSpecificSize, isMinSize, isMaxSize } = useFontSize();

  // Variante compacta para mobile ou toolbars
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl px-2 py-1.5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
        <div className="p-1.5 text-slate-400">
          <Type size={14} strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={decreaseFontSize}
            disabled={isMinSize}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 font-bold text-xs"
            aria-label="Diminuir fonte"
          >
            A-
          </button>
          <button
            onClick={() => setSpecificSize('normal')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all font-bold text-sm ${
              fontSize === 'normal' 
                ? 'bg-cyan-500 text-white shadow-sm' 
                : 'hover:bg-white dark:hover:bg-slate-800 text-slate-500'
            }`}
          >
            A
          </button>
          <button
            onClick={increaseFontSize}
            disabled={isMaxSize}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 font-bold text-base"
            aria-label="Aumentar fonte"
          >
            A+
          </button>
        </div>
      </div>
    );
  }

  // Variante Padrão (Usada em Configurações)
  const options = [
    { key: 'normal', label: 'Normal', sizeCls: 'text-[13px]' },
    { key: 'grande', label: 'Grande', sizeCls: 'text-[16px]' },
    { key: 'extraGrande', label: 'Extra', sizeCls: 'text-[20px]' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center shadow-inner">
            <Type size={20} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white tracking-tight">Tamanho da Fonte</h3>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              {fontSize === 'normal' && '16px Default'}
              {fontSize === 'grande' && '18px Legible'}
              {fontSize === 'extraGrande' && '20px Accessible'}
            </p>
          </div>
        </div>
        
        {/* Badge Tech Style */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/50 shadow-sm">
          <Sparkles size={12} className="text-cyan-500 dark:text-cyan-400" />
          <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">Acessibilidade</span>
        </div>
      </div>

      <div className="relative flex p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-[20px] border border-slate-200/60 dark:border-slate-800 shadow-inner">
        {options.map((opt) => {
          const active = fontSize === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setSpecificSize(opt.key)}
              className={`relative flex-1 flex flex-col items-center justify-center py-3.5 rounded-[16px] transition-all duration-300 z-10 ${
                active ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {active && (
                <motion.div 
                  layoutId="activeFontSize"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-200/50 dark:border-slate-700"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`font-black relative z-20 ${opt.sizeCls}`}>A</span>
              <span className="text-[10px] font-bold uppercase tracking-widest relative z-20 mt-1">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center text-[12px] font-medium text-slate-400 dark:text-slate-500 italic">
        "O conforto visual diminui a fadiga ocular durante longas sessões de debug e estudo de código."
      </p>
    </div>
  );
};

export default FontSizeControl;