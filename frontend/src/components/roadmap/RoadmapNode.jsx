import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Layers, Zap, BookOpen, ExternalLink, MessageSquare, ChevronRight } from 'lucide-react';

const RoadmapNode = ({ node, status, onStatusChange, userContent }) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';
  const isNotStarted = !status || status === 'not-started';

  const statusStyles = {
    completed: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
    'in-progress': 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
    'not-started': 'border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 text-slate-500 hover:border-slate-300 dark:hover:border-white/20',
  };

  const nodeStatus = isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'not-started';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative group p-5 rounded-[22px] border transition-all duration-300 w-full md:w-[240px] flex flex-col gap-4 shadow-sm hover:shadow-xl ${statusStyles[nodeStatus]}`}
    >
      {/* Node Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
              node.type === 'required' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-500'
            }`}>
              {node.type}
            </span>
            {node.type === 'alternative' && (
                <span className="px-1.5 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 text-[8px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                    Alternativa
                </span>
            )}
          </div>
          <h4 className={`text-sm font-black uppercase tracking-tighter mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-200'}`}>
            {node.title}
          </h4>
        </div>
        
        <div className="shrink-0">
          {isCompleted ? <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> : <Circle size={18} className="text-slate-300 dark:text-slate-700" />}
        </div>
      </div>

      <p className="text-[10px] font-medium text-slate-600 dark:text-slate-500 leading-relaxed line-clamp-2">
        {node.description}
      </p>

      {/* User Content & Time */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <Layers size={12} className="text-indigo-600 dark:text-indigo-500" />
            <span>{userContent?.flashcards || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <BookOpen size={12} className="text-cyan-600 dark:text-cyan-500" />
            <span>{userContent?.resumos || 0}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
          <Clock size={10} />
          <span>{node.estimatedWeeks} sem</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => onStatusChange(node.id, isCompleted ? 'not-started' : 'completed')}
          className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            isCompleted 
              ? 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-emerald-600 hover:text-white border border-slate-200 dark:border-transparent'
          }`}
        >
          {isCompleted ? 'Concluído' : 'Concluir'}
        </button>
        <button
          onClick={() => onStatusChange(node.id, isInProgress ? 'not-started' : 'in-progress')}
          className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            isInProgress 
              ? 'bg-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-amber-600 hover:text-white border border-slate-200 dark:border-transparent'
          }`}
        >
          {isInProgress ? 'Estudando' : 'Iniciar'}
        </button>
      </div>

      {/* Details (Mobile/Hover) */}
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 z-10 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0 shadow-2xl">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"><Zap size={14} /></div>
                <div className="flex-1">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Ada Insight</span>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Este tópico é fundamental para {node.title}.</span>
                </div>
            </div>
            
            <div className="space-y-2">
                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Recursos Recomendados</span>
                {node.resources?.map((res, i) => (
                    <a key={i} href={res} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                        <ExternalLink size={10} /> MDN / Documentação Oficial
                    </a>
                ))}
            </div>

            <button className="w-full py-2 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <MessageSquare size={12} /> Pedir Ajuda à Ada
            </button>
        </div>
      </div>
    </motion.div>
  );
};

RoadmapNode.displayName = 'RoadmapNode';

export default memo(RoadmapNode);
