/**
 * 🖼️ OPTIMIZED IMAGES
 * * Componentes otimizados para evitar Layout Shift (CLS) e economizar banda.
 * * Efeito Blur-in suave (estilo Medium/Vercel) para carregamento de alta fidelidade.
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const OptimizedImage = memo(({
  src,
  alt = '',
  className = '',
  width,
  height,
  // Pixel transparente em base64 permite que o background do container (Dark/Light) dite a cor inicial
  placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  fallback = 'https://via.placeholder.com/400x300/1e293b/475569?text=Missing+Asset',
  eager = false,
  onLoad,
  onError,
  style = {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(eager);
  const imgRef = useRef(null);

  useEffect(() => {
    if (eager || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.01 } // Margem generosa para pré-carregamento suave
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/80 ${className}`}
      style={{
        width: width || '100%',
        aspectRatio: width && height ? `${width}/${height}` : 'auto',
        ...style
      }}
    >
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800/80"
          >
            {/* Skeleton Pulse Refinado */}
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-transparent via-slate-200/60 dark:via-slate-700/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <img
        src={hasError ? fallback : (isInView ? src : placeholder)}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => {
          setIsLoaded(true);
          if (onLoad) onLoad();
        }}
        onError={() => {
          setHasError(true);
          if (onError) onError();
        }}
        className={`
          w-full h-full object-cover transition-all duration-700 ease-out
          ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'}
        `}
        style={{ willChange: 'transform, opacity, filter' }}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * 👤 AVATAR IMAGE PREMIUM - Syntax Theme
 * Fallback tech elegante com gradiente e iniciais
 */
export const AvatarImage = memo(({ src, name = '', size = 40, className = '', ...props }) => {
  const [hasError, setHasError] = useState(false);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white font-black shadow-inner border-[1.5px] border-white/20 dark:border-slate-800 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        {...props}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={`rounded-full object-cover border-[1.5px] border-white dark:border-slate-800 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      {...props}
    />
  );
});

AvatarImage.displayName = 'AvatarImage';

export default OptimizedImage;