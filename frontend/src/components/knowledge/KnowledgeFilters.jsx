import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, Layers, Zap, Star } from 'lucide-react';

const KnowledgeFilters = ({ activeArea, onAreaChange, activeStatus, onStatusChange, stats }) => {
  const areas = [
    { id: 'todos', label: 'Todos' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'algorithms', label: 'Algoritmos' },
    { id: 'database', label: 'BD' },
    { id: 'devops', label: 'DevOps' },
    { id: 'architecture', label: 'Arquitetura' },
    { id: 'cs-fundamentals', label: 'CS' },
  ];

  const statuses = [
    { id: 'all', label: 'Todos', icon: Layers },
    { id: 'available', label: 'Disponíveis', icon: Zap },
    { id: 'learning', label: 'Em progresso', icon: Target },
    { id: 'mastered', label: 'Dominados', icon: Star },
  ];

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Area Filters */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-2 px-1 snap-x snap-mandatory">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => onAreaChange(area.id)}
            className={`relative px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap snap-start ${
              activeArea === area.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {activeArea === area.id && (
              <motion.div
                layoutId="activeAreaFilter"
                className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20"
                initial={false}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10">{area.label}</span>
          </button>
        ))}
      </div>

      {/* Status Filters & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() => onStatusChange(status.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                activeStatus === status.id
                  ? 'bg-white/10 border-indigo-500/50 text-indigo-400 shadow-xl shadow-indigo-500/10'
                  : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'
              }`}
            >
              <status.icon size={12} />
              <span>{status.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-slate-900/50 border border-white/5">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conceitos Dominados</span>
                <span className="text-sm font-black text-emerald-500 tabular-nums">{stats.mastered} de {stats.total}</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disponíveis Agora</span>
                <span className="text-sm font-black text-indigo-400 tabular-nums">{stats.available}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

KnowledgeFilters.displayName = 'KnowledgeFilters';

export default memo(KnowledgeFilters);
