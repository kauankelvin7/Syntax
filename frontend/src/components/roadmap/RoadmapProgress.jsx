import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Map, Zap, Clock, ChevronRight, MessageSquare, Target, Trophy } from 'lucide-react';

const RoadmapProgress = ({ roadmap, progress, onBack, onAskAda }) => {
  const completedCount = progress?.completedCount || 0;
  const totalCount = progress?.totalCount || 0;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingMonths = progress?.remainingMonths || 0;

  return (
    <header className="sticky top-16 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-6 px-6 -mx-6 mb-10 shadow-sm dark:shadow-2xl">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Side: Title & Info */}
        <div className="flex items-start gap-6">
          <button 
            onClick={onBack}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 group"
          >
            <ChevronRight size={20} className="rotate-180 transition-transform group-hover:-translate-x-1" />
          </button>
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border border-slate-200 dark:border-white/10"
                style={{ background: `linear-gradient(135deg, ${roadmap.color}20, ${roadmap.color}40)` }}
              >
                {roadmap.icon}
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                {roadmap.title}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
              <div className="flex items-center gap-1.5">
                <Target size={12} className="text-indigo-600 dark:text-indigo-500" />
                <span>{completedCount} de {totalCount} tópicos completos</span>
              </div>
              <div className="w-px h-3 bg-slate-200 dark:bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-cyan-600 dark:text-cyan-500" />
                <span>~{remainingMonths} meses restantes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Progress Bar */}
        <div className="flex-1 max-w-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                <span className="text-slate-500">Seu Progresso Geral</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">{percent}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 italic px-1">
                <span>{percent < 25 ? 'Começando a jornada...' : percent < 50 ? 'Ganhando tração!' : percent < 80 ? 'Quase um expert!' : 'Pronto para o mercado!'}</span>
                {percent >= 90 && <Trophy size={14} className="text-amber-500 animate-bounce" />}
            </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
            <button 
                onClick={onAskAda}
                className="flex items-center gap-3 px-6 py-4 rounded-[18px] bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all group"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-white rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
                    <Zap size={18} className="relative" />
                </div>
                <span>Ada: Próximo Passo?</span>
            </button>
        </div>
      </div>
    </header>
  );
};

RoadmapProgress.displayName = 'RoadmapProgress';

export default memo(RoadmapProgress);
