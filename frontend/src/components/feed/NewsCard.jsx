import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BookOpen, MessageSquare, Bookmark, Clock, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NewsCard = ({ article, onSave, onFlashcard, onAskAda }) => {
  const pubDate = new Date(article.pubDate);
  const timeAgo = formatDistanceToNow(pubDate, { addSuffix: true, locale: ptBR });
  
  // Estimar tempo de leitura baseado no título + descrição
  const textLength = (article.title + ' ' + article.description).length;
  const readTime = Math.max(1, Math.ceil(textLength / 500));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] overflow-hidden flex flex-col md:flex-row shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden shrink-0">
        {article.thumbnail ? (
          <img 
            src={article.thumbnail} 
            alt={article.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(article.category)} flex items-center justify-center`}>
            <span className="text-white/20 font-black text-4xl uppercase tracking-tighter select-none">
              {article.category || 'TECH'}
            </span>
          </div>
        )}
        
        {/* Recommended Badge */}
        {article.isRecommended && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-indigo-600/90 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-wider shadow-lg border border-white/10">
            Para Você
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/5">
            {article.sourceName}
          </span>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock size={10} />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <BookOpen size={10} />
            <span>{readTime} min leitura</span>
          </div>
        </div>

        <a 
          href={article.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group/title flex-1"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight mb-2 group-hover/title:text-indigo-600 dark:group-hover/title:text-indigo-400 transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {article.description?.replace(/<[^>]*>?/gm, '')}
          </p>
        </a>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSave(article)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 transition-all border border-slate-200 dark:border-white/5"
              title="Salvar para ler"
            >
              <Bookmark size={16} />
            </button>
            <button
              onClick={() => onFlashcard(article)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/10 transition-all border border-slate-200 dark:border-white/5"
              title="Criar Flashcard"
            >
              <BookOpen size={16} />
            </button>
            <button
              onClick={() => onAskAda(article)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-slate-200 dark:border-white/5"
              title="Perguntar à Ada"
            >
              <MessageSquare size={16} />
            </button>
          </div>

          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest"
          >
            Ler artigo <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

function getCategoryGradient(category) {
  const gradients = {
    frontend: 'from-cyan-500 to-blue-600',
    backend: 'from-emerald-500 to-teal-600',
    arquitetura: 'from-indigo-500 to-purple-600',
    'ia/ml': 'from-pink-500 to-rose-600',
    devops: 'from-orange-500 to-red-600',
    geral: 'from-slate-600 to-slate-800'
  };
  return gradients[category?.toLowerCase()] || gradients.geral;
}

NewsCard.displayName = 'NewsCard';

export default memo(NewsCard);
