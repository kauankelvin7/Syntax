/**
 * FeedFilters.jsx
 * Filtros do feed com tema claro/escuro, ícones e contadores por categoria.
 */

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, User, Layout, Server, Layers,
  Brain, Settings, Briefcase, Flame,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'todos',        label: 'Todos',        icon: Globe,     color: '#6366f1' },
  { id: 'para voce',   label: 'Para Você',    icon: User,      color: '#06b6d4' },
  { id: 'frontend',    label: 'Frontend',     icon: Layout,    color: '#f59e0b' },
  { id: 'backend',     label: 'Backend',      icon: Server,    color: '#10b981' },
  { id: 'arquitetura', label: 'Arquitetura',  icon: Layers,    color: '#8b5cf6' },
  { id: 'geral',       label: 'Tech',         icon: Flame,     color: '#ef4444' },
  { id: 'devops',      label: 'DevOps',       icon: Settings,  color: '#0ea5e9' },
  { id: 'carreira',    label: 'Carreira',     icon: Briefcase, color: '#f97316' },
];

const FeedFilters = ({ activeCategory, onCategoryChange, articles = [] }) => {
  // Conta artigos por categoria para exibir badges
  const counts = useMemo(() => {
    const map = { todos: articles.length, 'para voce': 0 };
    articles.forEach(a => {
      const cat = a.category?.toLowerCase();
      if (cat) map[cat] = (map[cat] || 0) + 1;
      if (a.isRecommended) map['para voce'] = (map['para voce'] || 0) + 1;
    });
    return map;
  }, [articles]);

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        const count    = counts[cat.id] ?? 0;
        const Icon     = cat.icon;

        // Não mostrar categoria se não tiver artigos (exceto "todos" e "para você")
        if (count === 0 && cat.id !== 'todos' && cat.id !== 'para voce') return null;

        return (
          <motion.button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`
              relative shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl
              text-xs font-bold transition-colors whitespace-nowrap
              min-h-[36px] select-none
              ${isActive
                ? 'text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5'
              }
            `}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background animado do filtro ativo */}
            {isActive && (
              <motion.div
                layoutId="activeFeedFilter"
                className="absolute inset-0 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${cat.color}ee, ${cat.color}bb)`,
                  boxShadow:  `0 4px 16px ${cat.color}40`,
                }}
                initial={false}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              <Icon
                size={13}
                style={{ color: isActive ? '#fff' : cat.color }}
                strokeWidth={2.5}
              />
              <span>{cat.label}</span>
              {/* Badge de contagem */}
              {count > 0 && (
                <span
                  className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px]
                    rounded-full text-[10px] font-black px-1
                    ${isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

FeedFilters.displayName = 'FeedFilters';
export default memo(FeedFilters);