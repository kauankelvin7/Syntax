/**
 * 💻 Layout Principal — Syntax Theme
 * Wrapper mestre com alinhamento tático de Widgets e Error Boundary.
 *
 * @zindex
 *   Z.raised    (10) — sidebar desktop
 *   Z.sidebar   (20) — sidebar mobile overlay
 *   Z.navbar    (30) — navbar fixa
 *   Z.pomodoro  (40) — widgets flutuantes
 *   Z.modal     (50) — modais
 *   Z.onboarding(80) — focus mode button
 */

import React, { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import FABStack from './FABStack';
import { Z } from '../constants/zIndex';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useFocusMode } from '../contexts/FocusModeContext';
import { useSocial } from '../features/social/context/SocialContext';
import {
  Menu,
  X,
  ChevronLeft,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

/* ─────────────────────────────────────────
   ERROR BOUNDARY
───────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Syntax:Layout] Runtime_Exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-center p-8">
          <div className="w-20 h-20 rounded-[24px] bg-rose-500/10 flex items-center justify-center mb-6 border-2 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
            <ShieldAlert size={36} className="text-rose-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic">
            System_Failure
          </h2>
          <p className="text-slate-500 text-[14px] font-medium mb-8 max-w-sm mx-auto font-mono">
            Ocorreu uma exceção crítica no kernel da interface.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[12px] shadow-2xl transition-all active:scale-95"
          >
            <RefreshCw size={18} strokeWidth={3} /> Reboot_System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────
   LAZY COMPONENTS
───────────────────────────────────────── */
const PomodoroTimer = lazy(() => import('./PomodoroTimer'));
const AdaBot        = lazy(() => import('./AdaBot'));
const ChatPanel     = lazy(() => import('../features/social/components/chat/ChatPanel'));
const ChallengeRoom = lazy(() => import('../features/social/components/challenges/ChallengeRoom'));

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
const Navbar = memo(({ onOpenDrawer, isDesktop, sidebarVisible, toggleSidebar }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const initials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      style={{ zIndex: Z.navbar }}
      className="fixed top-0 left-0 right-0 flex items-center justify-between backdrop-blur-2xl bg-[#0B1120]/85 border-b border-slate-800/80 transition-all duration-300 h-16 px-4 md:px-6 shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
    >
      {/* ── Esquerda ── */}
      <div className="flex items-center gap-4 sm:gap-6 h-full">
        <div className="flex items-center gap-3">
          {!isDesktop ? (
            <button
              onClick={onOpenDrawer}
              aria-label="Abrir menu"
              className="group relative w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-all shadow-sm"
            >
              <Menu size={20} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? 'Colapsar menu' : 'Expandir menu'}
              className="group relative w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-all shadow-sm"
            >
              {sidebarVisible ? (
                <ChevronLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
              ) : (
                <Menu size={20} strokeWidth={2.5} className="group-active:scale-90 transition-transform" />
              )}
            </button>
          )}

          {/* Logo + Nome */}
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
            <div className="relative flex items-center justify-center">
              <Logo size="small" iconOnly />
              <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full" />
            </div>
            <span className="font-black text-[17px] sm:text-[18px] tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase italic">
              Syntax
            </span>
          </div>
        </div>

        {isDesktop && <div className="hidden md:block w-px h-6 bg-slate-800" />}

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1.5 ml-2 translate-y-[2px]">
          {[
            { to: '/',         label: 'Overview',  end: true },
            { to: '/materias', label: 'Módulos' },
            { to: '/resumos',  label: 'Docs',      desktop: true },
            { to: '/simulado', label: 'Simulados', desktop: true },
          ].map(({ to, label, end, desktop }) =>
            desktop && !isDesktop ? null : (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center justify-center px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isActive
                      ? 'text-cyan-400 bg-cyan-500/10 shadow-[inset_0_1px_0_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                {label}
              </NavLink>
            )
          )}
        </nav>
      </div>

      {/* ── Direita ── */}
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Indicador online */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-[1px]">
            Online
          </span>
        </div>

        {/* Perfil */}
        <div className="flex items-center gap-3 sm:pl-5 sm:border-l border-slate-800/80">
          <div className="hidden sm:flex flex-col items-end justify-center">
            <span className="text-[12px] font-extrabold text-slate-200 uppercase tracking-tight leading-none mb-1">
              {user?.displayName?.split(' ')[0] || 'Developer'}
            </span>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none">
              Active_Session
            </span>
          </div>

          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-indigo-500/30 rounded-xl blur-md group-hover:bg-cyan-500/40 transition-colors duration-300" />
            <div
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shadow-xl"
              style={{ zIndex: Z.base + 1 }}
            >
              {user?.photoURL && !imgError ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-[11px] font-black text-indigo-400 group-hover:text-cyan-400 transition-colors">
                  {initials}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';

/* ─────────────────────────────────────────
   LAYOUT PRINCIPAL
───────────────────────────────────────── */
const Layout = memo(({ children }) => {
  const location = useLocation();
  const { focusMode, exitFocusMode } = useFocusMode();
  const { activeChallengeId, endChallenge } = useSocial();
  const { user } = useAuth();

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (window.innerWidth < 768) return false;
    const saved = localStorage.getItem('sidebarVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  /* Resize */
  const handleResize = useCallback(() => {
    const desktop = window.innerWidth >= 768;
    setIsDesktop(desktop);
    if (!desktop) {
      setSidebarVisible(false);
      setMobileDrawerOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  /* Persistir estado da sidebar no desktop */
  useEffect(() => {
    if (isDesktop) localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible));
  }, [sidebarVisible, isDesktop]);

  const toggleSidebar = useCallback(() => setSidebarVisible((p) => !p), []);

  /* Fechar drawer mobile ao navegar */
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  /* Atalhos de teclado */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'Escape' && focusMode) exitFocusMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, focusMode, exitFocusMode]);

  const navbarTopOffset = window.innerWidth >= 1024 ? 64 : 60;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">

        {/* ── Navbar ── */}
        {!focusMode && (
          <Navbar
            onOpenDrawer={() => setMobileDrawerOpen(true)}
            isDesktop={isDesktop}
            sidebarVisible={sidebarVisible}
            toggleSidebar={toggleSidebar}
          />
        )}

        {/* ── Sidebar Mobile (overlay) ── */}
        {!isDesktop && !focusMode && (
          <AnimatePresence>
            {mobileDrawerOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="mobile-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ zIndex: Z.sidebar - 1 }}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
                  onClick={() => setMobileDrawerOpen(false)}
                />

                {/* Sidebar panel */}
                <motion.div
                  key="mobile-sidebar"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  style={{ zIndex: Z.sidebar, top: 0, bottom: 0 }}
                  className="fixed left-0 w-[280px] border-r border-white/5 shadow-2xl overflow-hidden"
                >
                  <Sidebar isMobileOpen={mobileDrawerOpen} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}

        {/* ── Sidebar Desktop ── */}
        {isDesktop && !focusMode && (
          <motion.div
            initial={false}
            animate={{ width: sidebarVisible ? 240 : 64 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ zIndex: Z.raised, top: navbarTopOffset }}
            className="fixed left-0 bottom-0 border-r border-white/5 shadow-2xl bg-slate-900 overflow-hidden"
          >
            <Sidebar collapsed={!sidebarVisible} isMobileOpen={false} />
          </motion.div>
        )}

        {/* ── Conteúdo Principal ── */}
        <main
          id="main-content"
          className={`flex-1 transition-all duration-500 ease-in-out
            ${!focusMode ? 'pt-14 md:pt-[60px] lg:pt-16' : ''}
            ${!isDesktop && !focusMode ? 'pb-20' : ''}
            ${isDesktop && !focusMode
              ? sidebarVisible ? 'ml-[240px]' : 'ml-[64px]'
              : 'ml-0'
            }
          `}
        >
          <div className={isDesktop ? 'p-6 lg:p-10' : 'p-4'}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* ── Widgets Flutuantes ── */}
        {!focusMode && (
          <Suspense fallback={null}>
            <div
              style={{ zIndex: Z.pomodoro }}
              className="fixed bottom-8 right-8 flex flex-col items-end gap-4"
            >
              <FABStack>
                <AdaBot />
                <PomodoroTimer />
                <ChatPanel showButton={isDesktop} />
              </FABStack>
            </div>
          </Suspense>
        )}

        {/* ── Bottom Navigation (Mobile) ──
            Oculta quando o drawer está aberto para evitar sobreposição de barras.
            Usa AnimatePresence para transição suave ao abrir/fechar o drawer.     */}
        {!isDesktop && !focusMode && (
          <AnimatePresence>
            {!mobileDrawerOpen && (
              <motion.div
                key="bottom-nav"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
              >
                <Suspense fallback={null}>
                  <BottomNavigation />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── Focus Mode Exit Button ── */}
        <AnimatePresence>
          {focusMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={exitFocusMode}
              style={{ zIndex: Z.onboarding + 10 }}
              className="fixed top-8 right-8 flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest text-[11px] shadow-2xl border-2 border-indigo-500/20 hover:scale-105 transition-all"
            >
              <X size={16} strokeWidth={4} /> Exit_Focus (Esc)
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Challenge Room ── */}
        {activeChallengeId && (
          <Suspense fallback={null}>
            <ChallengeRoom
              challengeId={activeChallengeId}
              currentUserId={user?.uid}
              onClose={endChallenge}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
});

Layout.displayName = 'Layout';
export default Layout;