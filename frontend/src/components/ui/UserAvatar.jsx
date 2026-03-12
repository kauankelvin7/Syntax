/**
 * 👤 USER AVATAR
 * * Componente de identidade visual com fallback determinístico.
 * - Suporte a indicador de status online (pulsante)
 * - Gradientes Tech refinados (Dev Style)
 * - Prevenção contra Tracking Prevention (Safari/Edge)
 */

import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[14px]',
  lg: 'w-14 h-14 text-[18px]',
  xl: 'w-20 h-20 text-[24px]',
  xxl: 'w-24 h-24 text-[28px]', // Útil para páginas de perfil
};

// Gradientes baseados nas cores de frameworks e ferramentas Dev
const GRADIENTS = [
  'from-indigo-600 to-cyan-500',   // Syntax Brand
  'from-violet-600 to-fuchsia-500', // API / GraphQL vibe
  'from-emerald-500 to-teal-400',   // Vue / Supabase vibe
  'from-rose-500 to-orange-500',    // Rust / Swift vibe
  'from-blue-600 to-indigo-500',    // React / TS vibe
  'from-amber-500 to-yellow-400',   // JS / Python vibe
];

const UserAvatar = memo(({ 
  photoURL, 
  displayName, 
  size = 'md', 
  isOnline = false, 
  className = '', 
  style 
}) => {
  const [imgError, setImgError] = useState(false);

  const initial = displayName?.[0]?.toUpperCase() ?? 'U';
  const sizeClass = SIZES[size] || SIZES.md;

  // Gradiente determinístico: Garante que o mesmo nome tenha sempre a mesma cor
  const gradientIndex = (displayName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) ?? 0) % GRADIENTS.length;
  const gradient = GRADIENTS[gradientIndex];

  return (
    <div className={`relative shrink-0 ${className}`} style={style}>
      <AnimatePresence mode="wait">
        {photoURL && !imgError ? (
          <motion.img
            key="photo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            src={photoURL}
            alt={displayName || 'Avatar do Dev'}
            className={`${sizeClass} rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm`}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white shadow-inner border-2 border-white dark:border-slate-900`}
            aria-label={displayName || 'Avatar do Dev'}
          >
            {initial}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de Status Online */}
      {isOnline && (
        <div className="absolute bottom-0 right-0 transform translate-x-[10%] translate-y-[10%]">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm"></span>
          </span>
        </div>
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;