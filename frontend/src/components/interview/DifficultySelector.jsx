import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

const DifficultySelector = ({ selected, onSelect }) => {
  const levels = [
    { id: 'junior', label: 'Júnior', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'pleno', label: 'Pleno', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'senior', label: 'Sênior', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 'staff', label: 'Staff', icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {levels.map((level) => (
        <button
          key={level.id}
          onClick={() => onSelect(level.id)}
          className={`relative flex flex-col items-center gap-3 p-6 rounded-[28px] border transition-all duration-300 ${
            selected === level.id
              ? `bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-600/20`
              : `bg-slate-900 ${level.border} hover:border-white/20`
          }`}
        >
          <level.icon size={32} className={selected === level.id ? 'text-white' : level.color} />
          <span className={`font-black uppercase tracking-tighter ${selected === level.id ? 'text-white' : 'text-slate-300'}`}>
            {level.label}
          </span>
          
          {selected === level.id && (
            <motion.div
              layoutId="difficulty-glow"
              className="absolute inset-0 bg-white/5 rounded-[28px]"
              initial={false}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

DifficultySelector.displayName = 'DifficultySelector';

export default memo(DifficultySelector);
