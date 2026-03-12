/**
 * ✏️ TYPING INDICATOR PREMIUM - Syntax Theme
 * * Animação orgânica de feedback de streaming de dados.
 * - Efeito: Status de processamento de terminal (Data Ingest)
 * - Design: Consistente com blocos de código Syntax
 * - Suporte a múltiplos usuários (Sessões simultâneas)
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = memo(({ typingUsers }) => {
  if (!typingUsers?.length) return null;

  // Extração inteligente de nomes para logs limpos
  const names = typingUsers
    .map((t) => t.userName || 'Dev')
    .map((name) => name.split(' ')[0])
    .join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex items-start gap-2 mb-4 mt-2 px-1"
    >
      <div className="flex items-center gap-3.5 px-4 py-3 rounded-[18px] rounded-bl-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Animação de Pontos Tech (Neon Cyan) */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15 
              }}
            />
          ))}
        </div>

        {/* Texto de Status Estilo Log */}
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          <span className="text-cyan-600 dark:text-cyan-500">{names}</span> 
          <span className="ml-1 opacity-70">Typing_Stream...</span>
        </span>
      </div>
    </motion.div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
export default TypingIndicator;