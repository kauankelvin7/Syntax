import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Star, BookOpen, AlertCircle, Circle } from 'lucide-react';

const ConceptNode = ({ data }) => {
  const { label, area, status, isAvailable } = data;

  const areaStyles = {
    frontend: 'bg-cyan-50 dark:bg-cyan-900/40 border-cyan-200 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-200',
    backend: 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200',
    algorithms: 'bg-violet-50 dark:bg-violet-900/40 border-violet-200 dark:border-violet-500/40 text-violet-700 dark:text-violet-200',
    database: 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-200',
    devops: 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-200',
    architecture: 'bg-rose-50 dark:bg-rose-900/40 border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-200',
    'cs-fundamentals': 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200',
  };

  const statusIcons = {
    mastered: <Star size={12} className="text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />,
    learning: <BookOpen size={12} className="text-amber-600 dark:text-amber-400" />,
    weak: <AlertCircle size={12} className="text-red-600 dark:text-red-400" />,
    'not-started': <Circle size={12} className="text-slate-400 dark:text-slate-500" />,
  };

  const glowStyles = status === 'mastered' ? `shadow-[0_0_15px_rgba(16,185,129,0.2)]` : '';
  const pulseClass = isAvailable && status !== 'mastered' ? 'animate-pulse border-indigo-500/60 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : '';

  return (
    <div className={`px-4 py-3 rounded-xl border transition-all duration-300 w-[160px] h-[64px] flex flex-col justify-center relative ${areaStyles[area] || areaStyles['cs-fundamentals']} ${glowStyles} ${pulseClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-200 dark:!bg-slate-700 !border-slate-300 dark:!border-slate-600" />
      
      <div className="absolute top-2 right-2">
        {statusIcons[status || 'not-started']}
      </div>

      <span className="text-xs font-black uppercase tracking-tighter leading-tight pr-4">
        {label}
      </span>
      
      <div className="mt-1 flex gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${area === 'frontend' ? 'bg-cyan-500' : area === 'backend' ? 'bg-indigo-500' : 'bg-slate-500'}`} />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-200 dark:!bg-slate-700 !border-slate-300 dark:!border-slate-600" />
    </div>
  );
};

ConceptNode.displayName = 'ConceptNode';

export default memo(ConceptNode);
