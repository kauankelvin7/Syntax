import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, Layers, Target, ExternalLink, Zap, Plus, Info } from 'lucide-react';

const ConceptPanel = ({ concept, userStatus, onStatusChange, onClose }) => {
  if (!concept) return null;

  const statusOptions = [
    { id: 'not-started', label: 'Não iniciado', color: 'bg-slate-200 dark:bg-slate-800' },
    { id: 'learning', label: 'Aprendendo', color: 'bg-amber-500 dark:bg-amber-600' },
    { id: 'mastered', label: 'Dominado', color: 'bg-emerald-500 dark:bg-emerald-600' },
    { id: 'weak', label: 'Fraco', color: 'bg-red-500 dark:bg-red-600' },
  ];

  const currentStatus = statusOptions.find(s => s.id === (userStatus || 'not-started'));

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-16 right-0 bottom-0 w-full md:w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-white/5 z-40 p-6 flex flex-col shadow-2xl"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-600/20 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20">
              {concept.area}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-white/5">
              {concept.level}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mt-2">{concept.label}</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
        <section className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed italic border-l-2 border-indigo-500/30 pl-4 py-1">
            "{concept.description}"
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Clock size={14} />
            <span>Estimativa: {concept.estimatedHours}h para domínio</span>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Target size={14} className="text-indigo-600 dark:text-indigo-500" /> Status do Aprendizado
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onStatusChange(concept.id, opt.id)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  userStatus === opt.id 
                    ? `${opt.color} text-white border-transparent shadow-lg` 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Layers size={14} className="text-cyan-600 dark:text-cyan-500" /> Seu Progresso
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Flashcards</span>
              </div>
              <span className="text-xs font-black text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">0 criados</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 group hover:border-cyan-500/30 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Layers size={18} className="text-cyan-600 dark:text-cyan-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Resumos</span>
              </div>
              <span className="text-xs font-black text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">0 salvos</span>
            </div>
          </div>
        </section>

        {concept.prerequisites?.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Info size={14} className="text-amber-600 dark:text-amber-500" /> Pré-requisitos
            </h3>
            <div className="flex flex-wrap gap-2">
              {concept.prerequisites.map(prereqId => (
                <span key={prereqId} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                  {prereqId}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 space-y-3">
        <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
          <Zap size={18} /> Estudar Agora com a Ada
        </button>
        <button className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-black uppercase tracking-tighter text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3">
          <Plus size={18} /> Criar Flashcard
        </button>
      </div>
    </motion.aside>
  );
};

ConceptPanel.displayName = 'ConceptPanel';

export default memo(ConceptPanel);
