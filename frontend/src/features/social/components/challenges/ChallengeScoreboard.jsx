/**
 * 📊 CHALLENGE SCOREBOARD
 * * Placar superior em tempo real.
 * - Animação de "Pop" quando a pontuação muda
 * - Progress bars com cores assimétricas (Cyan vs Rose)
 * - Avatares estilo GitHub/Discord
 */

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { calculateProgress } from '../../utils/challengeHelpers';

const ChallengeScoreboard = memo(({ challenge, currentUserId }) => {
  const players = useMemo(() => {
    if (!challenge?.players) return [];

    const totalQ = challenge.totalQuestions || challenge.questions?.length || 10;
    const ordered = [challenge.inviterId, challenge.inviteeId].filter(Boolean);

    return ordered.map((uid) => {
      const playerData = challenge.players[uid] || {};
      const answeredCount = playerData.answers?.length || 0;
      const correctCount = playerData.score || 0;
      const progress = calculateProgress(answeredCount, totalQ);
      const isYou = uid === currentUserId;

      const fallbackName = uid === challenge.inviterId
        ? challenge.inviterName
        : challenge.inviteeName;
      const fallbackPhoto = uid === challenge.inviterId
        ? challenge.inviterPhoto
        : challenge.inviteePhoto;

      return {
        uid,
        name: playerData.displayName || fallbackName || (isYou ? 'Você' : 'Oponente'),
        photo: playerData.photoURL || fallbackPhoto || null,
        correctCount,
        answeredCount,
        totalQ,
        progress,
        isYou,
      };
    });
  }, [challenge, currentUserId]);

  if (players.length < 2) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-4 w-full bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md p-3 sm:p-4 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {/* Player 1 (Geralmente o desafiante/você) */}
      <PlayerScore player={players[0]} align="left" />

      {/* ─── VS (Centro) ─── */}
      <div className="flex flex-col items-center shrink-0 px-2">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800"
        >
          <Swords size={18} className="text-white drop-shadow-sm" strokeWidth={2.5} />
        </motion.div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1.5">
          VS
        </span>
      </div>

      {/* Player 2 (Oponente) */}
      <PlayerScore player={players[1]} align="right" />
    </div>
  );
});

const PlayerScore = memo(({ player, align }) => {
  const initials = getInitials(player.name);
  const avatarBg = getAvatarColor(player.name);
  const isRight = align === 'right';

  // Cores dinâmicas para diferenciar você do oponente (Cyan vs Rose)
  const scoreColor = player.isYou ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-500';
  const barColor = player.isYou ? 'bg-cyan-500' : 'bg-rose-500';
  const barBg = player.isYou ? 'bg-cyan-100 dark:bg-cyan-950/40' : 'bg-rose-100 dark:bg-rose-950/40';

  return (
    <div className={`flex-1 flex ${isRight ? 'flex-row-reverse' : 'flex-row'} items-center gap-3`}>
      
      {/* ─── Avatar ─── */}
      <div className="relative shrink-0">
        <div className={`absolute inset-0 rounded-[16px] border-2 ${player.isYou ? 'border-cyan-500/50' : 'border-rose-500/50'} scale-110 opacity-50`} />
        {player.photo ? (
          <img
            src={player.photo}
            alt={player.name}
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] object-cover border-2 border-white dark:border-slate-800 shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm"
            style={{ backgroundColor: avatarBg }}
          >
            <span className="text-[14px] sm:text-[16px] font-black text-white">{initials}</span>
          </div>
        )}
        {player.isYou && (
          <span className="absolute -bottom-1 -right-1 text-[9px] bg-cyan-500 text-white rounded-md px-1.5 py-0.5 font-black uppercase tracking-widest border border-white dark:border-slate-800 shadow-sm z-10">
            Eu
          </span>
        )}
      </div>

      {/* ─── Informações e Placar ─── */}
      <div className={`flex-1 min-w-0 flex flex-col justify-center ${isRight ? 'text-right' : 'text-left'}`}>
        <p className="text-[12px] sm:text-[14px] font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">
          {player.isYou ? 'Developer' : player.name.split(' ')[0]}
        </p>
        
        {/* Placar Animado */}
        <div className={`flex items-baseline gap-1 mt-0.5 ${isRight ? 'justify-end' : 'justify-start'}`}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={player.correctCount} // Sempre que o score mudar, o framer-motion recria o span e roda o 'initial'
              initial={{ scale: 1.5, color: '#f59e0b' }} // Acende em laranja vibrante
              animate={{ scale: 1, color: '' }} // Volta pro tamanho/cor normal da classe definida
              className={`text-[20px] sm:text-[24px] font-black leading-none tracking-tighter ${scoreColor}`}
            >
              {player.correctCount}
            </motion.span>
          </AnimatePresence>
          <span className="text-[11px] font-bold text-slate-400">/ {player.totalQ}</span>
        </div>
        
        {/* Barra de Progresso de Respostas */}
        <div className={`w-full h-1.5 sm:h-2 rounded-full mt-2 overflow-hidden ${barBg} shadow-inner`}>
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${player.progress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
    </div>
  );
});

ChallengeScoreboard.displayName = 'ChallengeScoreboard';
PlayerScore.displayName = 'PlayerScore';
export default ChallengeScoreboard;