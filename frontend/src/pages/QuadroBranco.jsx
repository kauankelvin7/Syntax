/**
 * 🎨 SCHEMATIC_BOARD (Quadro Branco) — Syntax Theme v4.0
 * * Whiteboarding tático para arquitetura de sistemas e diagramação.
 * - Engine: tldraw (Fidelidade Máxima).
 * - UI: IDE-Like Controls (Blur-Glass, Neon Selection).
 * - Persistência: IndexedDB com Auto-Migration e Recovery Mode.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Zap, Trash2, ShieldAlert } from 'lucide-react';

const PERSISTENCE_KEY = 'syntax-schematic-board';

export default function QuadroBranco() {
  const [isMobile, setIsMobile] = useState(false);
  const [storeKey, setStoreKey] = useState(PERSISTENCE_KEY);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🛡️ RECOVERY LOGIC: Limpa buffers corrompidos do IndexedDB
  const handleStoreError = async () => {
    try {
      if (typeof window.indexedDB?.databases === 'function') {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name && db.name.includes('TLDRAW')) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
      setStoreKey(`${PERSISTENCE_KEY}-${Date.now()}`);
      setHasError(false);
    } catch {
      setStoreKey(`buffer-temp-${Date.now()}`);
    }
  };

  useEffect(() => {
    const handler = (event) => {
      if (event.message?.includes('migration-error') || event.message?.includes('Failed to migrate store')) {
        event.preventDefault();
        setHasError(true);
        handleStoreError();
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  return (
    <div
      className="w-full flex flex-col relative bg-slate-950 overflow-hidden"
      style={{
        height: isMobile ? 'calc(100dvh - 64px)' : 'calc(100dvh - 56px)',
        minHeight: 0,
      }}
    >
      {/* ── Overlay de Inicialização ── */}
      <AnimatePresence>
        {!isReady && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-[3px] border-indigo-500/10 border-t-cyan-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Terminal size={32} className="text-cyan-500" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
               <p className="text-[11px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Initializing_Schematic_Buffer</p>
               <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Alerta de Recuperação de Sistema ── */}
      {hasError && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-xl"
        >
          <ShieldAlert size={16} />
          Critical_Error: Buffer resetado por incompatibilidade.
        </motion.div>
      )}

      {/* ── Canvas tldraw Core ── */}
      <div className="flex-1 min-h-0 relative z-10">
        <Tldraw
          key={storeKey}
          persistenceKey={storeKey}
          autoFocus
          inferDarkMode={isDarkMode}
          onMount={(editor) => {
            try {
              editor.updateInstanceState({ isGridMode: true });
              setIsReady(true);
            } catch {
              setIsReady(true);
            }
          }}
        />
      </div>

      {/* ── CSS Injection: Syntax UI Overrides ── */}
      <style>{`
        /* Canvas Workspace */
        .tl-canvas {
          background-color: transparent !important;
        }

        .tl-watermark {
          display: none !important;
        }

        /* Syntax Control UI */
        .tl-ui-layout {
          padding: 12px !important;
        }

        .tl-toolbar, .tl-menu, .tl-ui-button, .tl-popover, .tl-helper-buttons {
          backdrop-filter: blur(24px) saturate(180%) !important;
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.85)'} !important;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
          border-radius: 18px !important;
          transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1) !important;
        }

        /* Selection Glow (Indigo-Cyan) */
        .tl-toolbar button[data-state="selected"], 
        .tl-ui-button[data-state="selected"] {
          background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%) !important;
          color: white !important;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.5) !important;
          transform: scale(1.05);
        }

        /* Typography & Interactive elements */
        .tl-ui-button {
          font-family: 'JetBrains Mono', monospace !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.05em !important;
        }

        /* Scrollbars inside tldraw UI */
        .tl-popover-content::-webkit-scrollbar { width: 4px; }
        .tl-popover-content::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }

        /* Mobile Optimization */
        @media (max-width: 768px) {
          .tl-toolbar {
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: fit-content !important;
            padding: 6px !important;
          }
          
          .tl-ui-layout__bottom__main {
            margin-right: 0 !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}