/**
 * 🛰️ GROUP CREATE PREMIUM — Syntax Theme
 * * Modal para inicialização de novos Squads (Grupos de Colaboração).
 * - Design: Repository Config Style (Inputs táticos e tags de membros)
 * - Features: Busca indexada, limite dinâmico de nodes e feedback de criação.
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Plus, Loader2, Search, Check, TerminalSquare, Cpu, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const MAX_MEMBERS = 10;

const GroupCreate = memo(({ isOpen, onClose, friends = [], onCreateGroup }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredFriends = friends.filter((f) =>
    f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleFriend = useCallback((friend) => {
    setSelectedFriends((prev) => {
      const exists = prev.find((s) => s.uid === friend.uid);
      if (exists) return prev.filter((s) => s.uid !== friend.uid);
      if (prev.length >= MAX_MEMBERS - 1) return prev; // Node limit
      return [...prev, friend];
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const memberIds = selectedFriends.map((f) => f.uid);
      await onCreateGroup({
        name: name.trim(),
        description: description.trim(),
        memberIds,
      });
      toast.success('Squad inicializado com sucesso!');
      setName('');
      setDescription('');
      setSelectedFriends([]);
      onClose();
    } catch (err) {
      toast.error('Erro ao inicializar squad.');
    }
    setCreating(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Glassmorphism */}
          <motion.div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="fixed inset-x-4 top-1/2 z-[101] max-w-md mx-auto"
            initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
            animate={{ opacity: 1, y: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: '-45%', scale: 0.95 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col">
              
              {/* ─── Header Tech ─── */}
              <div className="relative bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-6 shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 flex items-center justify-center p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-all active:scale-90"
                  aria-label="Fechar"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-[14px] bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                    <TerminalSquare size={26} className="text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-[19px] font-black text-white tracking-tight leading-none">New_Squad</h3>
                    <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mt-1.5">Max: {MAX_MEMBERS} nodes</p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {/* Name Field */}
                <div className="mb-5">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                    Squad_Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Backend Masters 2026"
                    maxLength={50}
                    className="w-full px-4 py-3 rounded-[16px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-[14px] font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner"
                  />
                </div>

                {/* Description Field */}
                <div className="mb-6">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                    Logs_Description (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Defina o propósito do grupo"
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-[16px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 text-[14px] font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner"
                  />
                </div>

                {/* Selection Separator */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,1)]" />
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Add_Nodes ({selectedFriends.length}/{MAX_MEMBERS - 1})
                  </span>
                  <div className="flex-1 border-t border-slate-100 dark:border-slate-800" />
                </div>

                {/* Search nodes */}
                <div className="relative mb-5">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    strokeWidth={2.5}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar conexões..."
                    className="w-full pl-11 pr-4 py-3 rounded-[16px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[14px] font-medium text-slate-800 dark:text-slate-100 focus:outline-none transition-all"
                  />
                </div>

                {/* Selected tags */}
                {selectedFriends.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    <AnimatePresence>
                      {selectedFriends.map((f) => (
                        <motion.span
                          key={f.uid}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          onClick={() => toggleFriend(f)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-cyan-500/10 text-indigo-700 dark:text-cyan-400 text-[11px] font-black border border-indigo-100 dark:border-cyan-500/30 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-500 hover:border-rose-200 transition-all group"
                        >
                          {`@${f.displayName?.split(' ')[0]}`}
                          <X size={12} className="opacity-50 group-hover:opacity-100" />
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Nodes list */}
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredFriends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                       <Cpu size={32} className="text-slate-300 dark:text-slate-700 mb-3" />
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {friends.length === 0 ? 'No_Connections_Found' : 'Target_Not_Found'}
                      </p>
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const isSelected = selectedFriends.some((s) => s.uid === friend.uid);
                      const initials = getInitials(friend.displayName);
                      const bg = getAvatarColor(friend.displayName);

                      return (
                        <motion.div
                          key={friend.uid}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleFriend(friend)}
                          className={`flex items-center gap-3.5 p-3 rounded-[18px] cursor-pointer transition-all border-2 ${
                            isSelected
                              ? 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'
                          }`}
                        >
                          {friend.photoURL ? (
                            <img
                              src={friend.photoURL}
                              alt=""
                              className="w-10 h-10 rounded-[12px] object-cover shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white text-[13px] font-black shadow-inner"
                              style={{ backgroundColor: bg }}
                            >
                              {initials}
                            </div>
                          )}
                          <span className={`flex-1 text-[14px] font-bold ${isSelected ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'} truncate`}>
                            {friend.displayName}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-[8px] border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className={`
                    w-full py-4 rounded-[18px] font-black text-[14px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
                    ${!name.trim() || creating 
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 active:scale-[0.98]'
                    }
                  `}
                >
                  {creating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={18} strokeWidth={3} /> Initialize_Squad
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

GroupCreate.displayName = 'GroupCreate';
export default GroupCreate;