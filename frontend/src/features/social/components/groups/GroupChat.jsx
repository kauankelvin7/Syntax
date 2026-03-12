/**
 * 🛰️ GROUP CHAT PREMIUM - Syntax Theme
 * * Interface de colaboração em tempo real para Squads (Grupos).
 * - Header: Squad Monitor Style (Contexto de membros em tempo real)
 * - Messages: Code Block Geometry com identificação de autor tática
 * - Input: Command Prompt Style (Otimizado para alto fluxo de dados)
 */

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Send,
  Terminal,
  Code2,
  Info,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { useChat } from '../../hooks/useChat';
import { formatMessageTime, getInitials, getAvatarColor } from '../../utils/chatHelpers';
import TypingIndicator from '../chat/TypingIndicator';

const GroupChat = memo(({ group, onBack, onShowMembers }) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, typing, handleTyping } = useChat(group?.id);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll performático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setText('');
    inputRef.current?.focus();
  }, [text, sendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e) => {
    setText(e.target.value);
    handleTyping?.();
  }, [handleTyping]);

  if (!group) return null;

  const typingUsers = Array.isArray(typing)
    ? typing.filter((t) => t.userId !== user?.uid)
    : [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden relative">
      {/* ─── Header (Squad Monitor) ─── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl shrink-0 z-20">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 transition-all active:scale-90"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>

        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 overflow-hidden">
            {group.photoURL ? (
              <img src={group.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Code2 size={22} className="text-white" strokeWidth={2.5} />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-sm" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-[16px] font-black text-slate-900 dark:text-white truncate tracking-tight leading-none">
            {group.groupName}
          </h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
            <span className="text-cyan-500">Active_Squad:</span> {group.participants?.length || 0} nodes
          </p>
        </div>

        <button
          onClick={onShowMembers}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all active:scale-95 border border-transparent dark:border-slate-800/50"
        >
          <Users size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* ─── Messages (Terminal Area) ─── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar bg-slate-50/20 dark:bg-slate-950">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Cpu size={24} className="animate-spin text-indigo-500/50" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Streaming_Data...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 opacity-40">
            <Terminal size={40} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[15px] font-black text-slate-600 dark:text-slate-400 tracking-tight">{`> Repository_Initialized`}</p>
            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Start the discussion flow</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === user?.uid;
            const prevMsg = messages[idx - 1];
            const showSender = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system');

            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-1.5 rounded-full">
                    {`# ${msg.text}`}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${idx === messages.length -1 ? 'pb-2' : ''}`}>
                {showSender && (
                  <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-500 uppercase tracking-widest mb-1.5 ml-2">
                    {msg.senderName?.split(' ')[0] || 'Unknown_Node'}
                  </span>
                )}
                <div
                  className={`max-w-[85%] px-4 py-3 shadow-sm transition-all hover:shadow-md ${
                    isOwn
                      ? 'bg-indigo-600 text-white rounded-[18px] rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-[18px] rounded-tl-none'
                  }`}
                >
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words tracking-tight">
                    {msg.text}
                  </p>
                  <div className={`flex items-center gap-1.5 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isOwn ? 'text-indigo-200/70' : 'text-slate-400'}`}>
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <TypingIndicator typingUsers={typingUsers} />
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* ─── Input (Command Prompt) ─── */}
      <div className="shrink-0 px-4 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 z-30">
        <div className="flex items-end gap-2.5 max-w-4xl mx-auto w-full">
          <div className="flex-1 relative flex items-center">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite um snippet ou comando..."
              rows={1}
              className="w-full resize-none pl-4 pr-4 py-3 rounded-[18px] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-[14px] font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
              style={{ minHeight: '48px', maxHeight: '150px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-40 disabled:grayscale active:scale-90 shrink-0"
            aria-label="Commit"
          >
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
});

GroupChat.displayName = 'GroupChat';
export default GroupChat;