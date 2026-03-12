/**
 * 🔔 NOTIFICATION BADGE PREMIUM — Syntax Theme
 * * Contador de eventos pendentes (Incoming Data Stack).
 * - Design: Squircle Geometry (Estilo tag de código)
 * - Cores: Cyan Neon Glow para sinalização tática
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationBadge = memo(({ count, size = 'md', className = '', pulse = true }) => {
  // Geometria tática estilo Syntax
  const sizeClasses = size === 'sm'
    ? 'min-w-[14px] h-[14px] text-[8px] rounded-[4px]'
    : 'min-w-[18px] h-[18px] text-[10px] rounded-[6px]';

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute z-50 pointer-events-none"
          style={{ top: '-4px', right: '-4px' }}
        >
          {/* Efeito de Pulso (Glow) */}
          {pulse && (
            <span className={`absolute inset-0 ${sizeClasses} bg-cyan-400 animate-ping opacity-40`} />
          )}

          <span
            className={`
              relative flex items-center justify-center
              ${sizeClasses} px-1.5
              font-black text-white
              bg-gradient-to-br from-cyan-500 to-indigo-600
              shadow-[0_2px_10px_rgba(6,182,212,0.5)]
              border border-white/20
              tracking-tighter
              ${className}
            `}
          >
            {count > 99 ? '99' : count}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

NotificationBadge.displayName = 'NotificationBadge';
export default NotificationBadge;