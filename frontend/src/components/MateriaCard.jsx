/**
 * 📦 MateriaCard (Módulo) - Syntax Theme Premium
 * * Card que representa um módulo de estudo (ex: React, Node, DevOps).
 * * Possui efeitos de Glassmorphism, Neon Glow em hover e haptics.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, CheckCircle2, Circle, Calendar, Terminal } from 'lucide-react';
import SafeIcon from './SafeIcon';
import { formatTimestamp } from '../utils/dateHelper';
import { hapticClick, hapticSuccess, hapticHeavy } from '../utils/haptics';

// Helper para criar fundo translúcido a partir de um HEX
const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(6, 182, 212, ${alpha})`; // Fallback para Cyan 500 do Syntax
  const r = parseInt(hex.slice(1, 3), 16) || 6;
  const g = parseInt(hex.slice(3, 5), 16) || 182;
  const b = parseInt(hex.slice(5, 7), 16) || 212;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MateriaCard = ({ materia, onEdit, onDelete, onToggleConcluida }) => {
  const isConcluida = Boolean(materia.concluida);
  const materiaColor = materia.cor || '#06b6d4'; // Fallback tech (Cyan)

  const handleToggle = (e) => {
    e.stopPropagation();
    hapticSuccess();
    onToggleConcluida?.(materia);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    hapticClick();
    onEdit(materia);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    hapticHeavy();
    onDelete(materia.id);
  };

  return (
    <motion.div
      className={`group relative bg-white dark:bg-slate-900 rounded-[24px] border transition-all duration-500 overflow-hidden ${
        isConcluida 
        ? 'border-emerald-200 dark:border-emerald-900/40 opacity-80' 
        : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, shadow: '0 25px 30px -5px rgba(0, 0, 0, 0.15)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Efeito de Ring Neon no Hover (Syntax Tech Style) */}
      {!isConcluida && (
        <div 
          className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ 
            boxShadow: `inset 0 0 0 1px ${hexToRgba(materiaColor, 0.5)}, 0 8px 30px ${hexToRgba(materiaColor, 0.15)}`,
          }}
        />
      )}

      {/* Efeito de Brilho Superior (Tech Glow) */}
      <div 
        className="absolute top-0 left-0 right-0 h-28 opacity-[0.08] pointer-events-none transition-opacity group-hover:opacity-[0.15]"
        style={{ background: `linear-gradient(to bottom, ${materiaColor}, transparent)` }}
      />

      <div className="p-6">
        {/* Header Principal */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Ícone com Background Translúcido e Borda Dinâmica */}
            <div 
              className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm border"
              style={{ 
                backgroundColor: hexToRgba(materiaColor, 0.1),
                borderColor: hexToRgba(materiaColor, 0.25)
              }}
            >
              <SafeIcon 
                name={materia.icone || materia.icon}
                size={22} 
                color={materiaColor}
                strokeWidth={2.5}
                fallbackIcon={Terminal}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-extrabold tracking-tight truncate ${
                isConcluida ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'
              }`}>
                {materia.nome}
              </h3>
              {materia.descricao ? (
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {materia.descricao}
                </p>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 mt-1 block">
                  Sem detalhes
                </span>
              )}
            </div>
          </div>

          {/* Ações Flutuantes Premium (Estilo Vercel/IDE) */}
          <div className="flex items-center gap-1.5 ml-2 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md p-1 rounded-[14px] border border-slate-200/60 dark:border-slate-700/60 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95 shadow-sm"
              title="Editar Módulo"
            >
              <Edit2 size={15} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95 shadow-sm"
              title="Excluir Módulo"
            >
              <Trash2 size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Status Badge & Meta Info */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <Calendar size={14} strokeWidth={2.5} className="text-slate-300 dark:text-slate-600" />
            {formatTimestamp(materia.createdAt)}
          </div>

          <motion.button
            onClick={handleToggle}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border-2 shadow-sm ${
              isConcluida
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isConcluida ? (
              <>
                <CheckCircle2 size={14} strokeWidth={3} />
                Concluída
              </>
            ) : (
              <>
                <Circle size={14} strokeWidth={3} />
                Concluir
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MateriaCard;