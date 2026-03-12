/**
 * ⏱️ POMODORO_STATION (Timer de Deep Work) — Syntax Theme Premium
 * * Timer tático com integração de Music_Buffer (Lofi).
 * - Theme: Infrastructure (Slate-950 / Indigo / Amber)
 * - Consistency: Unificado com o Design System da AdaBot.
 * - Features: SM-2 Sync, Lofi Radio Player, Session Telemetry.
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
  Volume2,
  VolumeX,
  Zap,
  Square
} from 'lucide-react';
import { doc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext-firebase';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const LOFI_STREAM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

const PomodoroTimer = memo(() => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); 
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const intervalRef = useRef(null);
  const alarmRef = useRef(null);
  const musicRef = useRef(null);

  useEffect(() => {
    if (user) loadUserPomodoroData();
  }, [user]);

  const loadUserPomodoroData = async () => {
    try {
      const userId = user?.id || user?.uid;
      const today = new Date().toISOString().split('T')[0];
      const docSnap = await getDoc(doc(db, 'pomodoro', `${userId}_${today}`));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCyclesCompleted(data.cycles || 0);
        setTotalMinutesToday(data.minutesStudied || 0);
      }
    } catch (error) {
      console.warn('🛰️ POMODORO_PROTOCOL: Firestore offline.');
    }
  };

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    if (alarmRef.current) alarmRef.current.play().catch(() => {});

    if (mode === 'focus') {
      const newCycles = cyclesCompleted + 1;
      const newMinutes = totalMinutesToday + 25;
      setCyclesCompleted(newCycles);
      setTotalMinutesToday(newMinutes);
      await savePomodoroProgress(newCycles, newMinutes);
      setMode('break');
      setTimeLeft(BREAK_TIME);
      if (Notification.permission === 'granted') {
        new Notification('🚀 SPRINT_COMPLETE', { body: 'Hora do Coffee Break.' });
      }
    } else {
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
    }
  }, [mode, cyclesCompleted, totalMinutesToday, user]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const savePomodoroProgress = async (cycles, minutes) => {
    const userId = user?.id || user?.uid;
    const today = new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, 'pomodoro', `${userId}_${today}`), { uid: userId, date: today, cycles, minutesStudied: minutes, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, 'users', userId), { totalMinutesStudied: increment(25), lastPomodoroAt: serverTimestamp() }, { merge: true });
    } catch (e) { console.error('Data_Sync_Error'); }
  };

  const progress = useMemo(() => {
    const total = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
    return ((total - timeLeft) / total) * 100;
  }, [mode, timeLeft]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const toggleMusic = () => {
    if (isMusicPlaying) musicRef.current.pause();
    else musicRef.current.play().catch(() => toast.error("Codec Error."));
    setIsMusicPlaying(!isMusicPlaying);
  };

  if (!user) return null;

  return (
    <>
      <audio ref={alarmRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      <audio ref={musicRef} src={LOFI_STREAM_URL} loop preload="none" />

      <div className="flex flex-col items-end gap-4 relative">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            /* ──────── BOTÃO MINIMIZADO (SYNTAX UNIFIED) ──────── */
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
                className="w-14.5 h-14.5 flex items-center justify-center relative overflow-hidden shadow-2xl border-2 border-white/10"
                style={{
                  borderRadius: 18,
                  background: isRunning 
                    ? mode === 'focus'
                      ? 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #06b6d4 100%)'
                      : 'linear-gradient(135deg, #451a03 0%, #f59e0b 50%, #fbbf24 100%)'
                    : 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                }}
              >
                {/* Ring de Progresso Unificado */}
                {isRunning && (
                  <div className="absolute inset-0 p-1">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="25" cy="25" r="21" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                      <motion.circle 
                        cx="25" cy="25" r="21" fill="none" 
                        stroke={mode === 'focus' ? '#22d3ee' : '#fbbf24'} 
                        strokeWidth="2.5" 
                        strokeDasharray={132} 
                        strokeDashoffset={132 - (132 * progress) / 100} 
                      />
                    </svg>
                  </div>
                )}
                {mode === 'focus' ? (
                  <Timer size={26} color="#fff" strokeWidth={2.2} className="relative z-10 drop-shadow-md" />
                ) : (
                  <Coffee size={26} color="#fff" strokeWidth={2.2} className="relative z-10 drop-shadow-md" />
                )}
              </div>

              {/* Status Badge (Consistency with AdaBot) */}
              <motion.div
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)] ${isRunning ? 'bg-emerald-500' : 'bg-slate-600'}`}
                animate={isRunning ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {isRunning ? <Zap size={10} color="#fff" fill="currentColor" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/40" />}
              </motion.div>
            </motion.button>
          ) : (
            /* ──────── PAINEL EXPANDIDO (MAIN INFRA) ──────── */
            <motion.div
              key="expanded"
              className="fixed z-[200] bottom-6 right-6 w-full sm:w-[320px] bg-slate-900 border-2 border-white/5 rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
            >
              <div className={`px-6 py-4 flex items-center justify-between ${mode === 'focus' ? 'bg-indigo-600' : 'bg-amber-600'}`}>
                <div className="flex items-center gap-2 text-white">
                  {mode === 'focus' ? <Code2 size={18} /> : <Coffee size={18} />}
                  <span className="font-black text-[11px] uppercase tracking-[0.2em]">{mode === 'focus' ? 'Deep_Work' : 'Break_Sync'}</span>
                </div>
                <button onClick={() => setIsExpanded(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <ChevronDown size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center bg-slate-950">
                <div className="relative w-44 h-44 flex items-center justify-center mb-8">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="88" cy="88" r="80" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    <motion.circle 
                      cx="88" cy="88" r="80" fill="none" stroke={mode === 'focus' ? '#6366F1' : '#F59E0B'} 
                      strokeWidth="8" strokeLinecap="round" strokeDasharray={503} strokeDashoffset={503 - (503 * progress) / 100}
                    />
                  </svg>
                  <div className="text-center relative z-10">
                    <span className="block text-4xl font-black text-white font-mono tracking-tighter">{formatTime(timeLeft)}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 block">{isRunning ? 'Running' : 'Paused'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all"><RotateCcw size={18} /></button>
                  <button onClick={() => setIsRunning(!isRunning)} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all ${mode === 'focus' ? 'bg-indigo-600' : 'bg-amber-600'}`}>
                    {isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={() => setMode(mode === 'focus' ? 'break' : 'focus')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                    {mode === 'focus' ? <Coffee size={18} /> : <Code2 size={18} />}
                  </button>
                </div>

                {/* Music Station Buffer */}
                <div className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 mb-6">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lofi_Buffer</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${isMusicPlaying ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                   </div>
                   <div className="flex items-center gap-3">
                      <button onClick={toggleMusic} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        {isMusicPlaying ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                      </button>
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-cyan-500" animate={isMusicPlaying ? { x: ['-100%', '100%'] } : {}} transition={{ duration: 2, repeat: Infinity }} />
                      </div>
                   </div>
                </div>

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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

PomodoroTimer.displayName = 'PomodoroTimer';
export default PomodoroTimer;