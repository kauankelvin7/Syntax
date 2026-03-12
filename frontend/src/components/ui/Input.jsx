/**
 * 📝 FORMS
 * * Features: Focus glow dinâmico (Cyan), suporte a ícones, estados de erro semânticos.
 * * Exports: Input, Select, Textarea
 */

import React, { forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fieldBase = `
  w-full
  bg-slate-50 dark:bg-slate-900/50
  border-2 border-slate-200 dark:border-slate-800
  rounded-2xl
  text-[14px] font-bold
  text-slate-900 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  transition-all duration-300 ease-in-out
  focus:border-cyan-400 dark:focus:border-cyan-500
  focus:bg-white dark:focus:bg-slate-900
  focus:ring-4 focus:ring-cyan-500/10 dark:focus:ring-cyan-400/10
  focus:outline-none
  disabled:bg-slate-100 dark:disabled:bg-slate-900/80
  disabled:text-slate-400 dark:disabled:text-slate-600
  disabled:cursor-not-allowed
  shadow-inner
`;

const fieldError = `
  !border-rose-400 dark:!border-rose-500/50 
  !bg-rose-50/50 dark:!bg-rose-950/20 
  focus:!border-rose-500 focus:!ring-rose-500/10
`;

/* ─── Input Component ─── */
export const Input = forwardRef(({ 
  label, 
  error, 
  hint,
  className = '', 
  required = false,
  leftIcon: LeftIcon = null,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ml-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {LeftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors duration-300 pointer-events-none">
            {React.isValidElement(LeftIcon) ? LeftIcon : <LeftIcon size={18} strokeWidth={2.5} />}
          </div>
        )}
        <input
          ref={ref}
          className={`
            ${fieldBase}
            h-14 ${LeftIcon ? 'pl-12' : 'px-4'} pr-4
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-2 ml-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{hint}</p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mt-2 ml-1 text-[12px] font-bold text-rose-500 flex items-center gap-1.5"
          >
            <AlertCircle size={14} strokeWidth={2.5} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

/* ─── Select Component ─── */
export const Select = forwardRef(({ 
  label, 
  error, 
  children, 
  className = '', 
  required = false,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ml-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        <select
          ref={ref}
          className={`
            ${fieldBase}
            h-14 px-4 pr-10
            appearance-none cursor-pointer
            ${error ? fieldError : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
          <ChevronDown size={18} strokeWidth={3} />
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="mt-2 ml-1 text-[12px] font-bold text-rose-500 flex items-center gap-1.5"
          >
            <AlertCircle size={14} strokeWidth={2.5} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Select.displayName = 'Select';

/* ─── Textarea Component ─── */
export const Textarea = forwardRef(({ 
  label, 
  error, 
  hint,
  className = '', 
  required = false,
  rows = 4,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ml-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          ${fieldBase}
          p-4
          resize-y min-h-[100px] custom-scrollbar
          ${error ? fieldError : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p className="mt-2 ml-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{hint}</p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="mt-2 ml-1 text-[12px] font-bold text-rose-500 flex items-center gap-1.5"
          >
            <AlertCircle size={14} strokeWidth={2.5} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      
      {/* Scrollbar style specifically for textareas */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(148, 163, 184, 0.3); 
          border-radius: 10px; 
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.4); 
        }
      `}</style>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;