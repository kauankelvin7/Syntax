/**
 * 🏆 CONQUISTAS PREMIUM - Syntax Theme
 * * Milestones Dashboard: Telemetria de conquistas e contribuições do Node.
 * - Design: Certification Style (Glow neon e bordas táticas)
 * - Features: Filtros indexados, progresso em tempo real e estados de bloqueio.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Award, Star, Zap, Cpu, Code2, Database, Target, Flame, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useConquistas } from '../utils/useConquistas';

const CATEGORIAS = ['Todas', 'Flashcards', 'Resumos', 'Matérias', 'Simulados', 'Streak'];

function Conquistas() {
  const { user } = useAuth();
  const userId = user?.id || user?.uid;
  const { conquistas, loading, totalDesbloqueadas, totalConquistas, percentual, stats } = useConquistas(userId);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');

  const conquistasFiltradas = useMemo(() => {
    if (categoriaAtiva === 'Todas') return conquistas;
    return conquistas.filter(c => c.categoria === categoriaAtiva);
  }, [conquistas, categoriaAtiva]);

  const desbloqueadas = conquistasFiltradas.filter(c => c.desbloqueada);
  const bloqueadas = conquistasFiltradas.filter(c => !c.desbloqueada);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-20 h-20 border-[3px] border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <Trophy className="absolute inset-0 m-auto text-amber-500/40" size={28} />
          </div>
          <p className="mt-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-pulse">
            Scanning_Milestones...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950 pb-32">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        
        {/* ─── Header Tech ─── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-[22px] flex items-center justify-center shadow-2xl">
              <Trophy size={32} className="text-white dark:text-slate-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-1">
                Node_Milestones
              </h1>
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Star size={14} className="text-amber-500" />
                Unlock system achievements through uptime
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Hero Progress Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-slate-900 rounded-[32px] p-8 sm:p-10 mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-800"
        >
          <div className="absolute top-[-20%] right-[-5%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
              <div>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" /> Global_Performance_Index
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black text-white tracking-tighter">{totalDesbloqueadas}</span>
                  <span className="text-2xl font-black text-slate-600 uppercase">/ {totalConquistas} units</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="text-5xl font-black bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent tracking-tighter">
                  {percentual}%
                </span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Efficiency_Rate</p>
              </div>
            </div>
            
            <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner p-1">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${percentual}%` }}
                transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] relative"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ─── Telemetry Mini Cards ─── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {[
              { label: 'Logic', value: stats.flashcards, icon: Code2, color: 'text-indigo-500' },
              { label: 'Docs', value: stats.resumos, icon: Database, color: 'text-cyan-500' },
              { label: 'Stacks', value: stats.materias, icon: Activity, color: 'text-emerald-500' },
              { label: 'Suites', value: stats.simulados, icon: Target, color: 'text-rose-500' },
              { label: 'Peak', value: `${stats.bestSimulado}%`, icon: Zap, color: 'text-amber-500' },
              { label: 'Uptime', value: stats.streak, icon: Flame, color: 'text-orange-500' },
            ].map((s, i) => (
              <motion.div 
                key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] p-5 text-center shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 mx-auto rounded-[12px] bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <s.icon size={18} className={s.color} strokeWidth={2.5} />
                </div>
                <p className="text-[18px] font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">{s.value}</p>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── Category Filter (Tab Style) ─── */}
        <div className="flex gap-2 p-2 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[24px] mb-12 overflow-x-auto no-scrollbar shadow-inner">
          {CATEGORIAS.map(cat => (
            <button
              key={cat} onClick={() => setCategoriaAtiva(cat)}
              className={`relative flex-1 py-3.5 px-6 rounded-[18px] text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-[120px]
                ${categoriaAtiva === cat ? 'text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              {categoriaAtiva === cat && (
                <motion.div layoutId="activeCatAchieve" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[18px] shadow-lg border border-slate-200 dark:border-slate-700" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>

        {/* ─── Unlocked Section ─── */}
        {desbloqueadas.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]" />
              <h2 className="text-[14px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">Verified_Contributions</h2>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full">{desbloqueadas.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {desbloqueadas.map((c, i) => (
                <motion.div
                  key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="group bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 flex items-center gap-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[22px] flex items-center justify-center text-4xl flex-shrink-0 shadow-lg shadow-amber-500/20 border-2 border-white dark:border-amber-800 relative z-10 group-hover:scale-110 transition-transform">
                    {c.icon}
                  </div>
                  <div className="min-w-0 flex-1 relative z-10">
                    <p className="font-black text-[18px] text-slate-900 dark:text-white truncate mb-1 tracking-tight">{c.titulo}</p>
                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 leading-snug mb-3">{c.desc}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700">{c.categoria}</span>
                      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                      <Award size={16} className="text-amber-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Locked Section ─── */}
        {bloqueadas.length > 0 && (
          <div className="opacity-70">
            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <h2 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em]">Pending_Synchronizations</h2>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-full">{bloqueadas.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {bloqueadas.map((c, i) => (
                <motion.div
                  key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-slate-100/50 dark:bg-slate-900/40 rounded-[28px] p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-6"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 dark:bg-slate-800 rounded-[22px] flex items-center justify-center text-3xl flex-shrink-0 grayscale opacity-40 border border-slate-300 dark:border-slate-700">
                    {c.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-[16px] text-slate-400 dark:text-slate-600 mb-1">{c.titulo}</p>
                    <p className="text-[12px] font-bold text-slate-400 dark:text-slate-700 leading-snug">{c.desc}</p>
                  </div>
                  <Lock size={18} className="text-slate-300 dark:text-slate-700" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Empty State ─── */}
        {conquistasFiltradas.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center opacity-60">
            <Terminal size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" strokeWidth={1.5} />
            <h3 className="text-[18px] font-black text-slate-800 dark:text-slate-200 tracking-tight">{`> No_Milestones_Found`}</h3>
            <p className="text-[14px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">Mude os parâmetros do Scanner para localizar novos objetivos.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Conquistas;