import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Download, Layers, BookOpen, User, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ResourceCard = ({ resource, onLike, onImport, onDelete, currentUserId }) => {
  const isFlashcard = resource.type === 'flashcard';
  const isAuthor    = !!currentUserId && resource.authorId === currentUserId;
  const timestamp   = resource.createdAt?.toDate ? resource.createdAt.toDate() : new Date();

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col group relative"
    >
      {/* Faixa colorida */}
      <div className={`h-1 ${isFlashcard ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-cyan-500 to-teal-500'}`} />

      {/* Botão deletar — sempre visível para o autor */}
      {isAuthor && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(resource); }}
          title="Remover da biblioteca"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl
                     bg-rose-500/10 border border-rose-500/20 text-rose-500
                     flex items-center justify-center
                     hover:bg-rose-500 hover:text-white
                     transition-all duration-200"
        >
          <Trash2 size={13} />
        </button>
      )}

      <div className="p-6 flex-1">
        {/* Autor + tempo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
              {resource.authorAvatar
                ? <img src={resource.authorAvatar} className="w-full h-full object-cover" alt="" />
                : <User size={12} className="text-slate-500" />
              }
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[100px]">
              {resource.authorName || 'Anônimo'}
            </span>
            {isAuthor && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-[8px] font-black text-cyan-500 uppercase border border-cyan-500/20">
                Você
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium text-slate-400 shrink-0 ml-2">
            {formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        {/* Título */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            {isFlashcard
              ? <Layers size={14} className="text-indigo-400 shrink-0" />
              : <BookOpen size={14} className="text-cyan-400 shrink-0" />
            }
            <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight uppercase tracking-tighter line-clamp-1">
              {resource.title}
            </h3>
          </div>
          
          {/* AQUI FOI FEITA A CORREÇÃO DA DESCRIÇÃO/CONTEÚDO */}
          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
            {resource.description
              ? resource.description
              : isFlashcard && Array.isArray(resource.content)
                ? `${resource.content.length} cartões disponíveis neste deck.`
                : typeof resource.content === 'string'
                  ? `${resource.content.substring(0, 100)}...`
                  : 'Nenhuma descrição fornecida.'}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
            isFlashcard
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
              : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20'
          }`}>
            {isFlashcard ? 'Flashcard' : 'Resumo'}
          </span>
          {resource.topic && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/5">
              {resource.topic}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 flex items-center justify-around">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Curtidas</span>
            <span className="text-xs font-black text-rose-500">{resource.likes || 0}</span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/5" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Importações</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-500">{resource.downloads || 0}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors group/btn"
        >
          <Heart size={16} className="group-hover/btn:fill-rose-500 transition-all" />
          <span className="text-xs font-bold tabular-nums">{resource.likes || 0}</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onImport(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Download size={13} />
          <span>Importar</span>
        </button>
      </div>
    </motion.div>
  );
};

ResourceCard.displayName = 'ResourceCard';

export default memo(ResourceCard);