import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Users, Lock, ChevronRight, Clock } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const configs = {
    waiting: { label: 'Aguardando', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20' },
    studying: { label: 'Estudando', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20' },
    break: { label: 'Pausa', class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20' },
    finished: { label: 'Finalizada', class: 'bg-slate-500/10 text-slate-600 dark:text-slate-500 border-slate-500/20' },
  };

  const config = configs[status] || configs.waiting;

  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${config.class}`}>
      {config.label}
    </span>
  );
};

const ParticipantAvatars = ({ participants, max = 4 }) => {
  const list = Object.values(participants || {});
  const display = list.slice(0, max);
  const extra = list.length - max;

  return (
    <div className="flex -space-x-2 overflow-hidden">
      {display.map((p, idx) => (
        <img
          key={p.uid || idx}
          src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=6366f1&color=fff`}
          alt={p.name}
          className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover shadow-sm"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=6366f1&color=fff`;
          }}
        />
      ))}
      {extra > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-500 ring-2 ring-white dark:ring-slate-900 shadow-sm">
          +{extra}
        </div>
      )}
    </div>
  );
};

const RoomCard = ({ room, onJoin }) => {
  const participantCount = Object.keys(room.participants ?? {}).length;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onJoin(room)}
      className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-white/5 
                 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 
                 hover:border-indigo-500/30 transition-all duration-300 flex flex-col h-full"
    >
      {/* Faixa colorida no topo */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
      
      <div className="p-5 flex-1">
        {/* Nome + badge status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight line-clamp-2 uppercase tracking-tighter">
            {room.name}
          </h3>
          <StatusBadge status={room.status} />
        </div>
        
        {/* Tópico */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
                         bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400
                         border border-indigo-100 dark:border-indigo-800/50">
            {room.topic}
          </span>
        </div>
        
        {/* Participantes */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <ParticipantAvatars participants={room.participants} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {participantCount}/{room.maxParticipants} Devs
            </span>
          </div>
          {room.status === 'studying' && (
            <div className="flex items-center gap-1 text-emerald-500">
              <Clock size={12} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase">Foco</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/50
                    border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        {room.isPrivate ? (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Lock size={12} /> Privada
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Users size={12} /> Pública
          </div>
        )}
        <div className="flex items-center gap-1 text-indigo-500 text-[10px] font-black uppercase tracking-widest group">
          <span>{room.status === 'studying' ? 'Ver Sessão' : 'Entrar Agora'}</span>
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

RoomCard.displayName = 'RoomCard';

export default memo(RoomCard);
