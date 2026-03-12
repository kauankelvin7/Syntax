/**
 * 🟢 ONLINE INDICATOR PREMIUM — Syntax Theme
 * * Indicador de telemetria de rede e estado de atividade.
 * - Design: Hardware LED Style (Neon Glow)
 * - Estados: Online (Emerald), Coding (Cyan), Offline (Slate)
 */

import React, { memo } from 'react';

const OnlineIndicator = memo(({ isOnline, isStudying, size = 'sm', className = '', pulse = true }) => {
  const sizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Cores Neon Tech
  const colors = isStudying
    ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] ring-cyan-500/20'
    : isOnline
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] ring-emerald-500/20'
      : 'bg-slate-400 dark:bg-slate-600 ring-transparent';

  return (
    <div className={`relative flex shrink-0 ${className}`}>
      {/* Link Active Animation (Onda externa) */}
      {(isOnline || isStudying) && pulse && (
        <span className={`
          absolute inset-0 rounded-full animate-ping opacity-40
          ${isStudying ? 'bg-cyan-400' : 'bg-emerald-400'}
        `} />
      )}

      {/* LED Core */}
      <span
        className={`
          relative ${sizes[size] || sizes.sm}
          rounded-full ring-2 ring-white dark:ring-slate-900
          ${colors}
          ${(isOnline || isStudying) ? 'animate-pulse duration-[3000ms]' : ''}
        `}
        title={isStudying ? 'Coding Now' : isOnline ? 'Linked' : 'Disconnected'}
        aria-label={isStudying ? 'Coding Now' : isOnline ? 'Linked' : 'Disconnected'}
      />
    </div>
  );
});

OnlineIndicator.displayName = 'OnlineIndicator';
export default OnlineIndicator;