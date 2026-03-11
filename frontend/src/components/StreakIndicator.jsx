/**
 * 🔥 STREAK INDICATOR - Componente Visual de Dias de Ofensiva
 * Theme: Syntax (Software Engineering)
 *
 * Features:
 * - Animação de fogo baseada no streak
 * - Celebração quando atinge milestones
 * - Tooltip com estatísticas (Portal safe)
 * - Cores e textos adaptados para o universo Dev
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, Award, Zap } from 'lucide-react';

const StreakIndicator = ({ 
  currentStreak = 0, 
  longestStreak = 0,
  totalLoginDays = 0,
  isAtRisk = false,
  showTooltip = true 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef(null);

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Detecta se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Captura a posição do mouse e atualiza tooltip
  const handleMouseMove = (e) => {
    if (!isMobile) {
      // Desktop: tooltip segue o mouse com offset
      setTooltipPosition({
        top: e.clientY + 15,
        left: e.clientX + 15
      });
    }
  };

  // Atualiza posição inicial do tooltip
  const updateTooltipPosition = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      
      // Sempre posiciona o tooltip à esquerda do card, para evitar corte
      const tooltipWidth = 256;
      const spacing = 24;
      let left = rect.left - tooltipWidth - spacing;
      // Garante que não fique fora da tela
      if (left < 16) left = 16;
      setTooltipPosition({
        top: rect.top,
        left
      });
    }
  };

  // Cor baseada no streak
  const getStreakColor = () => {
    if (currentStreak === 0) return 'gray';
    if (currentStreak < 7) return 'orange';
    if (currentStreak < 30) return 'red';
    if (currentStreak < 100) return 'purple';
    return 'blue'; // Lendário 100+
  };

  const color = getStreakColor();

  const colorClasses = {
    gray: {
      gradient: 'from-slate-400 to-slate-500',
      shadow: 'shadow-slate-500/25',
      text: 'text-slate-500 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800'
    },
    orange: {
      gradient: 'from-orange-400 to-amber-500',
      shadow: 'shadow-orange-500/25',
      text: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/30'
    },
    red: {
      gradient: 'from-rose-400 to-orange-500',
      shadow: 'shadow-rose-500/25',
      text: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/30'
    },
    purple: {
      gradient: 'from-violet-400 to-fuchsia-500',
      shadow: 'shadow-violet-500/25',
      text: 'text-violet-500 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/30'
    },
    blue: {
      gradient: 'from-indigo-500 to-cyan-500', // Cores Syntax Theme
      shadow: 'shadow-cyan-500/30',
      text: 'text-cyan-500',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30'
    }
  };

  const classes = colorClasses[color];

  // Milestone messages
  const getMilestoneMessage = () => {
    if (currentStreak === 0) return 'Inicie seu primeiro deploy!';
    if (currentStreak === 1) return 'Primeiro dia! 🎉';
    if (currentStreak === 7) return 'Uma semana invicto! 🌟';
    if (currentStreak === 30) return 'Um mês focado! 🏆';
    if (currentStreak === 100) return 'SENIORITY! 👑';
    if (currentStreak === 365) return 'ONE YEAR STREAK! 🎊';
    return `${currentStreak} dias seguidos!`;
  };

  useEffect(() => {
    if (showDetails) {
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition);
      window.addEventListener('resize', updateTooltipPosition);
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showDetails]);

  return (
    <div className="relative">
      <motion.div
        ref={cardRef}
        className="relative cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => {
          if (showTooltip && !isMobile) {
            setShowDetails(true);
            updateTooltipPosition();
          }
        }}
        onClick={(e) => {
          if (showTooltip && isMobile) {
            e.preventDefault();
            e.stopPropagation();
            setShowDetails(true);
            updateTooltipPosition();
            // Em mobile, fecha após 4 segundos
            setTimeout(() => setShowDetails(false), 4000);
          }
        }}
        onTouchEnd={(e) => {
          if (showTooltip && isMobile) {
            e.preventDefault();
            setShowDetails(true);
            updateTooltipPosition();
            // Em mobile, fecha após 4 segundos
            setTimeout(() => setShowDetails(false), 4000);
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (!isMobile) {
            setShowDetails(false);
          }
        }}
      >
        {/* Ícone Principal */}
        <motion.div 
          className={`w-14 h-14 rounded-2xl ${classes.bg} flex items-center justify-center flex-shrink-0 relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50`}
          animate={currentStreak > 0 ? {
            boxShadow: [
              `0 10px 30px -10px rgba(251, 146, 60, 0.3)`,
              `0 10px 40px -10px rgba(251, 146, 60, 0.5)`,
              `0 10px 30px -10px rgba(251, 146, 60, 0.3)`
            ]
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            animate={currentStreak > 0 ? {
              rotate: [-5, 5, -5],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Flame size={28} strokeWidth={2} className={classes.text} />
          </motion.div>

          {/* Badge de milestone */}
          {currentStreak >= 100 && (
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-md flex items-center justify-center shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <Award size={12} className="text-yellow-900" />
            </motion.div>
          )}
        </motion.div>

        {/* Aviso de risco (Risco de perder a ofensiva) */}
        {isAtRisk && (
          <motion.div
            className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap size={10} className="text-white" fill="white" />
          </motion.div>
        )}
      </motion.div>

      {/* Tooltip com estatísticas - Renderizado via Portal */}
      {showDetails && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed w-64 max-w-[calc(100vw-3rem)] z-[9999]"
            style={{ 
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: 'none',
              zIndex: 9999,
              maxWidth: 'calc(100vw - 3rem)',
            }}
          >
            <div className={`bg-white dark:bg-slate-800 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-700 p-4`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Flame className={classes.text} size={20} />
                  <h3 className="font-extrabold text-slate-900 dark:text-white">Streak Diário</h3>
                </div>
                <div className="flex items-center gap-1">
                  {isMobile && (
                    <button
                      onClick={() => setShowDetails(false)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {/* Streak Atual */}
                <div className={`${classes.bg} rounded-[14px] p-3 border border-slate-200/50 dark:border-slate-700/50 shadow-inner`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sequência Atual</span>
                    <Flame className={classes.text} size={16} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentStreak} <span className="text-[14px] text-slate-500 font-bold">{currentStreak === 1 ? 'dia' : 'dias'}</span>
                  </p>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {getMilestoneMessage()}
                  </p>
                </div>

                {/* Recorde */}
                {longestStreak > 0 && (
                  <div className="flex items-center justify-between text-sm px-1 pt-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">Max Streak</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">
                      {longestStreak} <span className="font-medium text-slate-500">{longestStreak === 1 ? 'dia' : 'dias'}</span>
                    </span>
                  </div>
                )}

                {/* Total de logins */}
                {totalLoginDays > 0 && (
                  <div className="flex items-center justify-between text-sm px-1 pb-1">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-cyan-500 dark:text-cyan-400" />
                      <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">Total de Commits</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white">{totalLoginDays}</span>
                  </div>
                )}

                {/* Aviso */}
                {isAtRisk && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-[12px] p-2.5 mt-2"
                  >
                    <div className="flex items-start gap-2">
                      <Zap size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[12px] text-rose-700 dark:text-rose-300 font-bold leading-tight">
                        Faça login amanhã para não perder sua sequência!
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Dica Start */}
                {currentStreak === 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-[12px] p-2.5">
                    <div className="flex items-start gap-2">
                      <p className="text-[12px] text-indigo-700 dark:text-indigo-300 font-medium leading-tight">
                        Faça login todos os dias para construir sua sequência de estudos!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Seta apontando para o ícone principal */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-slate-700 rotate-45 pointer-events-none" />
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default StreakIndicator;