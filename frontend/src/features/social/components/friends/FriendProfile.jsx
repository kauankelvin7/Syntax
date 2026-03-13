/**
 * 👤 FRIEND PROFILE MODAL PREMIUM — Syntax Theme
 * * Cartão de identidade do desenvolvedor com logs e métricas sociais.
 * - Capa imersiva (Syntax OS Style)
 * - Avatar em destaque com status de rede em tempo real
 * - Estatísticas formatadas como Logs de Performance
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Swords, Terminal, Flame, Code2, Cpu } from 'lucide-react';
import OnlineIndicator from '../shared/OnlineIndicator';
import StudyingBadge from '../shared/StudyingBadge';
import StreakComparison from '../shared/StreakComparison';
import { Z } from '../../../../constants/zIndex';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { friendsService } from '../../services/friendsService';

const FriendProfile = memo(({ friend, friendStatus, isOpen, onClose, onMessage, onChallenge, onRemove, myStreak = 0 }) => {
  const [profile, setProfile] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!friend?.uid || !isOpen) return;
    setProfile(null);
    setImgError(false);
    friendsService.getUserProfile(friend.uid).then((data) => {
      if (data) setProfile(data);
    }).catch(() => {});
  }, [friend?.uid, isOpen]);

  if (!friend) return null;

  const displayData = profile || friend;
  const initials = getInitials(displayData.displayName);
  const avatarBg = getAvatarColor(displayData.displayName);
  const isOnline = friendStatus?.isOnline || false;
  const isStudying = friendStatus?.isStudying || false;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop com Blur Profundo */}
          <motion.div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
            style={{ zIndex: Z.modal - 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="fixed inset-x-4 top-1/2 max-w-sm mx-auto"
            style={{ zIndex: Z.modal }}
            initial={{ opacity: 0, y: '-45%', scale: 0.9 }}
            animate={{ opacity: 1, y: '-50%', scale: 1, transition: { type: "spring", damping: 25, stiffness: 350 } }}
            exit={{ opacity: 0, y: '-45%', scale: 0.9, transition: { duration: 0.2 } }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-800 overflow-hidden">
              
              {/* ─── Capa Syntax OS ─── */}
              <div className="relative h-36 bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500">
                <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all active:scale-90 border border-white/10"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              {/* ─── Avatar e Identidade ─── */}
              <div className="relative px-6 -mt-14 flex flex-col items-center">
                <div className="relative inline-block group">
                  <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[32px] scale-110 shadow-lg" />
                  {displayData.photoURL && !imgError ? (
                    <img
                      src={displayData.photoURL}
                      alt={displayData.displayName}
                      className="relative w-28 h-28 rounded-[28px] object-cover border-4 border-white dark:border-slate-900 shadow-2xl transition-transform group-hover:scale-[1.02]"
                      onError={() => setImgError(true)}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="relative w-28 h-28 rounded-[28px] flex items-center justify-center text-white text-4xl font-black border-4 border-white dark:border-slate-900 shadow-2xl"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 ring-[6px] ring-white dark:ring-slate-900 rounded-full bg-white dark:bg-slate-900">
                    <OnlineIndicator isOnline={isOnline} isStudying={isStudying} size="lg" pulse />
                  </div>
                </div>

                <div className="text-center mt-5 mb-3">
                  <h3 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    {displayData.displayName}
                  </h3>
                  {displayData.institution && (
                    <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                      <Terminal size={14} className="text-cyan-500" /> {displayData.institution}
                    </p>
                  )}
                </div>

                {isStudying && (
                  <div className="mb-4">
                    <StudyingBadge isStudying={isStudying} currentPage={friendStatus?.currentPage} />
                  </div>
                )}
              </div>

              {/* ─── Conteúdo e Métricas ─── */}
              <div className="px-6 pb-8">
                {displayData.bio && (
                  <div className="relative mb-6">
                    <div className="absolute -left-2 top-0 bottom-0 w-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <p className="text-[14px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic pl-4">
                      {`/* ${displayData.bio} */`}
                    </p>
                  </div>
                )}

                {/* Grid de Stats estilo Dashboard */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                    <div className="flex items-center gap-1.5 text-amber-500 mb-2">
                      <Flame size={16} strokeWidth={2.5} />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Streak_Uptime</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                      {displayData.streakDays || 0} <span className="text-xs text-slate-400 font-bold uppercase">days</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                    <div className="flex items-center gap-1.5 text-indigo-500 mb-2">
                      <Cpu size={16} strokeWidth={2.5} />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Deployment</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                      {displayData.totalStudyMinutes ? Math.round(displayData.totalStudyMinutes / 60) : 0}<span className="text-sm font-bold text-indigo-500">h</span>
                    </p>
                  </div>
                </div>

                {/* Comparação de Rank */}
                <div className="mb-8">
                  <StreakComparison
                    myStreak={myStreak}
                    friendStreak={displayData.streakDays || 0}
                    friendName={displayData.displayName.split(' ')[0]}
                  />
                </div>

                {/* ─── Ações de Conexão ─── */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { onMessage?.(friend); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-[18px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 hover:opacity-90"
                  >
                    <MessageSquare size={18} strokeWidth={2.5} /> Chat
                  </button>
                  <button
                    onClick={() => { onChallenge?.(friend); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-[18px] bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[13px] font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(244,63,94,0.3)] transition-all active:scale-95 hover:brightness-110"
                  >
                    <Swords size={18} strokeWidth={2.5} /> Battle
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

FriendProfile.displayName = 'FriendProfile';
export default FriendProfile;