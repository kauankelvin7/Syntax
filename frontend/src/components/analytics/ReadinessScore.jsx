import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Clock, ChevronRight, Info } from 'lucide-react';

const ReadinessScore = ({ score, level = 'Pleno', breakdown }) => {
  const getColor = (s) => {
    if (!s || s === 0) return 'text-slate-700';
    if (s < 40) return 'text-rose-500';
    if (s < 70) return 'text-amber-500';
    if (s < 90) return 'text-indigo-400';
    return 'text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
  };

  const getGaugeColor = (s) => {
    if (!s || s === 0) return '#1e293b';
    if (s < 40) return '#f43f5e';
    if (s < 70) return '#f59e0b';
    if (s < 90) return '#818cf8';
    return '#10b981';
  };

  const radius = 90;
  const circumference = Math.PI * radius; // Meio círculo
  const offset = circumference - ((score || 0) / 100) * circumference;

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[28px] p-8 shadow-xl h-full flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
        <Trophy size={180} />
      </div>

      <div className="flex items-center gap-3 mb-8 self-start relative z-10">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
          <Trophy size={20} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Readiness Score</h3>
      </div>

      {/* Semicircular Gauge */}
      <div className="relative flex items-center justify-center h-48 mb-4 relative z-10">
        <svg width="240" height="140" className="rotate-180">
          <circle
            cx="120"
            cy="20"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
          <motion.circle
            cx="120"
            cy="20"
            r={radius}
            fill="transparent"
            stroke={getGaugeColor(score)}
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-2 text-center">
            <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-6xl font-black tracking-tighter tabular-nums ${getColor(score)}`}
            >
                {score || '--'}
            </motion.span>
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Score Global</span>
        </div>
      </div>

      <div className="text-center mb-8 relative z-10">
        {score > 0 ? (
          <>
            <h4 className="text-lg font-black text-white uppercase tracking-tighter">
                Pronto para vagas <span className={getColor(score)}>{level}</span>
            </h4>
            <p className="text-xs font-bold text-slate-500 italic mt-1">
                "Com seu ritmo atual, atingirá 80 em ~3 semanas."
            </p>
          </>
        ) : (
          <>
            <h4 className="text-lg font-black text-slate-700 uppercase tracking-tighter">
                Dados insuficientes
            </h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Selecione uma trilha de carreira para calcular seu score
            </p>
          </>
        )}
      </div>

      {/* Breakdown Bars */}
      <div className="w-full space-y-4 relative z-10">
        <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                <span>Retenção SM-2</span>
                <span className="text-indigo-400">{breakdown?.sm2Score ? `${Math.round(breakdown.sm2Score / 0.3)}%` : '0%'}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: breakdown?.sm2Score ? `${Math.round(breakdown.sm2Score / 0.3)}%` : '0%' }} className="h-full bg-indigo-500" />
            </div>
        </div>
        <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                <span>Simulados</span>
                <span className="text-cyan-400">{breakdown?.simuladoScore ? `${Math.round(breakdown.simuladoScore / 0.25)}%` : '0%'}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: breakdown?.simuladoScore ? `${Math.round(breakdown.simuladoScore / 0.25)}%` : '0%' }} className="h-full bg-cyan-500" />
            </div>
        </div>
        <div className="space-y-1">
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                <span>Roadmap</span>
                <span className="text-purple-400">{breakdown?.roadmapScore ? `${Math.round(breakdown.roadmapScore / 0.25)}%` : '0%'}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: breakdown?.roadmapScore ? `${Math.round(breakdown.roadmapScore / 0.25)}%` : '0%' }} className="h-full bg-purple-500" />
            </div>
        </div>
      </div>

      <button className="mt-8 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] hover:text-indigo-300 transition-colors group relative z-10">
          Como melhorar? <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

ReadinessScore.displayName = 'ReadinessScore';

export default memo(ReadinessScore);
