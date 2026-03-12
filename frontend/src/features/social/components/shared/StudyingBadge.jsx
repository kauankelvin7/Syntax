/**
 * ⚡ STUDYING BADGE PREMIUM — Syntax Theme
 * * Indicador de processo ativo (Deep Work Status).
 * - Design: Status Bar Style (Cyan Neon)
 * - Contexto: Engenharia de Software / Coding Sessions
 */

import React, { memo } from 'react';
import { Terminal, Code2 } from 'lucide-react';

const pageLabels = {
  home: 'Dashboard',
  materias: 'Stacks',
  resumos: 'Docs',
  flashcards: 'Logic_Units',
  simulado: 'Test_Suites',
  'consulta-rapida': 'Snippets',
  'quadro-branco': 'Architecture',
  'atlas-3d': 'Structure_3D',
  analytics: 'Metrics',
  conquistas: 'Milestones',
  amigos: 'Network',
};

const StudyingBadge = memo(({ isStudying, currentPage }) => {
  if (!isStudying) return null;

  const label = pageLabels[currentPage] || 'Coding...';

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-[6px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
      <Code2 size={10} strokeWidth={3} className="animate-pulse" />
      <span className="opacity-80">Exec:</span>
      <span className="tracking-tight italic">{label}</span>
    </span>
  );
});

StudyingBadge.displayName = 'StudyingBadge';
export default StudyingBadge;