import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RefreshCw, Zap, Coffee, Target } from 'lucide-react';

const MODES = {
  focus: { label: 'Foco Total', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', focus: 25 * 60 },
  break: { label: 'Pausa Curta', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', focus: 5 * 60 },
  longBreak: { label: 'Pausa Longa', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', focus: 15 * 60 },
};

const RoomPomodoro = ({ pomodoro, isOwner, onUpdate }) => {
  const [timeLeft, setTimeLeft] = useState(pomodoro?.timeLeft || 25 * 60);
  const currentMode = MODES[pomodoro?.mode] || MODES.focus;

  // Lógica de sincronização baseada no timestamp do servidor
  useEffect(() => {
    if (!pomodoro?.isRunning || !pomodoro?.startedAt) {
      setTimeLeft(pomodoro?.timeLeft || currentMode.focus);
      return;
    }
    
    const tick = () => {
      const startedAt = pomodoro.startedAt.toDate?.() ?? new Date(pomodoro.startedAt);
      const totalTime = pomodoro.timeLeft; // O tempo que restava quando deu play
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      const remaining = Math.max(0, totalTime - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining === 0 && isOwner) {
        // Ciclo completo - apenas o owner atualiza o estado global
        handleCycleComplete();
      }
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pomodoro?.isRunning, pomodoro?.startedAt, pomodoro?.mode, isOwner]);

  const handleCycleComplete = () => {
    if (!isOwner) return;
    const nextMode = pomodoro.mode === 'focus' ? 'break' : 'focus';
    onUpdate({
      ...pomodoro,
      mode: nextMode,
      isRunning: false,
      timeLeft: MODES[nextMode].focus,
      startedAt: null,
      cycle: nextMode === 'focus' ? pomodoro.cycle + 1 : pomodoro.cycle
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isOwner) return;
    onUpdate({
      ...pomodoro,
      isRunning: !pomodoro.isRunning,
      startedAt: !pomodoro.isRunning ? new Date() : null,
      timeLeft: timeLeft // Salva onde parou
    });
  };

  const resetTimer = () => {
    if (!isOwner) return;
    onUpdate({
      ...pomodoro,
      isRunning: false,
      startedAt: null,
      timeLeft: currentMode.focus
    });
  };

  // Cálculo da porcentagem para o círculo de progresso
  const totalModeTime = currentMode.focus;
  const progress = ((totalModeTime - timeLeft) / totalModeTime) * 100;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      {/* Mode Selector (Visual Only for non-owners) */}
      <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-[20px] border border-white/5">
        {Object.entries(MODES).map(([key, config]) => (
          <button
            key={key}
            disabled={!isOwner}
            onClick={() => onUpdate({ ...pomodoro, mode: key, timeLeft: config.focus, isRunning: false, startedAt: null })}
            className={`px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${
              pomodoro?.mode === key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* SVG Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            className="stroke-slate-800 fill-none"
            strokeWidth="8"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            className={`fill-none ${currentMode.color}`}
            strokeWidth="8"
            strokeDasharray="100 100"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 100 - progress }}
            style={{ pathLength: 1 }}
          />
        </svg>

        {/* Time Display */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.span 
            key={timeLeft}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl sm:text-8xl font-black text-white tracking-tighter tabular-nums"
          >
            {formatTime(timeLeft)}
          </motion.span>
          <div className={`flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${currentMode.bg} ${currentMode.color} border ${currentMode.border}`}>
            {pomodoro?.mode === 'focus' ? <Target size={12} /> : <Coffee size={12} />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{currentMode.label}</span>
          </div>
        </div>

        {/* Decorative Glow */}
        <div className={`absolute inset-0 rounded-full blur-[60px] opacity-20 transition-colors duration-1000 ${pomodoro?.isRunning ? 'bg-indigo-500' : 'bg-slate-500'}`} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        {isOwner ? (
          <>
            <button
              onClick={resetTimer}
              className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-slate-500 hover:text-white hover:border-white/10 transition-all"
            >
              <RefreshCw size={24} />
            </button>
            
            <button
              onClick={toggleTimer}
              className={`w-20 h-20 rounded-[28px] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                pomodoro?.isRunning ? 'bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600 shadow-indigo-600/20'
              }`}
            >
              {pomodoro?.isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            <button
              className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/20 transition-all"
              title="Próximo Ciclo"
              onClick={handleCycleComplete}
            >
              <Zap size={24} />
            </button>
          </>
        ) : (
          <div className="px-8 py-4 rounded-[24px] bg-slate-900/80 border border-white/5 backdrop-blur-sm">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {pomodoro?.isRunning ? 'Sessão em andamento' : 'Aguardando o anfitrião'}
            </span>
          </div>
        )}
      </div>

      {/* Cycle Info */}
      <div className="flex items-center gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i <= (pomodoro?.cycle % 5 || 0) 
                ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' 
                : 'bg-slate-800'
            }`} 
          />
        ))}
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-2">
          Ciclo {pomodoro?.cycle || 1}
        </span>
      </div>
    </div>
  );
};

RoomPomodoro.displayName = 'RoomPomodoro';

export default memo(RoomPomodoro);
