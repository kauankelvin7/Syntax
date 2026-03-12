/**
 * 👥 FRIENDS LIST PREMIUM — Syntax Theme
 * * Lista segmentada de conexões com status de rede em tempo real.
 * - Design: Network Monitor Style (Hierarquia clara e badges tech)
 * - Features: Empty State focado em crescimento e sincronização performática.
 */

import React, { memo } from 'react';
import { Users, Search, Loader2, Cpu, Wifi, Moon, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import FriendCard from './FriendCard';

const FriendsList = memo(({ 
  friends, 
  friendsStatus = {}, 
  loading, 
  onMessage, 
  onChallenge, 
  onRemove, 
  onViewProfile, 
  onNavigateSearch 
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative p-4 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800">
            <Cpu size={32} className="animate-spin text-indigo-500" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Sync_Connections...</p>
      </div>
    );
  }

  if (!friends?.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center px-6"
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
          <div className="relative w-24 h-24 rounded-[32px] bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            <Users size={40} className="text-cyan-500" strokeWidth={1.5} />
          </div>
        </div>
        
        <h3 className="text-[18px] font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          {`> Network_Empty`}
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed mb-8 font-medium">
          Nenhum desenvolvedor conectado ao seu nó. Expanda sua rede de engenharia e evoluam stacks juntos!
        </p>
        
        {onNavigateSearch && (
          <button
            onClick={onNavigateSearch}
            className="flex items-center gap-2.5 px-8 py-4 text-[13px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-[18px] shadow-[0_10px_25px_rgba(79,70,229,0.3)] hover:shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Search size={18} strokeWidth={3} />
            Scan_Developers
          </button>
        )}
      </motion.div>
    );
  }

  const onlineFriends = friends.filter((f) => friendsStatus[f.uid]?.isOnline);
  const offlineFriends = friends.filter((f) => !friendsStatus[f.uid]?.isOnline);

  return (
    <div className="space-y-10">
      {/* ─── Online (Active Nodes) ─── */}
      {onlineFriends.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2.5 px-2 mb-5">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-4 h-4 rounded-full bg-emerald-400/30 animate-ping" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
              Active_Nodes ({onlineFriends.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {onlineFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                status={friendsStatus[friend.uid]}
                onMessage={onMessage}
                onChallenge={onChallenge}
                onRemove={onRemove}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Offline (Inactive Sessions) ─── */}
      {offlineFriends.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2.5 px-2 mb-5 opacity-60">
            <Moon size={14} className="text-slate-400 dark:text-slate-600" />
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Inactive_Sessions ({offlineFriends.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {offlineFriends.map((friend) => (
              <FriendCard
                key={friend.uid}
                friend={friend}
                status={friendsStatus[friend.uid]}
                onMessage={onMessage}
                onChallenge={onChallenge}
                onRemove={onRemove}
                onViewProfile={onViewProfile}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
});

FriendsList.displayName = 'FriendsList';
export default FriendsList;