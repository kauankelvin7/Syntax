/**
 * 💬 CHAT MESSAGE
 * * Renderização de mensagens com suporte a desafios e snippets.
 * - Design: Code Block Style (Cantos refinados e bordas táticas)
 * - Features: Status de entrega, ações rápidas e feedbacks gamificados.
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { Trash2, Copy, Check, Swords, Trophy, Clock, Loader2, Code, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase-config';
import MessageStatus from './MessageStatus';
import ShareContent from '../shared/ShareContent';
import { formatChatTime } from '../../utils/chatHelpers';
import { toast } from 'sonner';

/* ─── Challenge Invite Message (Estilo CI/CD Alert) ─── */
const ChallengeInviteMessage = memo(({ attachedContent, isOwn, createdAt, onAcceptChallenge, onDeclineChallenge }) => {
  const [challengeStatus, setChallengeStatus] = useState(null);
  const challengeId = attachedContent?.challengeId;

  useEffect(() => {
    if (!challengeId) return;
    const unsub = onSnapshot(
      doc(db, 'challenges', challengeId),
      (snap) => setChallengeStatus(snap.exists() ? snap.data().status : 'expired'),
      () => setChallengeStatus('expired'),
    );
    return () => unsub();
  }, [challengeId]);

  const status = challengeStatus ?? 'pending';

  const renderStatus = () => {
    if (status === 'in_progress') return <div className="flex items-center justify-center gap-1.5 py-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Loader2 size={12} className="animate-spin" /> Battle_In_Progress</div>;
    if (status === 'cancelled' || status === 'declined') return <div className="py-2 text-center text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg uppercase tracking-widest">Request_Declined</div>;
    if (status === 'expired') return <div className="py-2 text-center text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg uppercase tracking-widest"><Clock size={12} className="inline mr-1" /> Timeout_Error</div>;
    if (status === 'finished') return <div className="py-2 text-center text-[10px] font-black text-cyan-500 bg-cyan-500/10 rounded-lg uppercase tracking-widest border border-cyan-500/20"><Trophy size={12} className="inline mr-1" /> Task_Completed</div>;

    if (!isOwn && status === 'pending') return (
      <div className="flex gap-2">
        <button onClick={() => onAcceptChallenge?.(challengeId)} className="flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Deploy ⚔️</button>
        <button onClick={() => onDeclineChallenge?.(challengeId)} className="flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all">Abort</button>
      </div>
    );
    return <p className="text-[10px] font-black text-amber-500 text-center py-2 uppercase tracking-[0.2em] animate-pulse">Awaiting_Handshake...</p>;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
      <motion.div whileHover={{ y: -3 }} className="max-w-[85%] rounded-[24px] overflow-hidden border-2 border-rose-500/30 bg-white dark:bg-slate-900 shadow-2xl shadow-rose-500/5">
        <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-4">
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30"><Swords size={20} className="text-white" strokeWidth={2.5} /></div>
             <span className="text-[10px] font-black uppercase tracking-widest bg-black/20 text-white px-2.5 py-1 rounded-full">Code Battle</span>
           </div>
           <h4 className="text-[16px] font-black text-white leading-tight mb-1">Incoming Challenge!</h4>
           <div className="flex items-center gap-2 text-rose-50/80 font-mono text-[11px]">
             <Terminal size={12} />
             <span>stack: {attachedContent.deckName}</span>
           </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic complexity</span>
             <span className="text-[11px] font-mono font-bold text-rose-500">{attachedContent.cardCount} units</span>
          </div>
          {renderStatus()}
          <div className="mt-4 flex justify-end">
            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">{formatChatTime(createdAt)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

/* ─── Chat Message Main Component ─── */
const ChatMessage = memo(({ message, isOwn, isFirstInGroup, isLastInGroup, onOpenContent, onAcceptChallenge, onDeclineChallenge, onDelete }) => {
  const { type, text, attachedContent, createdAt, status, readBy, senderId } = message;
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e) => {
    e.stopPropagation();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setShowActions(false);
      toast.success('Snippet copiado para o clipboard');
    }
  }, [text]);

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    onDelete?.(message.id);
    setShowActions(false);
  }, [message.id, onDelete]);

  const isEmojiOnly = text && /^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base}\p{Emoji_Component}\u200d\uFE0F\s]{1,11}$/u.test(text.trim()) && text.trim().length <= 11;

  if (type === 'system') {
    return (
      <div className="flex justify-center my-6">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-5 py-2 rounded-full backdrop-blur-sm">
          {`# ${text}`}
        </span>
      </div>
    );
  }

  if (type === 'challenge_invite' && attachedContent) {
    return <ChallengeInviteMessage attachedContent={attachedContent} isOwn={isOwn} createdAt={createdAt} onAcceptChallenge={onAcceptChallenge} onDeclineChallenge={onDeclineChallenge} />;
  }

  // Estilo de Bloco Syntax (Menos arredondado nas junções)
  const bubbleStyles = isOwn 
    ? `${isFirstInGroup ? 'rounded-t-[18px]' : 'rounded-t-[4px]'} ${isLastInGroup ? 'rounded-bl-[18px] rounded-br-[4px]' : 'rounded-b-[4px]'} rounded-l-[18px] bg-indigo-600 text-white shadow-lg shadow-indigo-600/10`
    : `${isFirstInGroup ? 'rounded-t-[18px]' : 'rounded-t-[4px]'} ${isLastInGroup ? 'rounded-br-[18px] rounded-bl-[4px]' : 'rounded-b-[4px]'} rounded-r-[18px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm`;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-4' : 'mb-0.5'} group px-3 relative`}>
      <div className="relative max-w-[85%]">
        <AnimatePresence>
          {showActions && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 z-20 flex gap-1 p-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl`}>
              <button onClick={handleCopy} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all active:scale-90">{copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}</button>
              {isOwn && <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 transition-all active:scale-90"><Trash2 size={16} /></button>}
            </motion.div>
          )}
        </AnimatePresence>

        <div onClick={() => setShowActions(!showActions)} className={`relative px-4 py-3 cursor-pointer transition-all duration-300 active:scale-[0.99] ${isEmojiOnly ? 'bg-transparent shadow-none border-none !px-1' : bubbleStyles}`}>
          {type === 'challenge_result' && (
             <div className="mb-3 p-4 bg-black/20 dark:bg-white/5 rounded-xl border border-white/10">
                <Trophy size={24} className="mx-auto text-amber-400 mb-2" strokeWidth={2.5} />
                <p className="text-[11px] font-black uppercase tracking-widest text-center mb-3">Logs: {attachedContent.deckName}</p>
                <div className="flex justify-center gap-6">
                   {Object.entries(attachedContent.scores || {}).map(([uid, d]) => (
                     <div key={uid} className="flex flex-col items-center">
                        <span className="text-lg font-black tracking-tighter">{d.correct}/{d.total}</span>
                        <span className={`text-[9px] font-bold uppercase ${attachedContent.winnerId === uid ? 'text-emerald-400' : 'opacity-40'}`}>
                          {attachedContent.winnerId === uid ? '✔ Winner' : 'Exit_0'}
                        </span>
                     </div>
                   ))}
                </div>
             </div>
          )}
          {(type === 'resumo' || type === 'flashcard') && attachedContent && <div className="mb-2 -mx-1"><ShareContent content={attachedContent} onOpen={onOpenContent} /></div>}
          
          <p className={`${isEmojiOnly ? 'text-6xl drop-shadow-xl' : 'text-[14px]'} font-medium leading-relaxed whitespace-pre-wrap break-words tracking-tight`}>
            {text}
          </p>

          {!isEmojiOnly && (
            <div className={`flex items-center gap-2 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[9px] font-black uppercase tracking-tighter ${isOwn ? 'text-indigo-200/70' : 'text-slate-400'}`}>{formatChatTime(createdAt)}</span>
              {isOwn && <MessageStatus status={status} readBy={readBy} senderId={senderId} />}
            </div>
          )}
        </div>

        {isEmojiOnly && (
           <div className={`flex items-center gap-2 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
             <span className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">{formatChatTime(createdAt)}</span>
             {isOwn && <MessageStatus status={status} readBy={readBy} senderId={senderId} />}
           </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
export default ChatMessage;