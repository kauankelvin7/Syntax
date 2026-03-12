/**
 * 🎨 BUTTON
 * * Variants: primary (gradient tech), secondary (outlined), ghost, danger, glass
 * Features: loading spinner, haptic feedback integration, scale micro-interaction.
 */

import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2.5
    font-bold tracking-tight
    rounded-2xl
    transition-all duration-300 ease-out
    focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    cursor-pointer select-none group
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-indigo-600 to-cyan-500
      text-white border-none
      shadow-[0_8px_20px_rgba(79,70,229,0.25)]
      hover:shadow-[0_12px_28px_rgba(79,70,229,0.35)]
      hover:opacity-95
      focus-visible:ring-indigo-500/50 dark:focus-visible:ring-offset-slate-950
    `,
    secondary: `
      bg-slate-50 dark:bg-slate-800/80
      text-slate-700 dark:text-slate-200
      border-2 border-slate-200/80 dark:border-slate-700/80
      shadow-sm
      hover:bg-white dark:hover:bg-slate-800
      hover:border-indigo-300 dark:hover:border-indigo-500/50
      hover:text-indigo-600 dark:hover:text-indigo-400
      focus-visible:ring-slate-400/50
    `,
    ghost: `
      bg-transparent
      text-slate-500 dark:text-slate-400
      hover:bg-slate-100 dark:hover:bg-slate-800
      hover:text-slate-900 dark:hover:text-slate-100
      focus-visible:ring-slate-400/50
    `,
    danger: `
      bg-gradient-to-br from-rose-500 to-red-600
      text-white border-none
      shadow-[0_8px_20px_rgba(225,29,72,0.25)]
      hover:shadow-[0_12px_28px_rgba(225,29,72,0.35)]
      hover:opacity-95
      focus-visible:ring-rose-500/50
    `,
    glass: `
      bg-white/10 dark:bg-slate-900/40 backdrop-blur-md
      text-slate-700 dark:text-white
      border border-white/20 dark:border-slate-700/50
      shadow-xl
      hover:bg-white/20 dark:hover:bg-slate-800/60
      focus-visible:ring-indigo-500/50
    `,
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-[10px] uppercase tracking-widest',
    sm: 'px-4 py-2.5 text-[13px]',
    md: 'px-6 py-3.5 text-[14px]',
    lg: 'px-8 py-4 text-[16px]',
    xl: 'px-10 py-5 text-[18px]',
  };

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="font-bold">Aguarde...</span>
        </div>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0 opacity-90 transition-transform duration-300 group-hover:scale-110">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="flex-shrink-0 opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-1">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export const ButtonGroup = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[20px] border border-slate-200/80 dark:border-slate-800 shadow-inner ${className}`}>
    {children}
  </div>
);

export const IconButton = ({
  icon,
  variant = 'secondary',
  size = 'md',
  label,
  className = '',
  ...props
}) => {
  const iconPadding = {
    xs: 'p-2',
    sm: 'p-2.5',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <Button
      variant={variant}
      className={`${iconPadding[size]} !rounded-[16px] min-w-0 ${className}`}
      aria-label={label}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;