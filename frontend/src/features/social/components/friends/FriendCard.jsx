/**
 * 🪪 FRIEND CARD PREMIUM - Syntax Theme
 * * Lista interativa de conexões com micro-interações de engenharia.
 * - Design: Elevated Code Card (Bordas táticas e sombras suaves)
 * - Features: Dropdown animado, status de atividade em tempo real e acessibilidade.
 */

import React, { memo, useState } from 'react';
import { MessageSquare, Swords, MoreHorizontal, UserMinus, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import OnlineIndicator from '../shared/OnlineIndicator';
import StudyingBadge from '../shared/StudyingBadge';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const FriendCard = memo(({ friend, status, onMessage, onChallenge, onRemove, onViewProfile }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(friend.displayName);
  const avatarBg = getAvatarColor(friend.displayName);
  const isOnline = status?.isOnline || false;
  const isStudying = status?.isStudying || false;
  const currentPage = status?.currentPage || '';

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.9, y: -10, transformOrigin: 'top right' },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.3, bounce: 0.4 } },
    exit: { opacity: 0, scale: 0.9, y: -5, transition: { duration: 0.15 } }
  };

  return (
    <div
      className="relative group rounded-[22px] p-3.5 mb-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-cyan-500/30 transition-all duration-300 cursor-pointer active:scale-[0.99]"
      onClick={() => onViewProfile?.(friend)}
      role="button"
      tabIndex={0}
    >
      {/* ─── Efeito de Brilho no Topo (Hover) ─── */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-500/0 group-hover:via-cyan-500/40 transition-all duration-500" />

      <div className="flex items-center gap-4">
        {/* ─── Avatar Section (Syntax Style) ─── */}
        <div className="relative shrink-0">
          {friend.photoURL && !imgError ? (
            <img
              src={friend.photoURL}
              alt={friend.displayName}
              className="w-13 h-13 rounded-[16px] object-cover border-2 border-slate-50 dark:border-slate-800 shadow-sm group-hover:rotate-2 transition-transform duration-300"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-13 h-13 rounded-[16px] flex items-center justify-center text-white text-[15px] font-black shadow-inner group-hover:rotate-2 transition-transform duration-300"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
          )}
          
          <div className="absolute -bottom-1 -right-1 ring-4 ring-white dark:ring-slate-900 rounded-full bg-white dark:bg-slate-900">
            <OnlineIndicator
              isOnline={isOnline}
              isStudying={isStudying}
              size="md"
              pulse
            />
          </div>
        </div>

        {/* ─── Info ─── */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-black text-slate-800 dark:text-slate-100 truncate tracking-tight leading-none">
            {friend.displayName || 'Dev Anonymous'}
          </p>
          <div className="mt-2">
            {isStudying ? (
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                <StudyingBadge isStudying={isStudying} currentPage={currentPage} />
              </div>
            ) : (
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <span className="text-emerald-500 font-black">●</span>
                    Available_Now
                  </>
                ) : (
                  <>
                    <span className="opacity-50">●</span>
                    Node_Offline
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ─── Actions (Code Panel Style) ─── */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMessage?.(friend)}
            className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-90"
            title="Chat"
          >
            <MessageSquare size={18} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={() => onChallenge?.(friend)}
            className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all active:scale-90"
            title="Challenge"
          >
            <Swords size={18} strokeWidth={2.5} />
          </button>

          {/* More Menu */}
          <div className="relative ml-1">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center justify-center w-9 h-9 rounded-[12px] transition-all active:scale-90 ${showMenu ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <MoreHorizontal size={18} strokeWidth={3} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 py-1.5 min-w-[180px] overflow-hidden"
                  >
                    <button
                      onClick={async () => {
                        try {
                          await onRemove?.(friend.friendshipId || friend.uid);
                          toast.success('Conexão encerrada com sucesso.');
                        } catch (e) {
                          toast.error('Falha ao encerrar conexão.');
                        }
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <UserMinus size={16} strokeWidth={2.5} />
                      Unlink_Dev
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

FriendCard.displayName = 'FriendCard';
export default FriendCard;