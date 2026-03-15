import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink, Plus, BookOpen } from 'lucide-react';

function BookCover({ book }) {
  const [imgError, setImgError] = useState(false);

  const palette = {
    'Algoritmos':     { bg: '#1e1b4b', accent: '#818cf8', emoji: '⚡' },
    'Arquitetura':    { bg: '#0c1a2e', accent: '#06b6d4', emoji: '🏗️' },
    'Frontend':       { bg: '#1a0e2e', accent: '#a78bfa', emoji: '🎨' },
    'Backend':        { bg: '#0a1f1a', accent: '#34d399', emoji: '⚙️' },
    'Carreira':       { bg: '#1f1505', accent: '#fbbf24', emoji: '🚀' },
    'Soft Skills':    { bg: '#1f0a1a', accent: '#f472b6', emoji: '🧠' },
    'DevOps':         { bg: '#0a1a0a', accent: '#4ade80', emoji: '🔧' },
    'Banco de Dados': { bg: '#0f1729', accent: '#60a5fa', emoji: '🗄️' },
  };

  const colors = palette[book.category] ??
    { bg: '#0f172a', accent: '#6366f1', emoji: '📚' };

  if (book.cover && !imgError) {
    return (
      <img src={book.cover} alt={book.title} loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center
                    justify-center p-4 text-center select-none transition-all duration-300 group-hover:scale-110"
      style={{ backgroundColor: colors.bg }}>
      <span className="text-4xl mb-3">{colors.emoji}</span>
      <p className="text-[11px] font-bold leading-tight mb-1.5 line-clamp-3"
        style={{ color: colors.accent }}>{book.title}</p>
      <p className="text-[9px] opacity-60 line-clamp-2"
        style={{ color: colors.accent }}>{book.author}</p>
      {book.year && (
        <p className="text-[9px] mt-2 opacity-40 font-mono"
          style={{ color: colors.accent }}>{book.year}</p>
      )}
    </div>
  );
}

const BookCard = ({ book, onAddToList }) => {
  const difficultyColors = {
    'Iniciante': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'Intermediário': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'Avançado': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex gap-4 shadow-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300"
    >
      {/* Cover */}
      <div className="w-24 h-32 shrink-0 rounded-lg overflow-hidden shadow-2xl relative group">
        <BookCover book={book} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <ExternalLink size={20} className="text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${difficultyColors[book.difficulty] || difficultyColors.Iniciante}`}>
              {book.difficulty}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
              <Star size={10} fill="currentColor" />
              <span>{book.rating.toFixed(1)}</span>
            </div>
          </div>
          
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1 truncate">
            {book.title}
          </h4>
          <p className="text-[10px] text-slate-500 mb-2 truncate">
            {book.author} • {book.year}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {book.topics?.slice(0, 2).map((topic, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[8px] text-slate-500 dark:text-slate-400 font-medium">
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={book.amazonUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-[10px] font-bold text-white shadow-lg shadow-indigo-500/10"
          >
            <ExternalLink size={10} />
            Amazon
          </a>
          <button 
            onClick={() => onAddToList(book)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-white/5"
            title="Adicionar à lista de leitura"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

BookCard.displayName = 'BookCard';

export default memo(BookCard);
