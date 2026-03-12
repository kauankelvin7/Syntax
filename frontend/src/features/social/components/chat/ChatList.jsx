/**
 * 📱 CHAT LIST
 * * Lista de conexões otimizada com hierarquia visual de engenharia.
 * - Suporte a badges dinâmicos (Cyan Neon) e previews inteligentes
 * - Diferenciação visual entre Squads (Grupos) e Diretos
 * - Feedback tátil estilo IDE
 */

import React, { memo } from 'react';
import { MessageCircle, Terminal, Swords, FileCode, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import OnlineIndicator from '../shared/OnlineIndicator';
import { formatMessageTime, truncateText, getInitials, getAvatarColor } from '../../utils/chatHelpers';

const ChatList = memo(({ conversations, friendsStatus, onSelectConversation }) => {
  const { user } = useAuth();

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-20 h-20 rounded-[24px] bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800 shadow-inner">
          <Terminal size={32} className="text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
          {`> No_Connections_Found`}
        </h3>
        <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-3 max-w-[220px] leading-relaxed font-bold">
          Inicialize uma conversa com um dev para começar a trocar snippets!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 px-1">
      {conversations.map((conv) => {
        const otherUid = conv.participants?.find((uid) => uid !== user?.uid);
        const otherData = conv.participantsData?.[otherUid] || {};
        const unreadCount = conv.unreadCount?.[user?.uid] || 0;
        const status = friendsStatus?.[otherUid];
        const isOnline = status?.isOnline || false;
        const isStudying = status?.isStudying || false;

        const displayName = conv.type === 'group'
          ? conv.groupName || 'Squad de Desenvolvimento'
          : otherData.displayName || 'Dev Anonymous';

        const initials = getInitials(displayName);
        const avatarBg = getAvatarColor(displayName);
        const photoURL = conv.type === 'group' ? conv.groupPhoto : otherData.photoURL;

        // Preview de conteúdo inteligente (Contexto Tech)
        const renderPreview = () => {
          if (!conv.lastMessage) return 'Aguardando inicialização...';
          const prefix = conv.lastMessage.senderId === user?.uid ? 'Você: ' : '';
          
          if (conv.lastMessage.type === 'challenge_invite') 
            return <span className="text-orange-500 font-bold flex items-center gap-1.5"><Swords size={13} /> Code Battle!</span>;
          
          if (conv.lastMessage.type === 'resumo') 
            return <span className="text-cyan-500 font-bold flex items-center gap-1.5"><FileCode size={13} /> Snippet compartilhado</span>;
          
          return `${prefix}${truncateText(conv.lastMessage.text || '', 32)}`;
        };

        return (
          <motion.div
            key={conv.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectConversation(conv)}
            className={`
              relative flex items-center gap-4 px-4 py-4 rounded-[24px] cursor-pointer transition-all duration-300 group
              ${unreadCount > 0
                ? 'bg-cyan-50/40 dark:bg-cyan-900/10 border border-cyan-100/50 dark:border-cyan-800/30 shadow-sm'
                : 'hover:bg-white dark:hover:bg-slate-900/80 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none'
              }
            `}
          >
            {/* Indicador lateral de Unread (Cyan Glow) */}
            {unreadCount > 0 && (
              <div className="absolute left-1.5 w-1 h-10 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            )}

            {/* Avatar Section */}
            <div className="relative shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className={`w-14 h-14 object-cover shadow-sm transition-all duration-500 group-hover:rotate-3 ${conv.type === 'group' ? 'rounded-[18px]' : 'rounded-full border-2 border-white dark:border-slate-800'}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className={`w-14 h-14 flex items-center justify-center text-white text-[15px] font-black shadow-inner ${conv.type === 'group' ? 'rounded-[18px]' : 'rounded-full'}`}
                  style={{ backgroundColor: avatarBg }}
                >
                  {conv.type === 'group' ? <Sparkles size={22} /> : initials}
                </div>
              )}
              
              {conv.type === 'direct' && (
                <div className="absolute -bottom-0.5 -right-0.5 ring-4 ring-white dark:ring-slate-900 rounded-full">
                  <OnlineIndicator isOnline={isOnline} isStudying={isStudying} size="md" pulse />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className={`text-[15px] truncate tracking-tight ${unreadCount > 0 ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                  {displayName}
                </h4>
                {conv.lastMessage?.timestamp && (
                  <span className={`text-[10px] font-black uppercase tracking-tighter shrink-0 ${unreadCount > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                    {formatMessageTime(conv.lastMessage.timestamp)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className={`text-[13px] truncate ${unreadCount > 0 ? 'text-slate-800 dark:text-slate-100 font-bold' : 'text-slate-500 dark:text-slate-500 font-medium'}`}>
                  {renderPreview()}
                </p>
                
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0.5, rotate: -10 }} 
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-[8px] bg-cyan-500 text-white text-[10px] font-black shadow-lg shadow-cyan-500/30"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

ChatList.displayName = 'ChatList';
export default ChatList;