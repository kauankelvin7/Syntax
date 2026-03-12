/**
 * 🏷️ BADGE 
 * * Tags semânticas com suporte a ícones, pontos indicadores,
 * cores dinâmicas e tipografia refinada para máxima legibilidade.
 * * Design atualizado para o estilo GitHub Labels / IDE Tags.
 */

import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  color = null, // Aceita HEX customizado
  size = 'md',
  dot = false,
  icon: Icon = null, // Suporte a ícones do Lucide
  mono = false, // Nova prop para estilo "código"
  className = '',
  ...props
}) => {
  // Variantes semânticas com bordas translúcidas e Glassmorphism
  const variants = {
    default: 'bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
    info: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
    accent: 'bg-cyan-50 text-cyan-700 border-cyan-200/60 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50', // Cyan para o Syntax Theme
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    accent: 'bg-cyan-500',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-[10px] gap-1.5',
    lg: 'px-3 py-1.5 text-[12px] gap-2',
  };

  // Lógica de cor customizada vinda do banco (ex: cor da matéria)
  const customStyle = color ? {
    backgroundColor: `${color}15`, // 15% de opacidade
    color: color,
    borderColor: `${color}30`, // 30% de opacidade na borda
  } : {};

  return (
    <span
      className={`
        inline-flex items-center 
        rounded-[8px] border shadow-sm backdrop-blur-sm
        transition-all duration-200
        ${mono ? 'font-mono lowercase tracking-normal font-bold' : 'font-black uppercase tracking-widest'}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      style={customStyle}
      {...props}
    >
      {/* Ponto indicador (LED Status) */}
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-sm ${dotColors[variant] || 'bg-slate-400'}`} 
          style={color ? { backgroundColor: color, boxShadow: `0 0 6px ${color}80` } : {}}
        />
      )}

      {/* Ícone opcional */}
      {Icon && <Icon size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} strokeWidth={2.5} />}

      <span className="leading-none mt-[1px]">{children}</span>
    </span>
  );
};

export default Badge;