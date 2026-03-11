/**
 * 🏷️ TagInput Premium — Componente reutilizável para adicionar/remover tags
 * Theme: Syntax (Software Engineering)
 * * Props:
 * - tags: string[] — lista de tags atuais
 * - onChange: (tags: string[]) => void — callback quando tags mudam
 * - placeholder?: string
 * - maxTags?: number (default 5)
 * - suggestions?: string[] — sugestões ao digitar
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Hash } from 'lucide-react';

// Cores baseadas em syntax highlighting de código (Theme Syntax)
const PRESET_COLORS = [
  'bg-cyan-50 text-cyan-700 border-cyan-200/50 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800/50',
  'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50',
  'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
  'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
  'bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/50',
  'bg-violet-50 text-violet-700 border-violet-200/50 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/50',
];

const getTagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRESET_COLORS[Math.abs(hash) % PRESET_COLORS.length];
};

export default function TagInput({ 
  tags = [], 
  onChange, 
  placeholder = 'Adicionar nova tag...', 
  maxTags = 5, 
  suggestions = [] 
}) {
  // Estado interno para feedback visual imediato — não depende do round-trip do pai
  const [localTags, setLocalTags] = useState(tags);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  // Ref para rastrear a última versão que nós mesmos enviamos ao pai, evitando loop de sync
  const ownUpdateRef = useRef(false);

  // Sincroniza do pai apenas quando a mudança vier de fora (ex: resetForm, handleEdit)
  useEffect(() => {
    if (ownUpdateRef.current) {
      ownUpdateRef.current = false;
      return;
    }
    setLocalTags(tags);
  }, [tags]);

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !localTags.includes(s)
  ).slice(0, 5);

  const notify = (newTags) => {
    ownUpdateRef.current = true;
    onChange?.(newTags);
  };

  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || localTags.includes(trimmed) || localTags.length >= maxTags) return;
    const newTags = [...localTags, trimmed];
    setLocalTags(newTags);
    notify(newTags);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    const newTags = localTags.filter(t => t !== tagToRemove);
    setLocalTags(newTags);
    notify(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation(); // impede submissão do formulário pai
      addTag(input);
      return;
    }
    if (e.key === 'Backspace' && !input && localTags.length > 0) {
      removeTag(localTags[localTags.length - 1]);
    }
  };

  const handleBlur = () => {
    // Confirma a tag ao sair do campo (clicar fora ou Tab)
    if (input.trim()) addTag(input);
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-[16px] border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 min-h-[52px] focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-500/10 transition-all shadow-inner">
        {localTags.map(tag => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-mono font-bold border ${getTagColor(tag)}`}
          >
            <span className="opacity-50">#</span>{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-black/10 dark:hover:bg-white/20 p-0.5 rounded-sm transition-colors ml-1"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </span>
        ))}
        {localTags.length < maxTags && (
          <div className="flex-1 flex items-center min-w-[120px]">
            {localTags.length === 0 && (
              <Hash size={14} className="text-slate-400 ml-2 mr-1" strokeWidth={2.5} />
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => input && setShowSuggestions(true)}
              onBlur={handleBlur}
              placeholder={localTags.length === 0 ? placeholder : 'Nova tag...'}
              className="flex-1 w-full bg-transparent outline-none text-[13px] font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 px-1"
            />
          </div>
        )}
      </div>
      
      {localTags.length < maxTags && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2 ml-1">
          {localTags.length}/{maxTags} tags usadas <span className="mx-1">&middot;</span> Tecle Enter ou ',' para adicionar
        </p>
      )}

      {/* Suggestions dropdown (Command Palette Style) */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] shadow-xl z-20 overflow-hidden py-1">
          {filteredSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Hash size={14} className="opacity-50" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}