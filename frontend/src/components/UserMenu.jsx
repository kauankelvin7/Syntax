/**
 * 👤 USER MENU PREMIUM — Dropdown de Perfil e Sistema v2.0
 * Theme: Syntax (Software Engineering)
 * Dropdown flutuante com Glassmorphism, controle de tema deslizante
 * e feedback visual de status focado em devs.
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
  LogOut,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { Z } from '../constants/zIndex';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';

/* ── Divider Refinado ── */
const Divider = () => (
  <div className="my-1 h-px bg-slate-100 dark:bg-slate-700/50 mx-2" />
);

/* ── Segmented Theme Control (Deslizante) ── */
const ThemeSegmented = memo(() => {
  const { mode, setMode } = useTheme();

  const options = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'system', icon: Monitor, label: 'Auto' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
  ];

  return (
    <div className="px-3 py-2">
      <div className="relative flex items-center p-1 rounded-[14px] bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
        {options.map((opt) => {
          const active = mode === opt.value;
          return (
            <button
              key={opt.value}
              onClick={(e) => { e.stopPropagation(); setMode(opt.value); }}
              className={`
                relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-[11px] font-bold transition-all duration-300 z-10
                ${active ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
              `}
            >
              {active && (
                <motion.div
                  layoutId="menuThemeActive"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[10px] shadow-sm border border-slate-200/50 dark:border-slate-700"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <opt.icon size={14} strokeWidth={2.5} className="relative z-20" />
              <span className="relative z-20">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

/* ── Menu Item Premium ── */
const MenuItem = memo(({ icon: Icon, label, onClick, danger, badge }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13px] font-bold transition-all duration-200
      ${danger
        ? 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400'
        : 'text-slate-600 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-cyan-400'
      }
    `}
  >
    <div className={`shrink-0 p-1.5 rounded-[10px] transition-colors ${danger ? 'bg-rose-100/50 dark:bg-rose-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
      <Icon size={16} strokeWidth={2.5} />
    </div>
    <span className="flex-1 text-left">{label}</span>
    {badge > 0 && (
      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
        {badge}
      </span>
    )}
  </button>
));

/* ── Componente Principal ── */
const UserMenu = ({ onOpenProfile, className = '', collapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  // Fecha o dropdown automaticamente ao colapsar a sidebar
  useEffect(() => {
    if (collapsed) setOpen(false);
  }, [collapsed]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`relative ${className}`}>

      {/* Trigger Button — desabilitado quando collapsed */}
      <button
        ref={triggerRef}
        onClick={() => !collapsed && setOpen((v) => !v)}
        className={`
          w-full transition-all duration-300 group border rounded-[16px]
          ${open && !collapsed
            ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200/50 dark:border-indigo-800/50 shadow-sm'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
          }
          ${collapsed
            ? 'flex justify-center items-center py-2.5 px-0 cursor-default pointer-events-none'
            : 'p-2.5 text-left'
          }
        `}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center mx-auto translate-x-[-3px]' : 'w-full justify-start gap-3'}`}>

          {/* Avatar */}
          <div className={`relative shrink-0 flex justify-center items-center transition-all duration-300 ${collapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="object-cover border-2 border-indigo-200 dark:border-indigo-800 shadow-sm transition-transform group-hover:scale-105 rounded-[12px] w-full h-full"
              />
            ) : (
              <div className={`bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-md transition-transform group-hover:scale-105 rounded-[12px] w-full h-full ${collapsed ? 'text-xs' : 'text-sm'}`}>
                {initial}
              </div>
            )}
            <span className={`absolute rounded-full bg-emerald-500 border-[2px] border-white dark:border-[#0B1120] shadow-sm animate-pulse ${collapsed ? '-bottom-0.5 -right-0.5 w-2.5 h-2.5' : '-bottom-1 -right-1 w-3.5 h-3.5'}`} />
          </div>

          {/* Nome e seta — ocultos quando collapsed */}
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-extrabold text-slate-800 dark:text-slate-100 truncate tracking-tight">
                  {user?.displayName || 'Developer'}
                </p>
              </div>
              <ChevronUp
                size={16}
                className={`text-slate-300 dark:text-slate-600 transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
                strokeWidth={3}
              />
            </>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && !collapsed && (
          <div ref={menuRef}>
            <motion.div
              className={`absolute bottom-full mb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden ${collapsed ? 'left-0 w-64' : 'left-0 right-0'}`}
              style={{ zIndex: Z.modal - 10 }}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            >
              {/* User Info Header */}
              <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={12} className="text-cyan-500" fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Session Active</span>
                </div>
                <p className="text-[15px] font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
                  {user?.displayName || 'Dev User'}
                </p>
                <p className="text-[12px] font-medium text-slate-500 truncate mt-0.5">
                  {user?.email}
                </p>
              </div>

              <div className="p-2 space-y-0.5">
                <MenuItem icon={User} label="Meu Perfil" onClick={() => { setOpen(false); onOpenProfile(); }} />
                <MenuItem icon={Settings} label="Configurações" onClick={() => { setOpen(false); navigate('/configuracoes'); }} />
                <MenuItem icon={Bell} label="Notificações" onClick={() => { setOpen(false); navigate('/notificacoes'); }} />
              </div>

              <Divider />

              <div className="px-5 pt-3 pb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interface</span>
              </div>
              <ThemeSegmented />

              <Divider />

              <div className="p-2">
                <MenuItem icon={LogOut} label="Encerrar Sessão" danger onClick={() => { setOpen(false); logout(); }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(UserMenu);