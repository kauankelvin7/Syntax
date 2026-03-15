/**
 * ⏱️ POMODORO_STATION
 * Timer tático com Music_Buffer (Lofi) — streams estáveis 2025
 *
 * FIXES vs versão anterior:
 * - URLs trocadas por streams HTTPS estáveis (FluxFM + SomaFM + StreamAfrica)
 * - Bug de closure corrigido no useLofiPlayer (refs em vez de state para controle)
 * - Troca de estação não gera mais 404 — audio.src é limpo antes de trocar
 * - Auto-retry: tenta próxima URL de fallback se a principal falhar
 * - Volume slider funcional sem re-render do audio element
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, Play, Pause, RotateCcw, Coffee, Code2,
  ChevronDown, Flame, Zap, Square,
  ChevronLeft, ChevronRight, Volume2, VolumeX, Radio,
} from 'lucide-react';
import { doc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Z } from '../constants/zIndex';

/* ─────────────────────────────────────────
   TIMER CONSTANTS
───────────────────────────────────────── */
const MODES = {
  pomodoro: { focus: 25 * 60, break: 5 * 60,  label: 'Pomodoro 25/5' },
  sprint:   { focus: 50 * 60, break: 10 * 60, label: 'Sprint 50/10'  },
  livre:    { focus: 0,       break: 0,        label: 'Livre'         },
};

/* ─────────────────────────────────────────
   LOFI STATIONS
   Cada estação tem URLs de fallback ordenadas por confiabilidade.
   Todas são HTTPS e não requerem autenticação.
───────────────────────────────────────── */
const LOFI_STATIONS = [
  {
    id:    'lofi_study',
    label: 'Lofi Study',
    desc:  'Chill beats to study',
    emoji: '📻',
    color: '#6366f1',
    urls: [
      'https://play.streamafrica.net/lofiradio',
      'https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/',
    ],
  },
  {
    id:    'chillhop',
    label: 'Chillhop',
    desc:  'Jazz & hip-hop vibes',
    emoji: '🎷',
    color: '#06b6d4',
    urls: [
      'https://streams.fluxfm.de/Chillhop/mp3-320/streams.fluxfm.de/',
      'https://play.streamafrica.net/lofiradio',
    ],
  },
  {
    id:    'lounge',
    label: 'Flux Lounge',
    desc:  'Smooth lounge vibes',
    emoji: '☕',
    color: '#f59e0b',
    urls: [
      'https://streams.fluxfm.de/lounge/mp3-320/audio/',
    ],
  },
  {
    id:    'drone_zone',
    label: 'Drone Zone',
    desc:  'Ambient & deep focus',
    emoji: '🧠',
    color: '#8b5cf6',
    urls: [
      'https://ice6.somafm.com/dronezone-128-mp3',
      'https://ice4.somafm.com/dronezone-128-mp3',
      'https://ice2.somafm.com/dronezone-128-mp3',
    ],
  },
  {
    id:    'groove_salad',
    label: 'Groove Salad',
    desc:  'Ambient electronica',
    emoji: '🌿',
    color: '#10b981',
    urls: [
      'https://ice6.somafm.com/groovesalad-128-mp3',
      'https://ice4.somafm.com/groovesalad-128-mp3',
      'https://ice2.somafm.com/groovesalad-128-mp3',
    ],
  },
  {
    id:    'synthwave',
    label: 'Synthwave',
    desc:  'Retrowave coding',
    emoji: '🌆',
    color: '#ec4899',
    urls: [
      'https://streams.fluxfm.de/elektro/mp3-320/audio/',
      'https://ice6.somafm.com/synphaera-128-mp3',
    ],
  },
];

/* ─────────────────────────────────────────
   HOOK: useLofiPlayer
   Usa refs para controle do audio — evita closure staleness.
   Toda lógica de play/pause/troca é imperativa (não reativa).
───────────────────────────────────────── */
function useLofiPlayer() {
  const audioRef        = useRef(null);
  const urlIndexRef     = useRef(0);   // índice de fallback URL dentro da estação
  const stationRef      = useRef(0);   // índice da estação atual
  const wantPlayRef     = useRef(false); // intenção do usuário (play ou pause)
  const mountedRef      = useRef(true);

  const [uiState, setUiState] = useState({
    isPlaying:   false,
    isLoading:   false,
    hasError:    false,
    stationIdx:  0,
    volume:      0.6,
  });

  const setUI = useCallback((patch) => {
    if (mountedRef.current) setUiState(p => ({ ...p, ...patch }));
  }, []);

  /* Inicializa Audio uma única vez */
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume  = 0.6;
    audioRef.current = audio;
    mountedRef.current = true;

    const onPlaying = () => setUI({ isPlaying: true,  isLoading: false, hasError: false });
    const onWaiting = () => setUI({ isLoading: true });
    const onPause   = () => setUI({ isPlaying: false, isLoading: false });
    const onStalled = () => setUI({ isLoading: true });
    const onError   = () => {
      // Tenta próxima URL de fallback da mesma estação
      const station  = LOFI_STATIONS[stationRef.current];
      const nextIdx  = urlIndexRef.current + 1;
      if (nextIdx < station.urls.length) {
        urlIndexRef.current = nextIdx;
        audio.src = station.urls[nextIdx];
        audio.load();
        if (wantPlayRef.current) audio.play().catch(() => {});
      } else {
        // Sem mais fallbacks
        urlIndexRef.current = 0;
        setUI({ isPlaying: false, isLoading: false, hasError: true });
      }
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('pause',   onPause);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('error',   onError);

    return () => {
      mountedRef.current = false;
      audio.pause();
      audio.src = '';
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('pause',   onPause);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('error',   onError);
    };
  }, []); // eslint-disable-line

  /* Carrega e toca a estação atual */
  const loadAndPlay = useCallback(async (stationIndex) => {
    const audio   = audioRef.current;
    if (!audio) return;

    const station = LOFI_STATIONS[stationIndex];
    urlIndexRef.current = 0;

    // Para qualquer coisa que esteja tocando antes de trocar src
    audio.pause();
    audio.src = '';

    setUI({ isLoading: true, hasError: false, isPlaying: false, stationIdx: stationIndex });
    stationRef.current = stationIndex;

    audio.src = station.urls[0];
    audio.load();

    try {
      await audio.play();
      wantPlayRef.current = true;
    } catch (err) {
      if (err?.name !== 'AbortError') {
        wantPlayRef.current = false;
        setUI({ isLoading: false, hasError: true });
      }
    }
  }, [setUI]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (uiState.isPlaying || uiState.isLoading) {
      wantPlayRef.current = false;
      audio.pause();
      audio.src = '';
    } else {
      await loadAndPlay(stationRef.current);
    }
  }, [uiState.isPlaying, uiState.isLoading, loadAndPlay]);

  const changeStation = useCallback(async (idx) => {
    const wasActive = uiState.isPlaying || uiState.isLoading;
    stationRef.current = idx;
    setUI({ stationIdx: idx, hasError: false });

    if (wasActive) {
      await loadAndPlay(idx);
    } else {
      // Só atualiza a UI sem iniciar play
      const audio = audioRef.current;
      if (audio) { audio.pause(); audio.src = ''; }
      setUI({ isPlaying: false, isLoading: false });
    }
  }, [uiState.isPlaying, uiState.isLoading, loadAndPlay, setUI]);

  const prevStation = useCallback(() => {
    const idx = (stationRef.current - 1 + LOFI_STATIONS.length) % LOFI_STATIONS.length;
    changeStation(idx);
  }, [changeStation]);

  const nextStation = useCallback(() => {
    const idx = (stationRef.current + 1) % LOFI_STATIONS.length;
    changeStation(idx);
  }, [changeStation]);

  const setVolume = useCallback((v) => {
    if (audioRef.current) audioRef.current.volume = v;
    setUI({ volume: v });
  }, [setUI]);

  return {
    ...uiState,
    currentStation: LOFI_STATIONS[uiState.stationIdx],
    toggle,
    prevStation,
    nextStation,
    changeStation,
    setVolume,
  };
}

/* ─────────────────────────────────────────
   LOFI PLAYER UI
───────────────────────────────────────── */
const LofiPlayer = memo(() => {
  const { isDarkMode } = useTheme();
  const {
    isPlaying, isLoading, hasError,
    volume, setVolume,
    currentStation, stationIdx,
    toggle, prevStation, nextStation, changeStation,
  } = useLofiPlayer();

  const [showStations, setShowStations] = useState(false);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Radio size={10} className="text-slate-500" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Lofi_Buffer
          </span>
        </div>
        <div className={`flex items-center gap-1.5`}>
          {isLoading && (
            <span className="text-[9px] text-amber-500 dark:text-amber-400 font-bold uppercase tracking-wider">
              Carregando...
            </span>
          )}
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            isLoading  ? 'bg-amber-500 dark:bg-amber-400 animate-pulse'
            : isPlaying ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'
            : hasError  ? 'bg-rose-500'
            : 'bg-slate-300 dark:bg-slate-700'
          }`} />
        </div>
      </div>

      {/* Seletor de estação */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={prevStation}
          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 shrink-0"
        >
          <ChevronLeft size={13} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => setShowStations(p => !p)}
          className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/20 transition-all min-w-0"
        >
          <span className="text-base leading-none shrink-0">{currentStation.emoji}</span>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-tight">
              {currentStation.label}
            </p>
            <p className="text-[9px] text-slate-500 dark:text-slate-600 truncate leading-tight">
              {currentStation.desc}
            </p>
          </div>
          <ChevronDown
            size={11}
            className={`text-slate-500 dark:text-slate-600 shrink-0 transition-transform ${showStations ? 'rotate-180' : ''}`}
          />
        </button>

        <button
          onClick={nextStation}
          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 shrink-0"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Lista de estações (dropdown) */}
      <AnimatePresence>
        {showStations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-3"
          >
            <div className="space-y-1 pt-1">
              {LOFI_STATIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { changeStation(i); setShowStations(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left ${
                    stationIdx === i
                      ? 'bg-indigo-50 dark:bg-white/10 border border-indigo-100 dark:border-white/10'
                      : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="text-sm leading-none">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{s.label}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-600 truncate">{s.desc}</p>
                  </div>
                  {stationIdx === i && (
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles de play + barra */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={toggle}
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 shrink-0 ${
            isPlaying
              ? 'shadow-lg'
              : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
          style={isPlaying ? { backgroundColor: currentStation.color } : {}}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Square size={13} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={13} fill="currentColor" className={`ml-0.5 ${isPlaying ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
          )}
        </button>

        {/* Barra animada */}
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          {isLoading ? (
            <motion.div
              className="h-full w-2/5 rounded-full bg-amber-500 dark:bg-amber-400"
              animate={{ x: ['-100%', '350%'] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : isPlaying ? (
            <motion.div
              className="h-full rounded-full w-full"
              style={{ backgroundColor: currentStation.color }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : (
            <div className="h-full w-0" />
          )}
        </div>

        {/* Mute toggle */}
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.6)}
          className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-white transition-colors shrink-0"
        >
          {volume === 0
            ? <VolumeX size={14} strokeWidth={2} />
            : <Volume2 size={14} strokeWidth={2} />
          }
        </button>
      </div>

      {/* Volume slider */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.02}
        value={volume}
        onChange={e => setVolume(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-800"
        style={{
          background: `linear-gradient(to right, ${currentStation.color} ${volume * 100}%, ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} ${volume * 100}%)`,
        }}
      />

      {/* Erro */}
      {hasError && (
        <p className="mt-2.5 text-[10px] text-rose-400/70 text-center leading-relaxed">
          Stream indisponível — tente outra estação
        </p>
      )}
    </div>
  );
});

LofiPlayer.displayName = 'LofiPlayer';

/* ═══════════════════════════════════════════════════════════
   POMODORO TIMER
═══════════════════════════════════════════════════════════ */
const PomodoroTimer = memo(() => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [isExpanded, setIsExpanded]               = useState(false);
  const [isRunning, setIsRunning]                 = useState(false);
  const [timerMode, setTimerMode]                 = useState('pomodoro');
  const [mode, setMode]                           = useState('focus');
  const [timeLeft, setTimeLeft]                   = useState(MODES.pomodoro.focus);
  const [elapsedTime, setElapsedTime]             = useState(0);
  const [cyclesCompleted, setCyclesCompleted]     = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [isMobile, setIsMobile]                   = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const intervalRef = useRef(null);
  const alarmRef    = useRef(null);

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

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (timerMode === 'livre') {
          setElapsedTime(p => p + 1);
        } else {
          setTimeLeft(p => {
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
  const accentColor  = isLastMinute ? '#f43f5e' : mode === 'focus' ? '#6366F1' : '#F59E0B';
  const accentBg     = isLastMinute ? 'bg-rose-600' : mode === 'focus' ? 'bg-indigo-600' : 'bg-amber-600';

  if (!user) return null;

  return (
    <>
      <audio ref={alarmRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

          {/* Barra compacta mobile */}
          <AnimatePresence>
            {isMobile && isRunning && !isExpanded && (
              <motion.div
                initial={{ y: -48, opacity: 0 }}
                animate={{ y: 0,   opacity: 1 }}
                exit={{    y: -48, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                style={{ zIndex: Z.navbar - 1 }}
                className="fixed top-16 left-0 right-0 h-11 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${mode === 'focus' ? 'bg-indigo-500' : 'bg-amber-500'} ${isLastMinute ? 'animate-ping' : 'animate-pulse'}`} />
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {timerMode === 'livre' ? 'Livre' : mode === 'focus' ? 'Foco' : 'Break'}
                  </span>
                </div>
                <span className={`absolute left-1/2 -translate-x-1/2 text-sm font-black font-mono tracking-tighter ${isLastMinute ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                  {timerMode === 'livre' ? formatTime(elapsedTime) : formatTime(timeLeft)}
                </span>
                <button onClick={() => setIsExpanded(true)} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest h-11 px-2">
                  Abrir
                </button>
              </motion.div>
            )}
          </AnimatePresence>

      <div className={`flex flex-col items-end gap-4 relative ${isMobile && isRunning && !isExpanded ? 'opacity-0 pointer-events-none' : ''}`}>
        <AnimatePresence mode="wait">

          {/* Botão minimizado */}
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
                className={`w-14 h-14 flex items-center justify-center relative overflow-hidden shadow-2xl border-2 border-white/10 ${isLastMinute ? 'animate-pulse border-rose-500/50 shadow-rose-500/20' : ''}`}
                style={{
                  borderRadius: 18,
                  background: isRunning
                    ? mode === 'focus'
                      ? 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #06b6d4 100%)'
                      : 'linear-gradient(135deg, #451a03 0%, #f59e0b 50%, #fbbf24 100%)'
                    : 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                }}
              >
                {isRunning && timerMode !== 'livre' && (
                  <div className="absolute inset-0 p-1">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="21" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                      <motion.circle cx="25" cy="25" r="21" fill="none"
                        stroke={isLastMinute ? '#f43f5e' : (mode === 'focus' ? '#22d3ee' : '#fbbf24')}
                        strokeWidth="2.5" strokeDasharray={132}
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
              <motion.div
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 ${
                  isRunning ? (isLastMinute ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-600'
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

          {/* Painel expandido */}
          {isExpanded && (
            <motion.div
              key="expanded"
              style={{ zIndex: Z.pomodoro }}
              className={`fixed ${
                isMobile
                  ? 'inset-x-0 bottom-0 rounded-t-[32px] max-h-[92dvh]'
                  : 'bottom-6 right-6 w-[320px] rounded-[32px] max-h-[calc(100dvh-5rem)]'
              } bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col`}
              initial={isMobile ? { y: '100%' } : { opacity: 0, y: 40, scale: 0.95 }}
              animate={isMobile ? { y: 0 }      : { opacity: 1, y: 0,  scale: 1    }}
              exit={isMobile    ? { y: '100%' } : { opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {isMobile && (
                <div className="flex justify-center pt-3 pb-1 shrink-0 bg-slate-50 dark:bg-slate-950">
                  <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                </div>
              )}

              {/* Header */}
              <div className={`px-6 py-4 flex items-center justify-between shrink-0 ${accentBg}`}>
                <div className="flex items-center gap-2 text-white">
                  {timerMode === 'livre' ? <Flame size={18} /> : mode === 'focus' ? <Code2 size={18} /> : <Coffee size={18} />}
                  <span className="font-black text-[11px] uppercase tracking-[0.2em]">
                    {timerMode === 'livre' ? 'Livre_Flow' : mode === 'focus' ? 'Deep_Work' : 'Break_Sync'}
                  </span>
                </div>
                <button onClick={() => setIsExpanded(false)} aria-label="Fechar"
                  className="w-11 h-11 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <ChevronDown size={20} strokeWidth={3} />
                </button>
              </div>

              {/* Scroll interno */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-6 sm:p-8 flex flex-col items-center bg-white dark:bg-slate-950">

                  {/* Modo */}
                  <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-full">
                    {Object.entries(MODES).map(([key]) => (
                      <button key={key} onClick={() => changeMode(key)}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          timerMode === key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}>
                        {key}
                      </button>
                    ))}
                  </div>

                  {/* Círculo */}
                  <div className={`relative flex items-center justify-center mb-6 ${isLastMinute ? 'animate-pulse' : ''}`}
                    style={{ width: 176, height: 176 }}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
                      <circle cx="88" cy="88" r="80" fill="none" stroke={isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'} strokeWidth="8" />
                      <motion.circle cx="88" cy="88" r="80" fill="none"
                        stroke={accentColor} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={503} strokeDashoffset={503 - (503 * progress) / 100}
                        transition={{ duration: 0.5 }}
                      />
                    </svg>
                    <div className="text-center relative z-10">
                      <span className={`block text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter ${isLastMinute ? 'text-rose-500' : ''}`}>
                        {timerMode === 'livre' ? formatTime(elapsedTime) : formatTime(timeLeft)}
                      </span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 block">
                        {isRunning ? 'Running' : 'Paused'}
                      </span>
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={() => {
                        if (timerMode === 'livre') setElapsedTime(0);
                        else setTimeLeft(mode === 'focus' ? MODES[timerMode].focus : MODES[timerMode].break);
                        setIsRunning(false);
                      }}
                      className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95">
                      <RotateCcw size={18} />
                    </button>
                    <button onClick={() => setIsRunning(p => !p)}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${accentBg}`}>
                      {isRunning ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                      disabled={timerMode === 'livre'}
                      onClick={() => {
                        const next = mode === 'focus' ? 'break' : 'focus';
                        setMode(next);
                        setTimeLeft(next === 'focus' ? MODES[timerMode].focus : MODES[timerMode].break);
                        setIsRunning(false);
                      }}
                      className={`w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 ${timerMode === 'livre' ? 'opacity-20 cursor-not-allowed' : ''}`}>
                      {mode === 'focus' ? <Coffee size={18} /> : <Code2 size={18} />}
                    </button>
                  </div>

                  {/* ✅ Lofi Player */}
                  <LofiPlayer />

                  {/* Stats */}
                  <div className="w-full grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-slate-100/50 dark:bg-white/5 p-3 rounded-xl text-center border border-slate-200 dark:border-white/5">
                      <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Cycles</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{cyclesCompleted}</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-white/5 p-3 rounded-xl text-center border border-slate-200 dark:border-white/5">
                      <span className="block text-[8px] font-black text-slate-500 uppercase mb-1">Uptime</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-cyan-400 font-mono">{totalMinutesToday}m</span>
                    </div>
                  </div>

                  {isMobile && <div className="h-6" />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop mobile */}
      <AnimatePresence>
        {isExpanded && isMobile && (
          <motion.div
            key="pomodoro-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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