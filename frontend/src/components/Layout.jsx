/**
 * 💻 Layout Principal — Syntax Theme
 * * Wrapper mestre com alinhamento tático de Widgets e Error Boundary.
 * - Fix: AdaBot agora é o Node primário no topo da pilha de widgets.
 * - Fix: Alinhamento vertical forçado via flex-col items-end.
 * - UI: High-Fidelity Infrastructure.
 */

import React, { useState, useEffect, memo, lazy, Suspense, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import FABStack from './FABStack';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useFocusMode } from '../contexts/FocusModeContext';
import { useSocial } from '../features/social/context/SocialContext';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  TerminalSquare,
  RefreshCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

/* ── Error Boundary: Crash Screen Style ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Runtime_Exception:", error, errorInfo); }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-center p-8">
          <div className="w-20 h-20 rounded-[24px] bg-rose-500/10 flex items-center justify-center mb-6 border-2 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
            <ShieldAlert size={36} className="text-rose-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic">System_Failure</h2>
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

const PomodoroTimer = lazy(() => import('./PomodoroTimer'));
const AdaBot = lazy(() => import('./AdaBot'));
const ChatPanel = lazy(() => import('../features/social/components/chat/ChatPanel'));
const ChallengeRoom = lazy(() => import('../features/social/components/challenges/ChallengeRoom'));

/* ── Mobile Topbar ── */
const MobileTopbar = memo(({ onOpenDrawer }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const initials = (user?.displayName || user?.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between h-16 px-5 backdrop-blur-xl border-b border-white/5 bg-slate-900/80 transition-all">
      <div className="flex items-center gap-4">
        <button onClick={onOpenDrawer} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-slate-300 border border-white/10 active:scale-90 transition-all">
          <Menu size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size="small" iconOnly />
          <span className="font-black text-[18px] tracking-tighter text-white uppercase italic">Syntax</span>
        </div>
      </div>
      <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-indigo-500/30 bg-slate-800 flex items-center justify-center">
        {user?.photoURL && !imgError ? (
          <img src={user.photoURL} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} referrerPolicy="no-referrer" />
        ) : (
          <span className="text-[10px] font-black text-indigo-400">{initials}</span>
        )}
      </div>
    </header>
  );
});

const Layout = memo(({ children }) => {
  const location = useLocation();
  const { focusMode, exitFocusMode } = useFocusMode();
  const { activeChallengeId, endChallenge } = useSocial();
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const saved = localStorage.getItem('sidebarVisible');
    return isDesktop ? (saved !== null ? JSON.parse(saved) : true) : false;
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleResize = useCallback(() => {
    const desktop = window.innerWidth >= 768;
    setIsDesktop(desktop);
    if (!desktop) setSidebarVisible(false);
    else setMobileDrawerOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (isDesktop) localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible));
  }, [sidebarVisible, isDesktop]);

  const toggleSidebar = useCallback(() => setSidebarVisible(p => !p), []);

  useEffect(() => { if (mobileDrawerOpen) setMobileDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
      if (e.key === 'Escape' && focusMode) exitFocusMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, focusMode, exitFocusMode]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
        
        {/* Mobile Navigation */}
        {!isDesktop && !focusMode && (
          <>
            <MobileTopbar onOpenDrawer={() => setMobileDrawerOpen(true)} />
            <AnimatePresence>
              {mobileDrawerOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[70]"
                    onClick={() => setMobileDrawerOpen(false)}
                  />
                  <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed left-0 top-0 bottom-0 z-[80] w-[280px] border-r border-white/5 shadow-2xl"
                  >
                    <Sidebar />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Desktop Sidebar + Toggle Handle */}
        {isDesktop && !focusMode && (
          <>
            <button
              onClick={toggleSidebar}
              className={`fixed z-[55] w-6 h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-r-xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all top-1/2 -translate-y-1/2 group ${sidebarVisible ? 'left-[264px]' : 'left-0'}`}
            >
              {sidebarVisible ? <ChevronLeft size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
            </button>
            <AnimatePresence mode="wait">
              {sidebarVisible && (
                <motion.div initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="fixed left-0 top-0 bottom-0 z-50 w-[264px] border-r border-white/5 shadow-2xl"
                >
                  <Sidebar />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main Content Viewport */}
        <main 
          id="main-content"
          className={`flex-1 transition-all duration-500 ease-in-out ${!isDesktop && !focusMode ? 'mt-16 mb-20' : ''} ${isDesktop && sidebarVisible && !focusMode ? 'ml-[264px]' : 'ml-0'}`}
        >
          <div className={isDesktop ? 'p-10' : 'p-4'}>
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-full">
              {children}
            </motion.div>
          </div>
        </main>

        {/* Floating Widgets — REORDERED & ALIGNED */}
        {!focusMode && (
          <Suspense fallback={null}>
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
              <FABStack>
                {/* AdaBot agora no topo da pilha, seguido por Timer e Chat */}
                <AdaBot />
                <PomodoroTimer />
                <ChatPanel showButton={isDesktop} />
              </FABStack>
            </div>
          </Suspense>
        )}

        {!isDesktop && !focusMode && (
          <Suspense fallback={null}>
            <BottomNavigation />
          </Suspense>
        )}

        {/* Focus Mode Tool */}
        <AnimatePresence>
          {focusMode && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              onClick={exitFocusMode}
              className="fixed top-8 right-8 z-[110] flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-widest text-[11px] shadow-2xl border-2 border-indigo-500/20 hover:scale-105 transition-all"
            >
              <X size={16} strokeWidth={4} /> Exit_Focus (Esc)
            </motion.button>
          )}
        </AnimatePresence>

        {/* Global Challenge Service */}
        {activeChallengeId && (
          <Suspense fallback={null}>
            <ChallengeRoom challengeId={activeChallengeId} currentUserId={user?.uid} onClose={endChallenge} />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
});

Layout.displayName = 'Layout';
export default Layout;