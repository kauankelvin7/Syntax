/**
 * 🤝 FRIEND REQUESTS PREMIUM — Syntax Theme
 * * Gerenciamento de convites de conexão (Handshakes).
 * - Design: Pull Request Style (Hierarquia clara e badges táticos)
 * - Features: Micro-interações de aceite, loading states e animações de lista.
 */

import React, { memo, useState } from 'react';
import { Check, X, Clock, Loader2, Terminal, Send, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getInitials, getAvatarColor, formatMessageTime } from '../../utils/chatHelpers';

const FriendRequests = memo(({ pendingRequests, sentRequests, onAccept, onDecline }) => {
  const [processing, setProcessing] = useState({});

  const handleAction = async (friendshipId, action) => {
    setProcessing((prev) => ({ ...prev, [friendshipId]: action }));
    try {
      if (action === 'accept') {
        await onAccept(friendshipId);
        toast.success('Conexão estabelecida!');
      } else {
        await onDecline(friendshipId);
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao processar request');
    }
    setProcessing((prev) => ({ ...prev, [friendshipId]: null }));
  };

  const hasReceived = pendingRequests?.length > 0;
  const hasSent = sentRequests?.length > 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
  };

  if (!hasReceived && !hasSent) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center px-6"
      >
        <div className="w-20 h-20 rounded-[28px] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800 shadow-inner">
          <Terminal size={32} className="text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-black text-slate-800 dark:text-slate-200 tracking-tight">
          {`> Status_Clear`}
        </h3>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-[220px] leading-relaxed">
          Nenhum handshake pendente no servidor.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ─── Pedidos Recebidos (Incoming Handshakes) ─── */}
      {hasReceived && (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <div className="flex items-center gap-2.5 px-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
              Incoming_Requests ({pendingRequests.length})
            </h4>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {pendingRequests.map((req) => {
                const senderData = req.requestedBy === req.users[0] ? req.user1Data : req.user2Data;
                const initials = getInitials(senderData?.displayName);
                const avatarBg = getAvatarColor(senderData?.displayName);

                return (
                  <motion.div
                    key={req.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="flex items-center gap-4 p-4 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
                  >
                    {/* Avatar Syntax Style */}
                    <div className="relative shrink-0">
                      {senderData?.photoURL ? (
                        <img src={senderData.photoURL} alt="" className="w-13 h-13 rounded-[16px] object-cover border-2 border-indigo-50 dark:border-slate-800 group-hover:rotate-2 transition-transform" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-13 h-13 rounded-[16px] flex items-center justify-center text-white text-[15px] font-black shadow-inner" style={{ backgroundColor: avatarBg }}>
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-black text-slate-900 dark:text-white truncate tracking-tight leading-none mb-1.5">
                        {senderData?.displayName || 'Dev User'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Cpu size={12} className="text-cyan-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          Request_Log: {formatMessageTime(req.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Ações Táticas */}
                    <div className="flex items-center gap-2 pl-2">
                      <button
                        onClick={() => handleAction(req.id, 'decline')}
                        disabled={!!processing[req.id]}
                        className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-all disabled:opacity-50 active:scale-90 border border-transparent dark:border-slate-700/50"
                        title="Abort Request"
                      >
                        {processing[req.id] === 'decline' ? <Loader2 size={18} className="animate-spin" /> : <X size={20} strokeWidth={3} />}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'accept')}
                        disabled={!!processing[req.id]}
                        className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all disabled:opacity-50 active:scale-90"
                        title="Establish Link"
                      >
                        {processing[req.id] === 'accept' ? <Loader2 size={20} className="animate-spin" /> : <Check size={22} strokeWidth={3.5} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ─── Pedidos Enviados (Outgoing Logs) ─── */}
      {hasSent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2.5 px-2 mb-4 mt-8 opacity-60">
            <Send size={14} className="text-slate-500" />
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
              Outgoing_Broadcasts ({sentRequests.length})
            </h4>
          </div>
          
          <div className="space-y-2 px-1">
            {sentRequests.map((req) => {
              const targetData = req.requestedTo === req.users[0] ? req.user1Data : req.user2Data;
              const initials = getInitials(targetData?.displayName);
              
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-4 p-3.5 rounded-[20px] bg-slate-50/50 dark:bg-slate-900/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all duration-300"
                >
                  <div className="relative shrink-0 grayscale-[40%] opacity-70 group-hover:grayscale-0 transition-all">
                    {targetData?.photoURL ? (
                      <img src={targetData.photoURL} alt="" className="w-10 h-10 rounded-[12px] object-cover border border-slate-200 dark:border-slate-700 shadow-sm" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white text-[12px] font-black" style={{ backgroundColor: getAvatarColor(targetData?.displayName) }}>
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-600 dark:text-slate-400 truncate tracking-tight">
                      {targetData?.displayName || 'Dev User'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                      Awaiting
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
});

FriendRequests.displayName = 'FriendRequests';
export default FriendRequests;