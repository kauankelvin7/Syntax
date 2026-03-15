import React from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, Star, GitBranch, ChevronRight,
  ShieldCheck, Zap, Activity
} from 'lucide-react';

const RepoCard = ({ repo, onSelect, analysis }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onSelect(repo)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-6 cursor-pointer hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl"
    >
      {analysis && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest z-10">
          <ShieldCheck size={10} />
          Analisado
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
          <Folder size={24} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <Star size={12} className="text-amber-500" />
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <GitBranch size={12} className="text-indigo-600 dark:text-indigo-400" />
            <span>{repo.forks_count}</span>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {repo.name}
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
        {repo.description || 'Sem descrição disponível.'}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase border border-slate-200 dark:border-white/5">
                {repo.language || 'Mixed'}
            </span>
            {analysis && (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <Zap size={10} />
                    <span>Score: {analysis.score}</span>
                </div>
            )}
        </div>
        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
          <span>{analysis ? 'Ver Detalhes' : 'Analisar'}</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
};

export default RepoCard;
