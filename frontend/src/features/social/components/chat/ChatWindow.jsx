/**
 * 🪟 CHAT WINDOW PREMIUM - Syntax Theme
 * * Interface de comunicação de alta performance com agrupamento lógico.
 * - Header imersivo (IDE Context Style)
 * - Scroll gerenciado para logs de conversa extensos
 * - Separadores de data com design Glassmorphism Tech
 */

import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, ChevronDown, X, Terminal, Clock, Code2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useChat } from '../../hooks/useChat';
import { useSocial } from '../../context/SocialContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import OnlineIndicator from '../shared/OnlineIndicator';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import { challengeService } from '../../services/challengeService';
import { toast } from 'sonner';

/* ─── Processamento de Mensagens (Intacto) ─── */
function processMessages(messages, currentUserId) {
  const result = [];
  let lastDate = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    if (dateKey !== lastDate) {
      result.push({ type: 'date-separator', date: msgDate, key: `date-${dateKey}` });
      lastDate = dateKey;
    }

    const prev = messages[i - 1];
    const next = messages[i + 1];
    const sameSenderAsPrev = prev && prev.senderId === msg.senderId && prev.type !== 'system';
    const sameSenderAsNext = next && next.senderId === msg.senderId && next.type !== 'system';

    const prevTime = prev?.createdAt?.toDate ? prev.createdAt.toDate() : prev?.createdAt ? new Date(prev.createdAt) : null;
    const nextTime = next?.createdAt?.toDate ? next.createdAt.toDate() : next?.createdAt ? new Date(next.createdAt) : null;
    const closeInTimePrev = prevTime && (msgDate - prevTime) < 120000;
    const closeInTimeNext = nextTime && (nextTime - msgDate) < 120000;

    result.push({
      type: 'message',
      data: msg,
      isOwn: msg.senderId === currentUserId,
      isFirstInGroup: !(sameSenderAsPrev && closeInTimePrev),
      isLastInGroup: !(sameSenderAsNext && closeInTimeNext),
      key: msg.id,
    });
  }
  return result;
}

function formatDateSeparator(date) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const ChatWindow = memo(({ conversationId, friendData, friendStatus, onBack, onClose }) => {
  const { user } = useAuth();
  const { messages, typing, loading, sendMessage, handleTyping, markAsRead, deleteMessage } = useChat(conversationId);
  const { startChallenge } = useSocial();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const isAtBottom = useRef(true);
  const prevMessageCount = useRef(0);

  const processedMessages = useMemo(() => processMessages(messages, user?.uid), [messages, user?.uid]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
    setShowScrollDown(false);
    setNewMessageCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottom.current = atBottom;
    setShowScrollDown(!atBottom);
    if (atBottom) {
      setNewMessageCount(0);
      markAsRead();
    }
  }, [markAsRead]);

  useEffect(() => {
    const count = messages.length;
    if (count > prevMessageCount.current) {
      if (isAtBottom.current) scrollToBottom();
      else setNewMessageCount((prev) => prev + (count - prevMessageCount.current));
    }
    prevMessageCount.current = count;
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom(false);
  }, [loading]);

  const handleAcceptChallenge = useCallback(async (challengeId) => {
    try {
      await challengeService.acceptChallenge(challengeId, user.uid);
      startChallenge(challengeId);
    } catch (err) {
      toast.error(err.message || 'Erro ao aceitar desafio');
    }
  }, [user?.uid, startChallenge]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative">
      {/* ─── Header Premium (IDE Style) ─── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl z-30">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 md:hidden transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>

        <div className="relative shrink-0">
          {friendData?.photoURL ? (
            <img src={friendData.photoURL} alt="" className="w-11 h-11 rounded-[14px] object-cover border-2 border-white dark:border-slate-800 shadow-sm" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center text-white text-[13px] font-black shadow-inner" style={{ backgroundColor: getAvatarColor(friendData?.displayName) }}>
              {getInitials(friendData?.displayName)}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 ring-4 ring-white dark:ring-slate-950 rounded-full">
            <OnlineIndicator isOnline={friendStatus?.isOnline} isStudying={friendStatus?.isStudying} size="sm" pulse />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-black text-slate-900 dark:text-white truncate tracking-tight leading-none">
            {friendData?.displayName || 'Dev User'}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            {typing.length > 0 ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-cyan-500 animate-pulse uppercase tracking-widest">Streaming_Data...</span>
              </div>
            ) : friendStatus?.isStudying ? (
              <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20"><Code2 size={10} /> In_Focus</span>
            ) : friendStatus?.isOnline ? (
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
                Active_Now
              </span>
            ) : (
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Node_Offline</span>
            )}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="hidden md:flex p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 transition-all active:scale-95"
          >
            <X size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* ─── Mensagens (Terminal Content Area) ─── */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar bg-slate-50/20 dark:bg-slate-950"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <Cpu size={20} className="absolute text-indigo-500/40" />
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Establishing_Link</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-60">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[28px] flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-800 shadow-xl">
              <Terminal size={32} className="text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-black text-slate-600 dark:text-slate-400 tracking-tight">Novo repositório de conversa</p>
            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
              Dê o primeiro commit enviando um olá para {friendData?.displayName?.split(' ')[0]}
            </p>
          </div>
        ) : (
          processedMessages.map((item) => {
            if (item.type === 'date-separator') {
              return (
                <div key={item.key} className="flex justify-center my-8 sticky top-0 z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 px-5 py-2 rounded-full backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                    {formatDateSeparator(item.date)}
                  </span>
                </div>
              );
            }
            return (
              <ChatMessage
                key={item.key}
                message={item.data}
                isOwn={item.isOwn}
                isFirstInGroup={item.isFirstInGroup}
                isLastInGroup={item.isLastInGroup}
                onAcceptChallenge={handleAcceptChallenge}
                onDeclineChallenge={() => challengeService.declineChallenge(item.data.attachedContent?.challengeId)}
                onDelete={deleteMessage}
              />
            );
          })
        )}
        <TypingIndicator typingUsers={typing} />
        <div ref={messagesEndRef} className="h-6" />
      </div>

      {/* ─── Botão Scroll-to-Bottom Tech ─── */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 right-6 w-12 h-12 rounded-[16px] bg-white dark:bg-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-cyan-500 z-40 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-90"
          >
            <ChevronDown size={24} strokeWidth={3} />
            {newMessageCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1.5 -left-1.5 flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-[8px] bg-cyan-500 text-white text-[11px] font-black shadow-lg shadow-cyan-500/40"
              >
                {newMessageCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Input Row ─── */}
      <div className="relative z-40 border-t border-slate-100 dark:border-slate-800/50">
        <ChatInput onSend={sendMessage} onTyping={handleTyping} />
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
export default ChatWindow;