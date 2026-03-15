import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, Download, Layers, BookOpen, 
  MessageSquare, User, Clock, ChevronRight,
  ExternalLink, Zap, Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ResourceCard = ({ resource, onLike, onImport, onPreview }) => {
  const isFlashcard = resource.type === 'flashcard';
  const timestamp = resource.createdAt?.toDate ? resource.createdAt.toDate() : new Date();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-white/5 
                 overflow-hidden shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col group"
    >
      <div className="p-6 flex-1">
        {/* Header: User & Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10">
              {resource.authorAvatar ? (
                <img src={resource.authorAvatar} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                <User size={12} className="text-slate-500" />
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[100px]">
              {resource.authorName}
            </span>
          </div>
          <span className="text-[9px] font-medium text-slate-400">
            {formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            {isFlashcard ? <Layers size={14} className="text-indigo-400" /> : <BookOpen size={14} className="text-cyan-400" />}
            <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight uppercase tracking-tighter truncate">
              {resource.title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
            {resource.description || 'Nenhuma descrição fornecida.'}
          </p>
        </div>

        {/* Badges & Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-[8px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
            {resource.topic}
          </span>
          {resource.difficulty && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/5">
              {resource.difficulty}
            </span>
          )}
        </div>
        
        {/* Stats Preview */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 flex items-center justify-around">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Cards</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">{resource.itemsCount || 0}</span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/5" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aproveitamento</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-500">92%</span>
          </div>
        </div>
      </div>

      {/* Footer: Actions */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(resource.id); }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors group/btn"
          >
            <Heart size={16} className="group-hover/btn:fill-rose-500 transition-all" />
            <span className="text-xs font-bold tabular-nums">{resource.likes || 0}</span>
          </button>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Download size={16} />
            <span className="text-xs font-bold tabular-nums">{resource.downloads || 0}</span>
          </div>
        </div>

        <button 
          onClick={() => onImport(resource)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest 
                     shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Download size={14} />
          <span>Importar</span>
        </button>
      </div>
    </motion.div>
  );
};

ResourceCard.displayName = 'ResourceCard';

export default memo(ResourceCard);
