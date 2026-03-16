import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, MessageSquare, LogOut, Settings, 
  ChevronRight, Info, ShieldCheck, Zap,
  Layers, Clock, Trophy, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Z } from '../../constants/zIndex';
import { sendMessage, updatePomodoro } from '../../services/roomService';
import RoomPomodoro from './RoomPomodoro';
import RoomChat from './RoomChat';
import RoomParticipants from './RoomParticipants';

const RoomSession = ({ room, messages, user, onLeave, onDeleteRoom }) => {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const isOwner = room?.ownerId === user?.uid;

  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages.length, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

  const handleSendMessage = useCallback(async (text) => {
    if (!room?.id || !user) return;
    try {
      await sendMessage(room.id, {
        text,
        uid: user.uid,
        userName: user.displayName || 'Dev Anonymous',
        userAvatar: user.photoURL || ''
      });
    } catch (error) {
      toast.error('Erro ao enviar mensagem.');
    }
  }, [room?.id, user]);

  const handleUpdatePomodoro = useCallback(async (pomodoroData) => {
    if (!room?.id || !isOwner) return;
    try {
      await updatePomodoro(room.id, pomodoroData);
    } catch (error) {
      toast.error('Erro ao atualizar timer.');
    }
  }, [room?.id, isOwner]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden"
      style={{ zIndex: Z.onboarding, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <header className="h-16 shrink-0 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">
                {room?.name}
              </h2>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase border border-indigo-500/20">
                {room?.topic}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              {isOwner ? 'Você é o dono · Sessão Ativa' : 'Sessão de Estudo Ativa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Chat (desktop) */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              isChatOpen 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat</span>
          </button>

          {/* Encerrar sala — apenas para o dono */}
          {isOwner && onDeleteRoom && (
            <button
              onClick={onDeleteRoom}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest border border-rose-500/20"
              title="Encerrar e apagar esta sala"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Encerrar Sala</span>
            </button>
          )}

          {/* Sair da sala */}
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Participants Sidebar (Desktop) */}
        <div className="hidden md:block w-64 lg:w-72 border-r border-slate-200 dark:border-white/5 overflow-hidden">
          <RoomParticipants participants={room?.participants} ownerId={room?.ownerId} />
        </div>

        {/* Mobile: Horizontal Participants Strip */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 z-10 flex items-center px-4 gap-2 overflow-x-auto scrollbar-none">
          {Object.values(room?.participants ?? {}).map(p => (
            <div key={p.uid} className="shrink-0 relative">
              <img 
                src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=6366f1&color=fff`}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10"
                alt={p.name}
              />
              {p.uid === room?.ownerId && (
                <div className="absolute -top-1 -right-1 p-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                  <ShieldCheck size={8} className="text-amber-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Central Content: Pomodoro */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 mt-14 md:mt-0 overflow-y-auto">
          <RoomPomodoro 
            pomodoro={room?.pomodoro} 
            isOwner={isOwner} 
            onUpdate={handleUpdatePomodoro} 
          />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-6 rounded-[28px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 max-w-lg w-full flex items-start gap-4 shadow-sm"
          >
            <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
              <Zap size={24} />
            </div>
            <div>
              <span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Dica de Foco</span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                "O aprendizado em grupo aumenta a retenção em até 70%. Aproveite o chat para tirar dúvidas rápidas entre os ciclos de foco."
              </p>
            </div>
          </motion.div>
        </div>

        {/* Chat Sidebar (Desktop) */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="hidden lg:flex w-80 xl:w-96 border-l border-slate-200 dark:border-white/5 flex-col"
            >
              <RoomChat messages={messages} onSend={handleSendMessage} currentUser={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Chat Button & Drawer (Mobile/Tablet) */}
      <div className="lg:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-600/40 border border-white/10 z-30"
        >
          <MessageSquare size={24} className="text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-slate-100 dark:border-slate-950 flex items-center justify-center text-[10px] font-black text-white">
              {unreadCount}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {(isChatOpen && window.innerWidth < 1024) && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsChatOpen(false)}
                className="fixed inset-0 bg-slate-100/60 dark:bg-slate-950/60 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 h-[80vh] bg-white dark:bg-slate-900 rounded-t-[38px] border-t border-slate-200 dark:border-white/10 flex flex-col z-50 overflow-hidden"
              >
                <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Chat da Sala</span>
                  </div>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1">
                  <RoomChat messages={messages} onSend={handleSendMessage} currentUser={user} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

RoomSession.displayName = 'RoomSession';

export default memo(RoomSession);