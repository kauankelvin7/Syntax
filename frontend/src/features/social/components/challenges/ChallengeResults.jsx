/**
 * 🏆 CHALLENGE RESULTS
 * * Tela de recompensa gamificada (Code Battle) com física de partículas.
 * - Dynamic Backgrounds baseados no resultado (Vitória/Derrota)
 * - Scoreboard estilo Hacker/E-sports com alto contraste
 * - Confetti otimizado com cores da nossa paleta Dev
 */

import React, { memo, useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Clock, Target, ArrowLeft, Star, Zap, Crown, Terminal } from 'lucide-react';
import { Z } from '../../../../constants/zIndex';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { calculateScore, averageResponseTime, getResultData } from '../../utils/challengeHelpers';

/**
 * 🎊 Confetti Premium (Tech Colors)
 */
const SimpleConfetti = () => {
  // Cores da paleta Syntax
  const colors = ['#06b6d4', '#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 0.8,
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 8,
    duration: 2 + Math.random() * 2.5
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: Z.modal + 1 }}>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: -20,
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 2.5), // Mistura de quadrados e retângulos (estilo "bits")
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.2 ? '2px' : '50%', 
            boxShadow: `0 0 10px ${p.color}80` // Glow tech
          }}
          initial={{ y: -20, rotate: 0, opacity: 1, scale: 0 }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 360,
            opacity: [0, 1, 1, 0],
            scale: 1
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94] // Curva de gravidade suave
          }}
        />
      ))}
    </div>
  );
};

const ChallengeResults = memo(({ challenge, currentUserId, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  const results = useMemo(() => {
    if (!challenge) return null;
    return getResultData(challenge, currentUserId);
  }, [challenge, currentUserId]);

  useEffect(() => {
    if (results?.isWinner) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 5000); // Confetti dura um pouco mais
      return () => clearTimeout(t);
    }
  }, [results?.isWinner]);

  if (!results || !challenge) {
    return (
      <div className="fixed inset-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center" style={{ zIndex: Z.modal }}>
        <Loader2 size={36} className="text-cyan-500 animate-spin mb-4" strokeWidth={2.5} />
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Compilando resultados...</p>
      </div>
    );
  }

  const { isWinner, isDraw, myScore, opponentScore, myCorrect, opponentCorrect, totalQ, myAvgTime, opponentAvgTime, opponentName, opponentPhoto } = results;

  // Animações de Cascata
  const containerVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  // Dinâmica de Cores baseada no resultado (Dark Tech Vibes)
  const bgGradient = isWinner 
    ? 'from-emerald-500/20 via-slate-50 to-cyan-500/10 dark:from-emerald-900/30 dark:via-slate-950 dark:to-cyan-900/20' 
    : isDraw 
      ? 'from-amber-500/20 via-slate-50 to-orange-500/10 dark:from-amber-900/30 dark:via-slate-950 dark:to-orange-900/20'
      : 'from-rose-500/20 via-slate-50 to-red-500/10 dark:from-rose-900/30 dark:via-slate-950 dark:to-red-900/20';

  const headlineColor = isWinner ? 'text-emerald-600 dark:text-emerald-400' : isDraw ? 'text-amber-500' : 'text-rose-600 dark:text-rose-500';
  const headlineText = isWinner ? 'Build Successful!' : isDraw ? 'Merge Conflict!' : 'Build Failed!';
  
  const headlineIcon = isWinner 
    ? <Crown size={64} className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" strokeWidth={2} />
    : isDraw 
      ? <Medal size={64} className="text-amber-500 opacity-90 drop-shadow-md" strokeWidth={2} />
      : <Terminal size={64} className="text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" strokeWidth={2} />;

  return (
    <motion.div
      className={`fixed inset-0 z-[110] bg-gradient-to-b ${bgGradient} flex flex-col items-center overflow-y-auto pt-10 sm:pt-16 pb-10`}
      variants={containerVariant}
      initial="hidden"
      animate="visible"
    >
      {/* Pattern de Fundo (Grade Tech) */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

      {showConfetti && <SimpleConfetti />}

      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* ─── Header de Resultado ─── */}
        <motion.div variants={itemVariant} className="text-center mb-10">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto mb-5 flex justify-center"
          >
            <div className="relative">
              {isWinner && <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-40 rounded-full" />}
              <div className="relative">{headlineIcon}</div>
            </div>
          </motion.div>
          <h1 className={`text-[32px] font-black tracking-tight ${headlineColor} uppercase`}>
            {headlineText}
          </h1>
          {isWinner && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-[15px] font-bold text-slate-600 dark:text-slate-300 mt-2">
              Seu código rodou de primeira! 🎉
            </motion.p>
          )}
          {isDraw && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-[15px] font-bold text-slate-600 dark:text-slate-300 mt-2">
              Empate! Resolva esse conflito depois. 🤝
            </motion.p>
          )}
          {!isWinner && !isDraw && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-[15px] font-bold text-slate-600 dark:text-slate-300 mt-2">
              Deu bug no deploy. Estude e tente novamente! 🐛
            </motion.p>
          )}
        </motion.div>

        {/* ─── Scoreboard (Placar Tech) ─── */}
        <motion.div variants={itemVariant} className="relative bg-white dark:bg-slate-900/90 backdrop-blur-xl rounded-[32px] p-6 mb-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
            Scoreboard
          </div>
          
          <div className="flex items-center justify-between mt-4">
            {/* Você */}
            <div className="text-center flex-1 relative">
              {isWinner && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-emerald-500 animate-bounce"><Crown size={22} strokeWidth={2.5} /></div>}
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 border-4 shadow-inner ${isWinner ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'}`}>
                <span className={`text-[32px] font-black ${isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{myCorrect}</span>
              </div>
              <p className="text-[14px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Você</p>
            </div>

            {/* Divisor VS */}
            <div className="px-2 flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-[14px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center rotate-45 mb-2 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className="text-[12px] font-black text-indigo-500 dark:text-cyan-500 -rotate-45 italic">VS</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalQ} cards</p>
            </div>

            {/* Oponente */}
            <div className="text-center flex-1 relative">
              {!isWinner && !isDraw && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-rose-500 animate-bounce"><Crown size={22} strokeWidth={2.5} /></div>}
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 border-4 overflow-hidden shadow-inner ${!isWinner && !isDraw ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'}`}>
                {opponentPhoto ? (
                  <img src={opponentPhoto} alt={opponentName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className={`text-[32px] font-black ${!isWinner && !isDraw ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>{opponentCorrect}</span>
                )}
              </div>
              <p className="text-[14px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[100px] mx-auto">
                {opponentName.split(' ')[0]}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Estatísticas Detalhadas ─── */}
        <motion.div variants={itemVariant} className="grid grid-cols-2 gap-4 mb-10">
          <StatCard
            icon={<Target size={20} className={isWinner ? 'text-emerald-500' : 'text-slate-500'} strokeWidth={2.5} />}
            label="Precisão"
            value={`${Math.round((myCorrect / totalQ) * 100)}%`}
            sublabel={`${myCorrect} de ${totalQ} acertos`}
            highlight={isWinner}
          />
          <StatCard
            icon={<Clock size={20} className={myAvgTime < opponentAvgTime ? 'text-cyan-500' : 'text-slate-500'} strokeWidth={2.5} />}
            label="Ping (Velocidade)"
            value={myAvgTime > 0 ? `${(myAvgTime / 1000).toFixed(1)}s` : '-'}
            sublabel="média por request"
            highlight={myAvgTime < opponentAvgTime && myAvgTime > 0}
          />
        </motion.div>

        {/* ─── Botão de Saída ─── */}
        <motion.div variants={itemVariant}>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-[20px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-[15px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
            Voltar ao Repositório
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
});

// StatCard Refinado
const StatCard = memo(({ icon, label, value, sublabel, highlight }) => (
  <div className={`bg-white dark:bg-slate-900/80 rounded-[24px] p-5 shadow-sm border-2 ${highlight ? 'border-cyan-200 dark:border-cyan-900/50' : 'border-slate-100 dark:border-slate-800'}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-[10px] ${highlight ? 'bg-cyan-50 dark:bg-cyan-950/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
        {icon}
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
    <p className={`text-[24px] font-black mb-0.5 tracking-tight ${highlight ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-100'}`}>
      {value}
    </p>
    <p className="text-[11px] font-medium text-slate-500">{sublabel}</p>
  </div>
));

ChallengeResults.displayName = 'ChallengeResults';
StatCard.displayName = 'StatCard';
export default ChallengeResults;