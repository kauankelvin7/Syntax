import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';

const CareerSelector = ({ roadmaps, onSelect, userProgress }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roadmaps.map((roadmap) => {
        const progress = userProgress[roadmap.id]?.overallProgress || 0;
        
        return (
          <motion.div
            key={roadmap.id}
            onClick={() => onSelect(roadmap)}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-8 cursor-pointer overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl"
          >
            {/* Background Gradient */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at top right, ${roadmap.color}, transparent)` }}
            />

            <div className="relative z-10 flex flex-col h-full">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-2xl border border-slate-200 dark:border-white/10"
                style={{ background: `linear-gradient(135deg, ${roadmap.color}20, ${roadmap.color}40)` }}
              >
                {roadmap.icon}
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {roadmap.title}
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                {roadmap.description}
              </p>

              <div className="mt-auto space-y-6">
                <div className="flex items-center gap-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600 dark:text-indigo-500" />
                    <span>~{roadmap.estimatedMonths} meses</span>
                  </div>
                  <div className="w-px h-3 bg-slate-200 dark:bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-indigo-600 dark:text-indigo-400">{roadmap.phases.length}</span>
                    <span>Fases</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Progresso</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Explorar trilha <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

CareerSelector.displayName = 'CareerSelector';

export default memo(CareerSelector);
