/**
 * ⏱️ POMODORO_STATION
 * Timer tático com integração de Music_Buffer (Lofi).
 *
 * @fixes
 *  - Painel expandido agora se adapta a qualquer viewport
 *  - Mobile: painel ocupa toda a tela (bottom sheet)
 *  - Tablet/Desktop: floating card 320px, nunca cortado
 *  - Barra compacta não sobrepõe navbar incorretamente
 *  - Scroll interno quando altura da viewport for insuficiente
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Code2,
  ChevronDown,
  Flame,
  Zap,
  Square,
} from 'lucide-react';
import { doc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext-firebase';
import { Z } from '../constants/zIndex';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const MODES = {
  pomodoro: { focus: 25 * 60, break: 5 * 60,  label: 'Pomodoro 25/5' },
  sprint:   { focus: 50 * 60, break: 10 * 60, label: 'Sprint 50/10'  },
  livre:    { focus: 0,       break: 0,        label: 'Livre'         },
};

// Fallback seguro — nunca lança ReferenceError
const LOFI_STREAM_URL =
  import.meta.env?.VITE_LOFI_STREAM_URL ??
  'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1';

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
const PomodoroTimer = memo(() => {
  const { user } = useAuth();

  const [isExpanded, setIsExpanded]             = useState(false);
  const [isRunning, setIsRunning]               = useState(false);
  const [timerMode, setTimerMode]               = useState('pomodoro');
  const [mode, setMode]                         = useState('focus');
  const [timeLeft, setTimeLeft]                 = useState(MODES.pomodoro.focus);
  const [elapsedTime, setElapsedTime]           = useState(0);
  const [cyclesCompleted, setCyclesCompleted]   = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying]     = useState(false);

  // Breakpoint reativo — recalculado no resize
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const intervalRef = useRef(null);
  const alarmRef    = useRef(null);
  const musicRef    = useRef(null);

  /* ── Carregar dados do Firestore ── */
  useEffect(() => {
    if (user) loadUserPomodoroData();
  }, [user]);

  const loadUserPomodoroData = async () => {
    try {
      const userId = user?.id || user?.uid;
      const today  = new Date().toISOString().split('T')[0];
      const snap   = await getDoc(doc(db, 'pomodoro', `${userId}_${today}`));
      if (snap.exists()) {
        const data = snap.data();
        setCyclesCompleted(data.cycles || 0);
        setTotalMinutesToday(data.minutesStudied || 0);
      }
    } catch {
      console.warn('[Syntax:Pomodoro] Firestore offline.');
    }
  };

  /* ── Completar ciclo ── */
  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    if (alarmRef.current) alarmRef.current.play().catch(() => {});

    if (mode === 'focus') {
      const focusMinutes = Math.floor(MODES[timerMode].focus / 60);
      const newCycles    = cyclesCompleted + 1;
      const newMinutes   = totalMinutesToday + focusMinutes;
      setCyclesCompleted(newCycles);
      setTotalMinutesToday(newMinutes);
      await savePomodoroProgress(newCycles, newMinutes, focusMinutes);
      setMode('break');
      setTimeLeft(MODES[timerMode].break);
      if (Notification.permission === 'granted') {
        new Notification('🚀 SPRINT_COMPLETE', { body: 'Hora do Coffee Break.' });
      }
    } else {
      setMode('focus');
      setTimeLeft(MODES[timerMode].focus);
    }
  }, [mode, cyclesCompleted, totalMinutesToday, timerMode]);

  /* ── Tick do timer ── */
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (timerMode === 'livre') {
          setElapsedTime((p) => p + 1);
        } else {
          setTimeLeft((p) => {
            if (p <= 0) { clearInterval(intervalRef.current); return 0; }
            return p - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timerMode]);

  useEffect(() => {
    if (timerMode !== 'livre' && timeLeft === 0 && isRunning) handleTimerComplete();
  }, [timeLeft, isRunning, timerMode, handleTimerComplete]);

  /* ── Persistência ── */
  const savePomodoroProgress = async (cycles, minutes, sessionMinutes) => {
    const userId = user?.id || user?.uid;
    const today  = new Date().toISOString().split('T')[0];
    try {
      await setDoc(
        doc(db, 'pomodoro', `${userId}_${today}`),
        { uid: userId, date: today, cycles, minutesStudied: minutes, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await setDoc(
        doc(db, 'users', userId),
        { totalMinutesStudied: increment(sessionMinutes || 0), lastPomodoroAt: serverTimestamp() },
        { merge: true }
      );
    } catch {
      console.error('[Syntax:Pomodoro] Erro ao salvar progresso.');
    }
  };

  /* ── Helpers ── */
  const progress = useMemo(() => {
    if (timerMode === 'livre') return 100;
    const total = mode === 'focus' ? MODES[timerMode].focus : MODES[timerMode].break;
    return ((total - timeLeft) / total) * 100;
  }, [mode, timeLeft, timerMode]);

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const changeMode = (newMode) => {
    setTimerMode(newMode);
    setMode('focus');
    setIsRunning(false);
    setElapsedTime(0);
    if (newMode !== 'livre') setTimeLeft(MODES[newMode].focus);
  };

  const isLastMinute = timeLeft > 0 && timeLeft <= 60 && timerMode !== 'livre';

  const toggleMusic = () => {
    if (!musicRef.current) return;
    if (isMusicPlaying) {
      musicRef.current.pause();
    } else {
      musicRef.current.play().catch(() => toast.error('Codec Error.'));
    }
    setIsMusicPlaying((p) => !p);
  };

  const accentColor = isLastMinute
    ? '#f43f5e'
    : mode === 'focus' ? '#6366F1' : '#F59E0B';

  const accentBg = isLastMinute
    ? 'bg-rose-600'
    : mode === 'focus' ? 'bg-indigo-600' : 'bg-amber-600';

  if (!user) return null;

  return (
    <>
      <audio ref={alarmRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      <audio ref={musicRef} src={LOFI_STREAM_URL} loop preload="none" />

      {/* ─── Barra compacta mobile (timer rodando + painel fechado) ───
          Fica logo abaixo da navbar (top-16 = 64px) para não sobrepor  */}
      <AnimatePresence>
        {isMobile && isRunning && !isExpanded && (
          <motion.div
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{ zIndex: Z.navbar - 1 }}
            className="fixed top-16 left-0 right-0 h-11 bg-slate-900/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 shadow-lg"
          >
            {/* Indicador de fase */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  mode === 'focus' ? 'bg-indigo-500' : 'bg-amber-500'
                } ${isLastMinute ? 'animate-ping' : 'animate-pulse'}`}
              />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {timerMode === 'livre' ? 'Livre' : mode === 'focus' ? 'Foco' : 'Break'}
              </span>
            </div>

            {/* Tempo centralizado */}
            <span
              className={`absolute left-1/2 -translate-x-1/2 text-sm font-black font-mono tracking-tighter ${
                isLastMinute ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}
            >
              {timerMode === 'livre' ? formatTime(elapsedTime) : formatTime(timeLeft)}
            </span>

            {/* Botão expandir */}
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[10px] font-black text-indigo-400 uppercase tracking-widest h-11 px-2"
            >
              Abrir
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Wrapper externo — só mostra o botão minimizado quando não expandido ─── */}
      <div
        className={`flex flex-col items-end gap-4 relative ${
          isMobile && isRunning && !isExpanded ? 'opacity-0 pointer-events-none' : ''
        }`}
      >
        <AnimatePresence mode="wait">

          {/* ──────── BOTÃO MINIMIZADO ──────── */}
          {!isExpanded && (
            <motion.button
              key="minimized"
              onClick={() => setIsExpanded(true)}
              className="relative group flex flex-col items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
            >
              <div
                className={`w-14 h-14 flex items-center justify-center relative overflow-hidden shadow-2xl border-2 border-white/10 ${
                  isLastMinute ? 'animate-pulse border-rose-500/50 shadow-rose-500/20' : ''
                }`}
                style={{
                  borderRadius: 18,
                  background: isRunning
                    ? mode === 'focus'
                      ? 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #06b6d4 100%)'
                      : 'linear-gradient(135deg, #451a03 0%, #f59e0b 50%, #fbbf24 100%)'
                    : 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                }}
              >
                {/* Anel de progresso */}
                {isRunning && timerMode !== 'livre' && (
                  <div className="absolute inset-0 p-1">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="21" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                      <motion.circle
                        cx="25" cy="25" r="21" fill="none"
                        stroke={isLastMinute ? '#f43f5e' : (mode === 'focus' ? '#22d3ee' : '#fbbf24')}
                        strokeWidth="2.5"
                        strokeDasharray={132}
                        strokeDashoffset={132 - (132 * progress) / 100}
                      />
                    </svg>
                  </div>
                )}
                {timerMode === 'livre'
                  ? <Flame size={24} color="#fff" strokeWidth={2.2} className="relative z-10" />
                  : mode === 'focus'
                    ? <Timer size={24} color="#fff" strokeWidth={2.2} className="relative z-10" />
                    : <Coffee size={24} color="#fff" strokeWidth={2.2} className="relative z-10" />
                }
              </div>

              {/* Badge de status */}
              <motion.div
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)] ${
                  isRunning
                    ? isLastMinute ? 'bg-rose-500' : 'bg-emerald-500'
                    : 'bg-slate-600'
                }`}
                animate={isRunning ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {isRunning
                  ? <Zap size={10} color="#fff" fill="currentColor" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                }
              </motion.div>
            </motion.button>
          )}

          {/* ──────── PAINEL EXPANDIDO ──────── */}
          {isExpanded && (
            <motion.div
              key="expanded"
              style={{ zIndex: Z.pomodoro }}
              className={`
                fixed
                ${isMobile
                  /* Mobile: bottom sheet cobrindo toda a tela de baixo pra cima */
                  ? 'inset-x-0 bottom-0 rounded-t-[32px] rounded-b-none max-h-[92dvh]'
                  /* Tablet/Desktop: card flutuante, nunca ultrapassa a viewport */
                  : 'bottom-6 right-6 w-[320px] rounded-[32px] max-h-[calc(100dvh-5rem)]'
                }
                bg-slate-900 border-2 border-white/5 shadow-2xl overflow-hidden flex flex-col
              `}
              initial={isMobile
                ? { y: '100%', opacity: 1 }
                : { opacity: 0, y: 40, scale: 0.95 }
              }
              animate={isMobile
                ? { y: 0, opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
              }
              exit={isMobile
                ? { y: '100%', opacity: 1 }
                : { opacity: 0, y: 40, scale: 0.95 }
              }
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Handle visual (mobile) */}
              {isMobile && (
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>
              )}

              {/* Header colorido */}
              <div
                className={`px-6 py-4 flex items-center justify-between shrink-0 ${accentBg}`}
              >
                <div className="flex items-center gap-2 text-white">
                  {timerMode === 'livre'
                    ? <Flame size={18} />
                    : mode === 'focus' ? <Code2 size={18} /> : <Coffee size={18} />
                  }
                  <span className="font-black text-[11px] uppercase tracking-[0.2em]">
                    {timerMode === 'livre'
                      ? 'Livre_Flow'
                      : mode === 'focus' ? 'Deep_Work' : 'Break_Sync'
                    }
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  aria-label="Fechar timer"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <ChevronDown size={20} strokeWidth={3} />
                </button>
              </div>

              {/* Conteúdo com scroll interno quando viewport for pequena */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-6 sm:p-8 flex flex-col items-center bg-slate-950">

                  {/* Seletor de modo */}
                  <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl w-full">
                    {Object.entries(MODES).map(([key]) => (
                      <button
                        key={key}
                        onClick={() => changeMode(key)}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          timerMode === key
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  {/* Círculo do timer */}
                  <div
                    className={`relative flex items-center justify-center mb-6 ${
                      isLastMinute ? 'animate-pulse' : ''
                    }`}
                    style={{ width: isMobile ? 176 : 176, height: isMobile ? 176 : 176 }}
                  >
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
                      <circle cx="88" cy="88" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                      <motion.circle
                        cx="88" cy="88" r="80" fill="none"
                        stroke={accentColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={503}
                        strokeDashoffset={503 - (503 * progress) / 100}
                        transition={{ duration: 0.5 }}
                      />
                    </svg>
                    <div className="text-center relative z-10">
                      <span
                        className={`block text-4xl font-black text-white font-mono tracking-tighter ${
                          isLastMinute ? 'text-rose-500' : ''
                        }`}
                      >
                        {timerMode === 'livre' ? formatTime(elapsedTime) : formatTime(timeLeft)}
                      </span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 block">
                        {isRunning ? 'Running' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-4 mb-6">
                    {/* Reset */}
                    <button
                      onClick={() => {
                        if (timerMode === 'livre') setElapsedTime(0);
                        else setTimeLeft(mode === 'focus' ? MODES[timerMode].focus : MODES[timerMode].break);
                        setIsRunning(false);
                      }}
                      className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-95"
                    >
                      <RotateCcw size={18} />
                    </button>

                    {/* Play/Pause */}
                    <button
                      onClick={() => setIsRunning((p) => !p)}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${accentBg}`}
                    >
                      {isRunning
                        ? <Pause size={30} fill="currentColor" />
                        : <Play size={30} fill="currentColor" className="ml-1" />
                      }
                    </button>

                    {/* Alternar foco/break */}
                    <button
                      disabled={timerMode === 'livre'}
                      onClick={() => {
                        const next = mode === 'focus' ? 'break' : 'focus';
                        setMode(next);
                        setTimeLeft(next === 'focus' ? MODES[timerMode].focus : MODES[timerMode].break);
                        setIsRunning(false);
                      }}
                      className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-95 ${
                        timerMode === 'livre' ? 'opacity-20 cursor-not-allowed' : ''
                      }`}
                    >
                      {mode === 'focus' ? <Coffee size={18} /> : <Code2 size={18} />}
                    </button>
                  </div>

                  {/* Lofi Buffer */}
                  <div className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Lofi_Buffer
                      </span>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isMusicPlaying ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleMusic}
                        className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
                      >
                        {isMusicPlaying
                          ? <Square size={12} fill="currentColor" />
                          : <Play size={12} fill="currentColor" />
                        }
                      </button>
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-cyan-500"
                          animate={isMusicPlaying ? { x: ['-100%', '100%'] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="w-full grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                      <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Cycles</span>
                      <span className="text-lg font-black text-white font-mono">{cyclesCompleted}</span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                      <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Uptime</span>
                      <span className="text-lg font-black text-cyan-400 font-mono">{totalMinutesToday}m</span>
                    </div>
                  </div>

                  {/* Espaço extra no bottom para mobile não ficar grudado na barra de gestos */}
                  {isMobile && <div className="h-6" />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop mobile — fecha ao tocar fora */}
      <AnimatePresence>
        {isExpanded && isMobile && (
          <motion.div
            key="pomodoro-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: Z.pomodoro - 1 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

PomodoroTimer.displayName = 'PomodoroTimer';
export default PomodoroTimer;