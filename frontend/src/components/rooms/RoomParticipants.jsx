import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Clock } from 'lucide-react';

const RoomParticipants = ({ participants, ownerId }) => {
  const list = Object.values(participants || {}).sort((a, b) => {
    // Owner sempre no topo
    if (a.uid === ownerId) return -1;
    if (b.uid === ownerId) return 1;
    return (a.joinedAt?.seconds || 0) - (b.joinedAt?.seconds || 0);
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/30">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
          Participantes ({list.length})
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {list.map((p) => {
          const isOwner = p.uid === ownerId;
          
          return (
            <motion.div
              layout
              key={p.uid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="relative">
                <img
                  src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=6366f1&color=fff`}
                  alt={p.name}
                  className="w-8 h-8 rounded-lg object-cover border border-white/10 group-hover:border-indigo-500/50 transition-colors"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=6366f1&color=fff`;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                  {isOwner && <ShieldCheck size={12} className="text-amber-500 shrink-0" />}
                </div>
                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  {isOwner ? 'Anfitrião' : 'Explorador'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

RoomParticipants.displayName = 'RoomParticipants';

export default memo(RoomParticipants);
