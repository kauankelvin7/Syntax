/**
 * 📦 SHARE CONTENT PREMIUM — Syntax Theme
 * * Card de ativos compartilhados no fluxo de dados (Chat/Squad).
 * - Tipos: Documentation (Resumos) & Stack (Flashcards).
 * - Design: File Block Geometry com tags de indexação tática.
 */

import React, { memo } from 'react';
import { FileCode, Layers, ExternalLink, Terminal } from 'lucide-react';

const ShareContent = memo(({ content, onOpen }) => {
  if (!content) return null;

  const isResumo = content.type === 'resumo';

  return (
    <div
      className={`
        group relative rounded-[18px] p-4 cursor-pointer transition-all duration-300
        border-2 shadow-sm active:scale-[0.98]
        ${isResumo
          ? 'bg-cyan-50/30 dark:bg-cyan-950/20 border-cyan-100/50 dark:border-cyan-800/40 hover:border-cyan-400 dark:hover:border-cyan-500/60 hover:shadow-cyan-500/10'
          : 'bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-800/40 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-indigo-500/10'
        }
      `}
      onClick={() => onOpen?.(content)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(content)}
    >
      <div className="flex items-start gap-3.5">
        {/* Ícone de Ativo (Terminal Style) */}
        <div className={`
          w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110
          ${isResumo 
            ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 shadow-sm' 
            : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-sm'}
        `}>
          {isResumo
            ? <FileCode size={20} strokeWidth={2.5} />
            : <Layers size={20} strokeWidth={2.5} />
          }
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isResumo ? 'text-cyan-600 dark:text-cyan-500' : 'text-indigo-600 dark:text-indigo-500'}`}>
              {isResumo ? 'Docs_File' : 'Stack_Lib'}
            </span>
          </div>
          
          <p className="text-[14px] font-black text-slate-800 dark:text-slate-100 truncate tracking-tight">
            {content.title || content.deckName || 'Untitled_Asset'}
          </p>

          {content.preview && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed font-medium">
              {content.preview}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            {content.materia && (
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black px-2 py-1 rounded-[6px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                <Terminal size={10} />
                {content.materia}
              </span>
            )}
          </div>
        </div>

        {/* Botão de Link Estilo Code */}
        <div className={`
          text-[10px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1
          ${isResumo ? 'text-cyan-500' : 'text-indigo-500'}
        `}>
          Execute <ExternalLink size={12} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
});

ShareContent.displayName = 'ShareContent';
export default ShareContent;