/**
 * 👥 GROUP MEMBERS PREMIUM — Syntax Theme
 * * Painel de gerenciamento de nodes (membros) do Squad.
 * - Design: Squad Control Panel (Bordas táticas e badges de permissão)
 * - Features: Identificação de Root/Admin, status de rede e comandos de expurgo.
 */

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  UserMinus,
  LogOut,
  MessageSquareCode,
  Cpu,
  Terminal
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { Z } from '../../../../constants/zIndex';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';
import OnlineIndicator from '../shared/OnlineIndicator';

const GroupMembers = memo(
  ({ isOpen, onClose, group, membersData = [], onRemoveMember, onLeaveGroup, onMessage }) => {
    const { user } = useAuth();

    const isAdmin = group?.createdBy === user?.uid;
    const memberCount = membersData.length;

    const handleRemove = useCallback(
      (memberId) => {
        if (!window.confirm('Confirmar remoção deste node do Squad?')) return;
        onRemoveMember?.(memberId);
      },
      [onRemoveMember],
    );

    const handleLeave = useCallback(() => {
      if (!window.confirm('Executar comando Disconnect_Squad?')) return;
      onLeaveGroup?.();
    }, [onLeaveGroup]);

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Tech Blur */}
            <motion.div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
              style={{ zIndex: Z.modal - 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            
            <motion.div
              className="fixed inset-x-4 top-1/2 max-w-sm mx-auto"
              style={{ zIndex: Z.modal }}
              initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
              animate={{ opacity: 1, y: '-50%', scale: 1 }}
              exit={{ opacity: 0, y: '-45%', scale: 0.95 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-800 overflow-hidden max-h-[75vh] flex flex-col">
                
                {/* Header Estilo Terminal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-indigo-800/50">
                      <Cpu size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Squad_Nodes
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                        {memberCount} active_connections
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-500"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                </div>

                {/* Nodes list scrolável */}
                <div className="overflow-y-auto flex-1 p-4 space-y-2 custom-scrollbar">
                  {membersData.map((member) => {
                    const isSelf = member.uid === user?.uid;
                    const isCreator = member.uid === group?.createdBy;
                    const initials = getInitials(member.displayName);
                    const bg = getAvatarColor(member.displayName);

                    return (
                      <div
                        key={member.uid}
                        className="flex items-center gap-4 p-3 rounded-[18px] bg-slate-50/50 dark:bg-slate-950/30 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all group"
                      >
                        {/* Avatar Syntax Style */}
                        <div className="relative shrink-0">
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt=""
                              className="w-11 h-11 rounded-[12px] object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="w-11 h-11 rounded-[12px] flex items-center justify-center text-white text-[13px] font-black shadow-inner"
                              style={{ backgroundColor: bg }}
                            >
                              {initials}
                            </div>
                          )}
                          <OnlineIndicator
                            isOnline={member.isOnline || false}
                            isStudying={member.isStudying || false}
                            size="sm"
                            className="absolute -bottom-1 -right-1 ring-2 ring-white dark:ring-slate-900"
                          />
                        </div>

                        {/* Info Nodes */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate tracking-tight leading-none">
                              {member.displayName}
                              {isSelf && <span className="ml-1.5 text-[10px] text-indigo-500 font-black uppercase tracking-tighter">/you</span>}
                            </p>
                            {isCreator && (
                              <ShieldCheck
                                size={14}
                                className="text-amber-500 shrink-0 shadow-sm"
                                strokeWidth={2.5}
                              />
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                            {isCreator ? 'root_admin' : 'node_developer'}
                          </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                          {!isSelf && onMessage && (
                            <button
                              onClick={() => onMessage(member)}
                              className="p-2 rounded-[10px] bg-white dark:bg-slate-800 hover:text-indigo-500 shadow-sm transition-all active:scale-90"
                              title="Direct Chat"
                            >
                              <MessageSquareCode size={16} strokeWidth={2.5} />
                            </button>
                          )}
                          {isAdmin && !isSelf && (
                            <button
                              onClick={() => handleRemove(member.uid)}
                              className="p-2 rounded-[10px] bg-white dark:bg-slate-800 hover:text-rose-500 shadow-sm transition-all active:scale-90"
                              title="Terminate Connection"
                            >
                              <UserMinus size={16} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Disconnect Control */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/30 dark:bg-slate-900/50">
                  <button
                    onClick={handleLeave}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[18px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50 text-[13px] font-black uppercase tracking-[0.2em] transition-all active:scale-98"
                  >
                    <LogOut size={18} strokeWidth={3} />
                    Disconnect_Squad
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  },
);

GroupMembers.displayName = 'GroupMembers';
export default GroupMembers;