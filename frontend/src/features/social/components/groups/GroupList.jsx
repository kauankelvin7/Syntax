/**
 * 🛰️ GROUP LIST PREMIUM — Syntax Theme
 * * Diretório de Squads (Grupos) com monitoramento de atividade em tempo real.
 * - Design: Squad Directory Style (Bordas táticas e hierarquia de logs)
 * - Features: Preview inteligente de mensagens e botões de ação estilo IDE.
 */

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Terminal, ChevronRight, Code2, Cpu } from 'lucide-react';
import { formatChatTime } from '../../utils/chatHelpers';

const GroupList = memo(({ groups, onSelectGroup, onCreateGroup }) => {
  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 opacity-80">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-xl shadow-indigo-500/5">
            <Users size={32} className="text-indigo-500" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-[17px] font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
          {`> Zero_Squads_Active`}
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center mb-8 max-w-[240px] leading-relaxed font-medium">
          Nenhum squad de engenharia detectado. Inicialize um grupo para compartilhar stacks!
        </p>
        <button
          onClick={onCreateGroup}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Create_Squad
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1">
      {/* Create Action Row */}
      <button
        onClick={onCreateGroup}
        className="group w-full flex items-center gap-4 p-4 rounded-[22px] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-all duration-300"
      >
        <div className="w-11 h-11 rounded-[14px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-cyan-500 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all border border-transparent group-hover:border-cyan-200 dark:group-hover:border-cyan-800">
          <Plus size={20} strokeWidth={3} />
        </div>
        <div className="text-left">
          <p className="text-[14px] font-black text-slate-700 dark:text-slate-200 tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Inicializar Novo Squad</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Setup new repository</p>
        </div>
      </button>

      <div className="flex items-center gap-2 px-2 mt-6 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Active_Squads ({groups.length})</h4>
      </div>

      <AnimatePresence mode="popLayout">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            onClick={() => onSelectGroup(group)}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group flex items-center gap-4 p-4 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 cursor-pointer"
          >
            {/* Group Avatar Tech Style */}
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-[16px] bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:rotate-2 transition-transform border-2 border-white dark:border-slate-800 overflow-hidden">
                {group.photoURL ? (
                  <img
                    src={group.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Code2 size={24} className="text-white" strokeWidth={2} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-[6px] border-2 border-white dark:border-slate-900 shadow-sm min-w-[20px] text-center">
                {group.participants?.length || 0}
              </div>
            </div>

            {/* Info Logs */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-[15px] font-black text-slate-900 dark:text-white truncate tracking-tight leading-none">
                  {group.groupName}
                </h4>
                {group.lastMessage?.timestamp && (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 uppercase tracking-tighter">
                    {formatChatTime(group.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              
              {group.lastMessage ? (
                <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  {group.lastMessage.senderName ? (
                    <span className="font-black text-indigo-600 dark:text-cyan-500 text-[11px] uppercase tracking-tighter">{group.lastMessage.senderName.split(' ')[0]}: </span>
                  ) : null}
                  {group.lastMessage.text}
                </p>
              ) : (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1">
                  {group.description || 'Awaiting first commit...'}
                </p>
              )}
            </div>

            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <ChevronRight size={18} className="text-cyan-500" strokeWidth={3} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

GroupList.displayName = 'GroupList';
export default GroupList;