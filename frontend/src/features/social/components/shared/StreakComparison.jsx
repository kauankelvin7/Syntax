/**
 * 🔥 STREAK COMPARISON PREMIUM — Syntax Theme
 * * Benchmark de uptime (ofensiva) entre instâncias (Você vs Amigo).
 * - Lógica: Intacta (Comparação determinística de valores).
 * - Design: Performance Diff Style (Verde para ganho, Rose para perda).
 */

import React, { memo } from 'react';
import { Flame, Activity } from 'lucide-react';

const StreakComparison = memo(({ myStreak = 0, friendStreak = 0, friendName = 'Dev' }) => {
  const myWinning = myStreak > friendStreak;
  const tied = myStreak === friendStreak;

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-[18px] bg-amber-500/[0.03] dark:bg-amber-500/[0.05] border border-amber-500/20 shadow-inner">
      {/* ─── Instância: Você ─── */}
      <div className={`flex items-center gap-2 ${myWinning ? 'opacity-100' : 'opacity-70'}`}>
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">You</span>
        <div className="flex items-center gap-1">
          <span className={`text-[15px] font-black ${myWinning ? 'text-amber-600 dark:text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
            {myStreak}
          </span>
          <Flame size={14} className={myWinning ? 'text-amber-500' : 'text-slate-400'} fill={myWinning ? 'currentColor' : 'none'} />
        </div>
      </div>

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 rotate-12" />

      {/* ─── Instância: Amigo ─── */}
      <div className={`flex items-center gap-2 ${!myWinning && !tied ? 'opacity-100' : 'opacity-70'} min-w-0 flex-1`}>
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[80px]">
          {friendName.split(' ')[0]}
        </span>
        <div className="flex items-center gap-1">
          <span className={`text-[15px] font-black ${!myWinning && !tied ? 'text-amber-600 dark:text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
            {friendStreak}
          </span>
          <Flame size={14} className={!myWinning && !tied ? 'text-amber-500' : 'text-slate-400'} fill={!myWinning && !tied ? 'currentColor' : 'none'} />
        </div>
      </div>

      {/* ─── Delta (Diferença) ─── */}
      <div className="ml-auto">
        {myWinning && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
              +{myStreak - friendStreak}
            </span>
          </div>
        )}
        {!myWinning && !tied && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black">
              -{friendStreak - myStreak}
            </span>
          </div>
        )}
        {tied && (
          <Activity size={14} className="text-slate-300 dark:text-slate-600" />
        )}
      </div>
    </div>
  );
});

StreakComparison.displayName = 'StreakComparison';
export default StreakComparison;