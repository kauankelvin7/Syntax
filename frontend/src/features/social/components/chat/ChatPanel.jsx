/**
 * 💬 CHAT PANEL PREMIUM - Syntax Theme
 * * Painel de comunicação em tempo real integrado ao ecossistema Syntax.
 * - Navegação fluida entre lista e conversa (Code Collaboration Style)
 * - Design responsivo (Sidepanel vs Fullscreen)
 * - Transições de estado com física de mola (High Performance UI)
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Terminal, TerminalSquare, MessageSquareCode } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useSocial } from '../../context/SocialContext';
import { useChat } from '../../hooks/useChat';
import { useFriends } from '../../hooks/useFriends';
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

  // Resolve dados do amigo de forma performática
  useEffect(() => {
    if (!activeConversationId || !user) return;
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const otherUid = conv.participants?.find((uid) => uid !== user.uid);
    if (!otherUid) return;

    const friendData = conv.participantsData?.[otherUid] || { uid: otherUid, displayName: 'Dev User' };
    setActiveFriendData(friendData);
    setActiveFriendStatus(friendsStatus[otherUid] || null);
  }, [activeConversationId, conversations, user, friendsStatus]);

  const handleSelectConversation = (conv) => {
    openConversation(conv.id);
  };

  const handleBack = () => {
    setActiveFriendData(null);
    setActiveFriendStatus(null);
    backToList();
  };

  return (
    <>
      {/* ─── Botão Flutuante (FAB) Syntax Style ─── */}
      {showButton && (
        <motion.button
          onClick={toggleChat}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.9 }}
          className={`fixed bottom-6 right-6 w-16 h-16 rounded-[22px] flex items-center justify-center shadow-[0_12px_40px_rgba(79,70,229,0.3)] transition-all ${
            isChatOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 z-[100]'
          } bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 text-white border-2 border-white/20`}
          aria-label="Abrir comunicações"
        >
          <MessageSquareCode size={28} strokeWidth={2} />
          {totalUnread > 0 && (
            <div className="absolute -top-1 -right-1">
              <NotificationBadge count={totalUnread} pulse />
            </div>
          )}
        </motion.button>
      )}

      {/* ─── Overlay & Panel ─── */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop Glassmorphism */}
            <motion.div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[110] md:backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChat}
            />

            {/* Painel Principal (Sidebar Style) */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 z-[120] w-full md:w-[420px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl shadow-[-20px_0_60px_rgba(0,0,0,0.2)] dark:shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col border-l border-slate-200 dark:border-slate-800"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 400 }}
            >
              <AnimatePresence mode="wait">
                {activeConversationId && activeFriendData ? (
                  /* Janela de Conversa Ativa */
                  <motion.div 
                    key="window"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <ChatWindow
                      conversationId={activeConversationId}
                      friendData={activeFriendData}
                      friendStatus={activeFriendStatus}
                      onBack={handleBack}
                      onClose={closeChat}
                    />
                  </motion.div>
                ) : (
                  /* Lista de Conversas (Terminal Style Header) */
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    {/* Header Premium */}
                    <div className="px-6 py-8 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-[14px] bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border-2 border-indigo-100 dark:border-indigo-800/50 shadow-inner text-indigo-600 dark:text-cyan-400">
                          <TerminalSquare size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h2 className="text-[19px] font-black text-slate-900 dark:text-white tracking-tight">Comunicações</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
                              {conversations.length} Active_Sessions
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={closeChat}
                        className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-500 dark:text-slate-400 border border-transparent dark:border-slate-700/50"
                      >
                        <X size={20} strokeWidth={3} />
                      </button>
                    </div>

                    {/* Lista Scrolável */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="p-3">
                         <ChatList
                          conversations={conversations}
                          friendsStatus={friendsStatus}
                          onSelectConversation={handleSelectConversation}
                        />
                      </div>
                      
                      {/* Empty State (Logs Style) */}
                      {conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[60%] p-10 text-center opacity-60">
                          <Terminal size={40} className="text-slate-300 dark:text-slate-700 mb-4" strokeWidth={1.5} />
                          <p className="text-sm font-black text-slate-400 dark:text-slate-600 tracking-tight">{`> No_Logs_Available`}</p>
                          <p className="text-[11px] text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">Conecte-se a outros desenvolvedores para iniciar o streaming.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer sutil estilo status bar de IDE */}
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/20">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  Syntax Protocol v2.0.4 • Encrypted
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(148, 163, 184, 0.2); 
          border-radius: 10px; 
        }
      `}</style>
    </>
  );
});

ChatPanel.displayName = 'ChatPanel';
export default ChatPanel;