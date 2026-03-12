/**
 * 🔍 FRIEND SEARCH PREMIUM — Syntax Theme
 * * Busca de desenvolvedores com debounce e indexação em tempo real.
 * - Input: Command Palette Style (Foco em Cyan Neon)
 * - Result cards: Code Block Geometry
 * - Integração fluida com o protocolo de conexões Syntax.
 */

import React, { memo, useState, useRef, useCallback } from 'react';
import { Search, UserPlus, Clock, Check, Loader2, Terminal, BookCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const FriendSearch = memo(({ onSearch, onSendRequest, sentRequests = [], friends = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState({});
  const debounceRef = useRef(null);

  const sentUserIds = new Set(sentRequests.map((r) => r.requestedTo));
  const friendUserIds = new Set(friends.map((f) => f.uid));

  const handleSearch = useCallback((value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await onSearch(value.trim());
        setResults(data || []);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300); 
  }, [onSearch]);

  const handleSendRequest = async (targetUser) => {
    const targetComUid = { ...targetUser, uid: targetUser.uid || targetUser.id || null };
    setSending((prev) => ({ ...prev, [targetComUid.uid]: true }));
    try {
      await onSendRequest(targetComUid);
      toast.success(`Request enviada para ${targetComUid.displayName.split(' ')[0]}!`);
    } catch (err) {
      toast.error('Falha ao enviar request.');
    }
    setSending((prev) => ({ ...prev, [targetComUid.uid]: false }));
  };

  const getStatus = (userId) => {
    if (friendUserIds.has(userId)) return 'friend';
    if (sentUserIds.has(userId)) return 'pending';
    return 'none';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } }
  };

  return (
    <div className="space-y-8">
      {/* ─── Search Input (Command Palette Style) ─── */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={20} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors duration-300" strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Pesquisar dev por nome ou e-mail..."
          className="w-full pl-12 pr-14 py-4.5 text-[15px] font-bold rounded-[20px] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-inner"
          autoFocus
        />
        {searching && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <Loader2 size={20} className="animate-spin text-cyan-500" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* ─── Search Results ─── */}
      <AnimatePresence mode="wait">
        {results.length > 0 && !searching ? (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="space-y-3 max-h-[55vh] overflow-y-auto custom-scrollbar pr-2"
          >
            <div className="flex items-center gap-2 px-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Index_Matches ({results.length})</p>
            </div>
            
            {results.map((resUser) => {
              const status = getStatus(resUser.uid);
              const initials = getInitials(resUser.displayName);
              const avatarBg = getAvatarColor(resUser.displayName);

              return (
                <motion.div
                  variants={itemVariants}
                  key={resUser.uid || resUser.email}
                  className="flex items-center gap-4 p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-cyan-500/30 transition-all duration-300 group"
                >
                  {/* Avatar Syntax Style */}
                  <div className="relative shrink-0">
                    {resUser.photoURL ? (
                      <img src={resUser.photoURL} alt="" className="w-13 h-13 rounded-[16px] object-cover border-2 border-transparent group-hover:rotate-2 transition-all shadow-sm" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-13 h-13 rounded-[16px] flex items-center justify-center text-white text-[15px] font-black shadow-inner group-hover:rotate-2 transition-all" style={{ backgroundColor: avatarBg }}>
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-black text-slate-900 dark:text-white truncate tracking-tight leading-none mb-1.5">
                      {resUser.displayName}
                    </p>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <BookCode size={12} className="text-indigo-500" />
                      <p className="text-[11px] font-bold truncate uppercase tracking-widest">
                        {resUser.institution || 'Dev_Node'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    {status === 'friend' ? (
                      <div className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50" title="Connected">
                        <Check size={22} strokeWidth={3.5} />
                      </div>
                    ) : status === 'pending' ? (
                      <div className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50" title="Pending Handshake">
                        <Clock size={22} strokeWidth={3} />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(resUser)}
                        disabled={sending[resUser.uid]}
                        className="flex items-center gap-2 px-5 py-3 rounded-[14px] bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black text-[12px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:shadow-cyan-500/20 transition-all disabled:opacity-50 active:scale-95"
                      >
                        {sending[resUser.uid] ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} strokeWidth={3} />}
                        <span className="hidden sm:inline">Connect</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : query.trim().length >= 2 && !searching ? (
          /* Empty State Tech Style */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center px-6 opacity-60">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[28px] flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-800 shadow-inner">
              <Terminal size={36} className="text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-black text-slate-800 dark:text-slate-300 tracking-tight">{`> User_Not_Found`}</p>
            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
              Verifique os parâmetros de busca ou tente o identificador único.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

FriendSearch.displayName = 'FriendSearch';
export default FriendSearch;