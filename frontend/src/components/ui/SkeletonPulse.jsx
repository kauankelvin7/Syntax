/**
 * 🦴 SKELETON PULSE
 * * Placeholder de carregamento premium estilo IDE/Dashboard.
 * * Usado para simular blocos de código ou cards enquanto os dados compilam.
 */

import React from 'react';

const SkeletonPulse = ({ className = '', style = {} }) => (
  <div 
    className={`
      animate-pulse rounded-[14px] 
      bg-gradient-to-r from-slate-200/60 via-slate-200 to-slate-200/60 
      dark:from-slate-800/80 dark:via-slate-700/40 dark:to-slate-800/80 
      ${className}
    `}
    style={style}
  />
);

export default SkeletonPulse;