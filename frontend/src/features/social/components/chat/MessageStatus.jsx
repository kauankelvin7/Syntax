/**
 * ✅ MESSAGE STATUS PREMIUM - Syntax Theme
 * * Indicador visual de ciclo de vida da mensagem (Commit Status).
 * - Suporte a transições suaves (Push -> Delivered -> Merged/Read)
 * - Otimizado para legibilidade em bolhas Syntax Indigo
 * - Micro-animações de feedback tátil
 */

import React, { memo, useMemo } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageStatus = memo(({ status, readBy, senderId }) => {
  
  const computedStatus = useMemo(() => {
    if (readBy && senderId) {
      const otherReaders = Object.keys(readBy).filter((uid) => uid !== senderId);
      if (otherReaders.length > 0) return 'read';
    }
    return status || 'sent';
  }, [status, readBy, senderId]);

  return (
    <div className="flex items-center justify-center shrink-0 ml-1.5 min-w-[14px]">
      <AnimatePresence mode="wait">
        {computedStatus === 'read' ? (
          <motion.div
            key="read"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.4)]"
          >
            <CheckCheck size={13} strokeWidth={3.5} aria-label="Lida/Merged" />
          </motion.div>
        ) : computedStatus === 'delivered' ? (
          <motion.div
            key="delivered"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-300/60 dark:text-slate-500/60"
          >
            <CheckCheck size={13} strokeWidth={2.5} aria-label="Entregue/Stored" />
          </motion.div>
        ) : computedStatus === 'sent' ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-300/50 dark:text-slate-500/50"
          >
            <Check size={13} strokeWidth={2.5} aria-label="Enviada/Push" />
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ rotate: { repeat: Infinity, duration: 1, ease: "linear" } }}
            className="w-2.5 h-2.5 border-[1.5px] border-slate-300/40 border-t-cyan-400 rounded-full"
            aria-label="Processando..."
          />
        )}
      </AnimatePresence>
    </div>
  );
});

MessageStatus.displayName = 'MessageStatus';
export default MessageStatus;