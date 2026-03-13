/**
 * 💬 COMM_HUB (Chat Panel) — Syntax Theme Premium
 * * Canal de comunicação em tempo real entre desenvolvedores.
 * - Design: High-Fidelity Infrastructure (Slate-950 / Indigo).
 * - Fix: Alinhamento vertical tático na pilha de Widgets.
 * - Lógica: 100% Preservada (Contexto Social, Badges de Notificação).
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TerminalSquare, MessageSquareCode, Terminal, Zap, Activity } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useSocial } from '../../context/SocialContext';
import { useChat } from '../../hooks/useChat';
import { useFriends } from '../../hooks/useFriends';
import { Z } from '../../../../constants/zIndex';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import NotificationBadge from '../shared/NotificationBadge';

const ChatPanel = memo(({ showButton = true }) => {
  const { user } = useAuth();
  const {
    isChatOpen, toggleChat, closeChat,
    activeConversationId, openConversation, backToList,
    totalUnread,
  } = useSocial();
  
  const { conversations } = useChat(null);
  const { friendsStatus } = useFriends();

  const [activeFriendData, setActiveFriendData] = useState(null);
  const [activeFriendStatus, setActiveFriendStatus] = useState(null);

  // Sync de dados de parceiros de debug
  useEffect(() => {
    if (!activeConversationId || !user) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const otherUid = conv.participants?.find((uid) => uid !== user.uid);
    if (!otherUid) return;

    const friendData = conv.participantsData?.[otherUid] || { uid: otherUid, displayName: 'Dev_Node' };
    setActiveFriendData(friendData);
    setActiveFriendStatus(friendsStatus[otherUid] || null);
  }, [activeConversationId, conversations, user, friendsStatus]);

  const handleBack = () => {
    setActiveFriendData(null);
    setActiveFriendStatus(null);
    backToList();
  };

  return (
    <div className="flex flex-col items-end gap-4 relative">
      {/* ─── BOTÃO FLUTUANTE (FIXED ALIGNMENT) ─── */}
      {showButton && (
        <AnimatePresence>
          {!isChatOpen && (
            <motion.button
              onClick={toggleChat}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.07, boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}
              whileTap={{ scale: 0.93 }}
              className="w-14.5 h-14.5 rounded-[18px] flex items-center justify-center relative overflow-hidden shadow-2xl border-2 border-white/10"
              style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)' }}
            >
              {/* Overlay de Brilho Interno (DNA Syntax) */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)' }} 
              />
              
              <MessageSquareCode size={26} color="#fff" strokeWidth={2.2} className="relative z-10 drop-shadow-md" />
              
              {totalUnread > 0 && (
                <div className="absolute -top-1 -right-1 z-20">
                  <NotificationBadge count={totalUnread} pulse />
                </div>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {/* ─── PAINEL DE COMUNICAÇÃO ─── */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop Minimal */}
            <motion.div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
              style={{ zIndex: Z.modal - 1 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeChat}
            />

            <motion.div
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-slate-900 border-l-2 border-white/5 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col"
              style={{ zIndex: Z.modal }}
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <AnimatePresence mode="wait">
                {activeConversationId && activeFriendData ? (
                  /* Janela de Conversa Ativa */
                  <motion.div key="window" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col h-full bg-slate-950">
                    <ChatWindow
                      conversationId={activeConversationId}
                      friendData={activeFriendData}
                      friendStatus={activeFriendStatus}
                      onBack={handleBack}
                      onClose={closeChat}
                    />
                  </motion.div>
                ) : (
                  /* Lista de Conversas (Terminal Style) */
                  <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full bg-slate-900">
                    
                    {/* Header Premium Tático */}
                    <div className="px-8 py-10 border-b border-white/5 bg-slate-950/50 flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full" />
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-[20px] bg-white/5 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                          <TerminalSquare size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Comm_Hub</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {conversations.length} Active_Connections
                            </p>
                          </div>
                        </div>
                      </div>
                      <button onClick={closeChat} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all border border-transparent">
                        <X size={20} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
                      <div className="p-4">
                         <ChatList
                          conversations={conversations}
                          friendsStatus={friendsStatus}
                          onSelectConversation={openConversation}
                        />
                      </div>
                      
                      {conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 opacity-40">
                             <Terminal size={32} className="text-slate-400" />
                          </div>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{`> No_Logs_Available`}</p>
                          <p className="text-[12px] text-slate-600 mt-4 max-w-[200px] font-medium leading-relaxed italic">
                            Aguardando inicialização de canais de comunicação...
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status Bar Estilo IDE */}
                    <div className="px-8 py-4 border-t border-white/5 bg-slate-950 flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol: Syntax_Comm_v4</span>
                       <div className="flex items-center gap-3">
                          <Zap size={10} className="text-indigo-500" />
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Encrypted_Sync</span>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
export default ChatPanel;