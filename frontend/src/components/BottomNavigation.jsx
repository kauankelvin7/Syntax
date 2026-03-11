/**
 * @file BottomNavigation.jsx
 * @description Bottom tab bar — 4 itens fixos + Bottom Sheet para "Mais".
 * Theme: Syntax (Software Engineering / Tech Premium)
 * Desktop: oculto (sidebar lateral cuida da navegação).
 *
 * Layout: Overview | Módulos | Perfil | Mais
 * "Mais" desliza um bottom sheet com grid 3 colunas.
 */
import React, { memo, useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home, BookOpen, Layers, CreditCard, PenLine,
  ClipboardList, Cpu, Network, MoreHorizontal, X,
  Trophy, BarChart3, History, MessageSquareCode, Settings,
  Terminal, FileCode2, Code2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useSocial } from '../features/social/context/SocialContext';
import ProfileModal from './ProfileModal';

/* ── Avatar (Tech Style) ────────────────────────────────────── */
const NavAvatar = memo(({ user }) => {
  const [imgError, setImgError] = useState(false);
  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  
  if (user?.photoURL && !imgError) {
    return (
      <div className="p-[2px] rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400">
        <img
          src={user.photoURL}
          alt="avatar"
          onError={() => setImgError(true)}
          className="w-6 h-6 rounded-full object-cover border-[1.5px] border-white dark:border-slate-900"
        />
      </div>
    );
  }
  
  return (
    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white font-bold text-[11px] shadow-sm border-[1.5px] border-white dark:border-slate-900">
      {initial}
    </span>
  );
});
NavAvatar.displayName = 'NavAvatar';

/* ── Itens fixos da tab bar ──────────────────────────────────── */
const MAIN_ITEMS = [
  { path: '/',         icon: Home,     label: 'Overview'  },
  { path: '/materias', icon: BookOpen, label: 'Módulos' },
];

/* ── Itens do Bottom Sheet "Mais" (Tech Adapted) ─────────────── */
const MORE_ITEMS = [
  { path: '/resumos',            icon: FileCode2,       label: 'Docs'       },
  { path: '/flashcards',         icon: CreditCard,      label: 'Cards'      },
  { path: '/simulados',          icon: Terminal,        label: 'Testes'     },
  { key:  'messages',            icon: MessageSquareCode, label: 'Threads', isChatTrigger: true },
  { path: '/consulta-rapida',    icon: Code2,           label: 'Snippets'   },
  { path: '/quadro-branco',      icon: PenLine,         label: 'Quadro'     },
  { path: '/atlas-3d',           icon: Network,         label: 'Arquitetura'},
  { path: '/analytics',          icon: BarChart3,       label: 'Métricas'   },
  { path: '/conquistas',         icon: Trophy,          label: 'Conquistas' },
  { path: '/historico-simulados',icon: History,         label: 'Logs'       },
  { path: '/configuracoes',      icon: Settings,        label: 'Config.'    },
];

/* ── Bottom Sheet ────────────────────────────────────────────── */
const MoreBottomSheet = memo(({ isOpen, onClose, totalUnread, onChatOpen }) => {
  // Fechar com Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Travar scroll do body enquanto o sheet está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Premium */}
          <motion.div
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[70]"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed bottom-0 left-0 right-0 z-[71] rounded-t-[32px] shadow-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
            style={{
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle visual */}
            <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
              <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-5">
              <span className="text-[15px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                Menu de Ações
              </span>
              <button
                onClick={onClose}
                aria-label="Fechar menu"
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X size={18} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            {/* Grid 3 colunas (Tech Style) */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-2" role="list">
              {MORE_ITEMS.map((item) => {
                const badge = item.isChatTrigger && totalUnread > 0 ? Math.min(totalUnread, 9) : 0;

                if (item.isChatTrigger) {
                  return (
                    <button
                      key={item.key}
                      role="listitem"
                      aria-label={badge ? `${item.label}, ${totalUnread} não lidas` : item.label}
                      onClick={() => { onChatOpen(); onClose(); }}
                      className="relative flex flex-col items-center justify-center gap-2 p-3 rounded-[20px] min-h-[80px] transition-all active:scale-95 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-500 dark:text-slate-400"
                    >
                      <div className="relative">
                        <item.icon size={24} strokeWidth={2} aria-hidden="true" />
                        {badge > 0 && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-1.5 -right-2 min-w-[18px] h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm"
                          >
                            {badge === 9 && totalUnread > 9 ? '9+' : badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    role="listitem"
                    aria-label={item.label}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `relative flex flex-col items-center justify-center gap-2 p-3 rounded-[20px] min-h-[80px] transition-all active:scale-95 ${
                        isActive 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 text-slate-500 dark:text-slate-400'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={24}
                          strokeWidth={isActive ? 2.5 : 2}
                          aria-hidden="true"
                        />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-center">
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
MoreBottomSheet.displayName = 'MoreBottomSheet';

/* ── Componente principal ────────────────────────────────────── */
const BottomNavigation = memo(() => {
  const [showMore, setShowMore] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { totalUnread, toggleChat } = useSocial();

  // Detecta se o chat está ativo pela rota
  const chatAtivo = location.pathname.startsWith('/chat');

  const isExtraActive = MORE_ITEMS.some(
    (item) => item.path && location.pathname === item.path,
  );

  const handleCloseMore = useCallback(() => setShowMore(false), []);
  const handleChatOpen  = useCallback(() => toggleChat(), [toggleChat]);

  return (
    <>
      <MoreBottomSheet
        isOpen={showMore}
        onClose={handleCloseMore}
        totalUnread={totalUnread ?? 0}
        onChatOpen={handleChatOpen}
      />

      <nav
        role="navigation"
        aria-label="Navegação principal"
        className="fixed bottom-0 left-0 right-0 z-10 flex items-stretch backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 transition-colors shadow-[0_-4px_24px_rgba(0,0,0,0.02)]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Início + Matérias */}
        {MAIN_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[64px] transition-all duration-200 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative flex items-center justify-center p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap max-[374px]:hidden transition-all ${isActive ? 'scale-105' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Perfil */}
        <button
          onClick={() => setIsProfileOpen(true)}
          aria-label="Abrir perfil"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[64px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 active:scale-95"
        >
          <NavAvatar user={user} />
          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap max-[374px]:hidden">Perfil</span>
        </button>

        {/* Mais */}
        <button
          onClick={() => setShowMore((v) => !v)}
          aria-label={showMore ? 'Fechar menu extra' : 'Abrir menu extra'}
          aria-expanded={showMore}
          aria-haspopup="dialog"
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[64px] transition-all duration-200 active:scale-95 ${
            showMore || isExtraActive
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className={`relative flex items-center justify-center p-1.5 rounded-xl transition-colors ${showMore || isExtraActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
            {showMore ? (
              <X size={22} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <MoreHorizontal size={22} strokeWidth={showMore || isExtraActive ? 2.5 : 2} aria-hidden="true" />
            )}
            
            {/* Badge de mensagens não lidas */}
            {!showMore && (totalUnread ?? 0) > 0 && (
              <span
                aria-label={`${totalUnread} mensagens não lidas`}
                className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none shadow-sm"
              >
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap max-[374px]:hidden transition-all ${showMore || isExtraActive ? 'scale-105' : ''}`}>
            {showMore ? 'Fechar' : 'Menu'}
          </span>
        </button>
      </nav>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;