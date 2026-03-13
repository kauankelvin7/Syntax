/**
 * 🗑️ CONFIRM MODAL
 * * Dialogo de confirmação para ações críticas ou destrutivas.
 * - Glassmorphism backdrop
 * - Focus Trap & Accessibility (A11y)
 * - Estados semânticos (Danger, Warning, Info)
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Info, Sparkles, Loader2 } from 'lucide-react';
import { Z } from '../../constants/zIndex';
import Button from './Button';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Ação',
  itemName = 'este item',
  message = null,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false
}) => {
  const cancelRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Delay sutil para garantir que o modal montou antes do foco
    const timer = setTimeout(() => cancelRef.current?.focus(), 100);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) { onClose(); return; }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, isLoading, onClose]);

  const handleConfirm = () => { if (!isLoading) onConfirm(); };
  const handleBackdropClick = (e) => { if (e.target === e.currentTarget && !isLoading) onClose(); };

  const typeConfig = {
    danger: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50',
      icon: <Trash2 className="text-rose-500" size={28} strokeWidth={2.5} />,
      buttonClass: 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_8px_20px_rgba(225,29,72,0.25)] text-white border-none',
    },
    warning: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50',
      icon: <AlertTriangle className="text-amber-500" size={28} strokeWidth={2.5} />,
      buttonClass: 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_8px_20px_rgba(245,158,11,0.25)] text-white border-none',
    },
    info: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50',
      icon: <Info className="text-indigo-500 dark:text-cyan-400" size={28} strokeWidth={2.5} />,
      buttonClass: 'bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-[0_8px_20px_rgba(79,70,229,0.25)] text-white border-none',
    },
  };

  const config = typeConfig[type] || typeConfig.danger;

  const messageContent = message || (
    <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
      Tem certeza que deseja apagar <span className="font-bold text-slate-900 dark:text-slate-100">"{itemName}"</span>? 
      <br />
      <span className="text-rose-500/80 dark:text-rose-400/90 text-[13px] font-bold mt-1 inline-block">Esta ação não pode ser desfeita.</span>
    </p>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/60 backdrop-blur-md"
          style={{ zIndex: Z.modal }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 dark:border-slate-800"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon Area */}
            <div className="pt-10 pb-6 px-8 text-center">
              <motion.div
                className={`w-20 h-20 ${config.iconBg} rounded-[24px] border-2 flex items-center justify-center mx-auto mb-6 shadow-sm`}
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                {config.icon}
              </motion.div>
              
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                {title}
              </h3>
              
              <div className="px-2">
                {messageContent}
              </div>
            </div>

            {/* Actions Section */}
            <div className="px-8 pb-8 flex flex-col gap-3">
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`h-14 rounded-[16px] font-bold text-[15px] hover:opacity-90 transition-all active:scale-[0.98] ${config.buttonClass}`}
                leftIcon={isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
              >
                {isLoading ? 'Processando...' : confirmText}
              </Button>

              <button
                ref={cancelRef}
                onClick={onClose}
                disabled={isLoading}
                className="h-12 text-[14px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-[12px] transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;