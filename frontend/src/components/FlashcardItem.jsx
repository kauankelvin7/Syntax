/**
 * 🎴 FLASHCARD ITEM - Card com Animação 3D Flip
 * Theme: Syntax (Software Engineering / Tech Premium)
 * * Componente individual de flashcard com efeito de virar
 * * OTIMIZAÇÕES v2.0:
 * - React.memo para evitar re-renders desnecessários
 * - useCallback para handlers estáveis
 * - Animações GPU-accelerated (transform only)
 * - Lazy loading de imagens
 */

import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, RotateCcw, ChevronLeft, Terminal } from 'lucide-react';
import OptimizedImage from './ui/OptimizedImage';

// Helper para criar fundo translúcido a partir de um HEX
const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(14, 165, 233, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16) || 14;
  const g = parseInt(hex.slice(3, 5), 16) || 165;
  const b = parseInt(hex.slice(5, 7), 16) || 233;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const FlashcardItem = memo(({ 
  flashcard, 
  onEdit, 
  onDelete,
  showActions = true 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // useCallback para evitar recriação de funções
  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    onEdit(flashcard);
  }, [onEdit, flashcard]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete(flashcard);
  }, [onDelete, flashcard]);

  const materiaColor = flashcard.materiaCor || '#0EA5E9';

  // Validações para lidar com Decks importados (Arrays) vs Flashcards simples (Strings)
  const renderPergunta = () => {
    if (typeof flashcard.pergunta === 'string') return flashcard.pergunta;
    if (flashcard.title) return flashcard.title;
    return 'Deck de Flashcards';
  };

  const renderResposta = () => {
    // Se a resposta ou o conteúdo for um Array, significa que é um Deck importado
    if (Array.isArray(flashcard.resposta) || Array.isArray(flashcard.content)) {
      const qtd = Array.isArray(flashcard.resposta) ? flashcard.resposta.length : flashcard.content.length;
      return `${qtd} cartões neste deck. Abra o "Modo Estudo" para revisá-los!`;
    }
    // Se for texto normal
    if (typeof flashcard.resposta === 'string') return flashcard.resposta;
    
    return 'Conteúdo indisponível';
  };

  return (
    <div 
      className="group perspective-1000 h-[280px] w-full cursor-pointer"
      onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-500 transform-style-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ==================== FRENTE - Pergunta ==================== */}
        <div 
          className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-[24px] p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 shadow-sm border border-slate-200/80 dark:border-slate-800/80 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
          style={{ 
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Glowing Ring Effect on Hover */}
          <div 
            className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ 
              boxShadow: `inset 0 0 0 1px ${materiaColor}`,
            }}
          />

          {/* Efeito de brilho de fundo no topo (Tech Glow) */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 opacity-[0.08] pointer-events-none"
            style={{ background: `linear-gradient(to bottom, ${materiaColor}, transparent)` }}
          />

          <div>
            <div className="flex items-start justify-between mb-5 relative z-10">
              {/* Badge da matéria (Estilo GitHub Label) */}
              <div 
                className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-sm"
                style={{ 
                  backgroundColor: hexToRgba(materiaColor, 0.1),
                  color: materiaColor,
                  border: `1px solid ${hexToRgba(materiaColor, 0.25)}`
                }}
              >
                <span className="truncate max-w-[140px]">{flashcard.materiaNome || 'Sem módulo'}</span>
              </div>

              {/* Botões de Ação com Glassmorphism */}
              {showActions && (
                <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md rounded-[12px] p-1 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  <button
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-500 transition-colors active:scale-95 shadow-sm"
                    title="Editar snippet"
                    aria-label="Editar flashcard"
                  >
                    <Edit2 size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-rose-500 transition-colors active:scale-95 shadow-sm"
                    title="Excluir"
                    aria-label="Excluir flashcard"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-4 relative z-10 tracking-tight">
              {renderPergunta()}
            </h3>

            {flashcard.tags && flashcard.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 relative z-10">
                {flashcard.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700">
                    #{tag}
                  </span>
                ))}
                {flashcard.tags.length > 3 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/40 text-slate-400">
                    +{flashcard.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-center pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
              <RotateCcw size={14} strokeWidth={2.5} /> Tap to reveal
            </p>
          </div>
        </div>

        {/* ==================== VERSO - Resposta ==================== */}
        <div 
          className="absolute inset-0 backface-hidden rounded-[24px] shadow-xl border border-slate-200/80 dark:border-slate-700/80 p-6 flex flex-col overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(145deg, var(--bg-surface) 0%, ${hexToRgba(materiaColor, 0.08)} 100%)`,
            backgroundColor: 'var(--bg-surface)' // Fallback
          }}
        >
          <div className="overflow-y-auto flex-1 custom-scrollbar pr-2">
            <h3 className="text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: materiaColor }}>
              <Terminal size={14} strokeWidth={2.5} />
              Output / Resposta
            </h3>
            
            <p className="text-[15px] sm:text-[16px] text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {renderResposta()}
            </p>

            {flashcard.imagemUrl && (
              <div className="mt-5 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900">
                <OptimizedImage 
                  src={flashcard.imagemUrl} 
                  alt="Imagem do flashcard"
                  className="w-full h-28 sm:h-32 object-contain p-2 hover:scale-105 transition-transform duration-500"
                  height={128}
                />
              </div>
            )}
          </div>

          <div className="text-center mt-4 pt-4 shrink-0 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity" style={{ color: materiaColor }}>
              <ChevronLeft size={16} strokeWidth={3} /> Return
            </p>
          </div>
        </div>

      </motion.div>

      {/* CSS para Scrollbar estilizada do verso */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
});

FlashcardItem.displayName = 'FlashcardItem';

export default FlashcardItem;