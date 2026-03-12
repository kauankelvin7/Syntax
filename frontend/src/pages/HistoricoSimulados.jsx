/**
 * 📊 SYSTEM_REPORTS (Histórico de Simulados) — Syntax Theme
 * * Logs detalhados de Test_Suites e ciclos de simulação.
 * - Features: Weak_Point mapping, Performance analytics e Logic_Unit Patching.
 * - Design: High-Fidelity Terminal Dashboard.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Clock,
  ChevronRight,
  ArrowLeft,
  Target,
  AlertTriangle,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  CalendarDays,
  History,
  Activity,
  Cpu,
  Terminal,
  FileSearch
} from 'lucide-react';
import { listarSimulados, criarFlashcard } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
import { toast } from 'sonner';
import Button from '../components/ui/Button';

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

const formatTime = (s) => {
  if (!s || s <= 0) return '00:00';
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = dateStr?.toDate?.() || new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getScoreColor = (score) => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-rose-500';
};

const getScoreBg = (score) => {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-rose-500/10 border-rose-500/30';
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

function HistoricoSimulados() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimulado, setSelectedSimulado] = useState(null);
  const [flashcardStatus, setFlashcardStatus] = useState({});

  useEffect(() => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    listarSimulados(userId)
      .then(setSimulados)
      .catch(err => console.error('Telemetria_Fetch_Error:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    if (simulados.length === 0) return { total: 0, media: 0, melhor: 0, tempoTotal: 0 };
    const scores = simulados.map(s => s.score || 0);
    return {
      total: simulados.length,
      media: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      melhor: Math.max(...scores),
      tempoTotal: simulados.reduce((a, s) => a + (s.tempoSegundos || 0), 0),
    };
  }, [simulados]);

  const weakPoints = useMemo(() => {
    if (simulados.length === 0) return [];
    const map = {};
    simulados.forEach(sim => {
      const tema = sim.tema || 'Main_System';
      if (!map[tema]) map[tema] = { tema, total: 0, errors: 0 };
      (sim.questoes || []).forEach(q => {
        map[tema].total++;
        if (!q.acertou) map[tema].errors++;
      });
    });
    return Object.values(map)
      .filter(t => t.errors > 0)
      .map(t => ({ ...t, pct: Math.round((t.errors / t.total) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [simulados]);

  const handleCriarFlashcard = useCallback(async (sim, q, key) => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    setFlashcardStatus(prev => ({ ...prev, [key]: 'loading' }));
    
    const respostaCorreta = q.opcoes?.[q.correta] ?? 'Consult Documentation';
    const resposta = q.explicacao ? `${respostaCorreta}\n\n[LOG]: ${q.explicacao}` : respostaCorreta;
    
    try {
      await criarFlashcard(
        { pergunta: q.pergunta, resposta, materiaId: null, materiaNome: sim.tema, materiaCor: '#6366F1' },
        null,
        userId
      );
      setFlashcardStatus(prev => ({ ...prev, [key]: 'done' }));
      toast.success('Logic_Unit_Patched: Enviado para o bando de dados.');
    } catch {
      setFlashcardStatus(prev => ({ ...prev, [key]: 'error' }));
      toast.error('Patch_Failure.');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
          <div className="w-20 h-20 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_History_Logs...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto">
        
        {/* ─── HEADER ─── */}
        <motion.div className="mb-12" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <button onClick={() => navigate('/simulados')} className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center hover:border-indigo-500/50 transition-all shadow-xl active:scale-95 group shrink-0">
              <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300 group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-1">
                System_Report_Logs
              </h1>
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity size={14} className="text-indigo-500" /> Compiled <span className="text-white">{stats.total} test_cycles</span> in current environment
              </p>
            </div>
          </div>

          {/* ─── METRICS GRID ─── */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { icon: <Target size={20} />, label: 'Avg_Success', value: `${stats.media}%`, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { icon: <Trophy size={20} />, label: 'Peak_Performance', value: `${stats.melhor}%`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { icon: <Cpu size={20} />, label: 'Cycles_Executed', value: stats.total, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { icon: <Clock size={20} />, label: 'Uptime_Total', value: formatTime(stats.tempoTotal), color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                  <div className={`w-10 h-10 rounded-[12px] ${stat.bg} flex items-center justify-center mb-4 ${stat.color} shadow-inner`}>
                    {stat.icon}
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter mb-1">{stat.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ─── WEAK_POINT_DETECTION (Arquitetura Syntax) ─── */}
          {weakPoints.length > 0 && (
            <motion.div className="mb-12 bg-slate-900 border-2 border-amber-500/20 rounded-[32px] p-8 relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] pointer-events-none" />
              <h2 className="flex items-center gap-3 text-[12px] font-black text-white mb-8 uppercase tracking-[0.3em]">
                <AlertTriangle size={16} className="text-amber-500" strokeWidth={3} /> System_Vulnerabilities (Patch Recommended)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {weakPoints.map(pt => (
                  <div key={pt.tema} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-black text-slate-300 uppercase tracking-tight">{pt.tema}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 border ${pt.pct >= 60 ? 'text-rose-500 border-rose-500/30' : 'text-amber-500 border-amber-500/30'}`}>
                        {pt.pct}% FAIL_RATE
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pt.pct}%` }} transition={{ duration: 1 }} className={`h-full ${pt.pct >= 60 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ─── RUN_HISTORY_LIST ─── */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-4 mb-6">Recent_Cycles_Executed</h2>
          
          {simulados.length === 0 ? (
            <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <Terminal size={48} className="mx-auto text-slate-700 mb-6" />
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Waiting_for_initial_deployment...</p>
               <Button onClick={() => navigate('/simulados')} className="mt-8 bg-indigo-600 !rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[11px]">Run_First_Test</Button>
            </div>
          ) : simulados.map((sim, idx) => (
            <motion.div key={sim.id} onClick={() => setSelectedSimulado(sim)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="group bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-5 rounded-[28px] cursor-pointer hover:border-indigo-500 transition-all flex items-center gap-6"
            >
              <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${getScoreBg(sim.score)}`}>
                <span className={`text-2xl font-black font-mono tracking-tighter ${getScoreColor(sim.score)}`}>{sim.score}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest ${getScoreColor(sim.score)} opacity-60`}>Success</span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 group-hover:text-indigo-500 transition-colors">{sim.tema}</h3>
                <div className="flex flex-wrap gap-4">
                   <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                     <Target size={12} className="text-indigo-500" /> {sim.acertos}/{sim.total} Units
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                     <Clock size={12} className="text-amber-500" /> {formatTime(sim.tempoSegundos)}
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                     <CalendarDays size={12} className="text-emerald-500" /> {formatDate(sim.data || sim.createdAt).split(' ')[0]}
                   </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-700 opacity-20 group-hover:opacity-100 transition-all" />
            </motion.div>
          ))}
        </div>

        {/* ─── REPORT_INSPECTION_MODAL ─── */}
        <AnimatePresence>
          {selectedSimulado && (
            <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSimulado(null)}>
              <motion.div onClick={e => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-white/5 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-[0.2em]">Diagnostic_Report</span>
                      <span className="text-[10px] font-mono text-slate-500">CYCLE_ID_{selectedSimulado.id?.slice(0,8)}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">{selectedSimulado.tema}</h2>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={14} /> Latency: {formatTime(selectedSimulado.tempoSegundos)} • {formatDate(selectedSimulado.data || selectedSimulado.createdAt)}</p>
                  </div>
                  <button onClick={() => setSelectedSimulado(null)} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><X size={20} strokeWidth={3} /></button>
                </div>

                {/* Question Log Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/50">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Efficiency_Index</p>
                      <p className={`text-5xl font-black font-mono tracking-tighter ${getScoreColor(selectedSimulado.score)}`}>{selectedSimulado.score}%</p>
                    </div>
                    <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Success_Rate</p>
                      <p className="text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">{selectedSimulado.acertos}/{selectedSimulado.total}</p>
                    </div>
                  </div>

                  {(selectedSimulado.questoes || []).map((q, qIdx) => {
                    const fcKey = `${selectedSimulado.id}-${qIdx}`;
                    const fcStatus = flashcardStatus[fcKey];
                    return (
                      <div key={qIdx} className="bg-white dark:bg-slate-900 rounded-[28px] border-2 border-slate-100 dark:border-slate-800 overflow-hidden group shadow-lg">
                        <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center gap-6 ${q.acertou ? 'bg-emerald-500/[0.03]' : 'bg-rose-500/[0.03]'}`}>
                          <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 border-2 ${q.acertou ? 'bg-emerald-500 text-white border-white/20 shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white border-white/20 shadow-lg shadow-rose-500/20'}`}>
                            {q.acertou ? <CheckCircle size={28} /> : <XCircle size={28} />}
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Probe_Node_{qIdx + 1}</p>
                             <p className="text-[17px] font-black text-slate-900 dark:text-white leading-tight uppercase italic">{q.pergunta}</p>
                          </div>
                          {!q.acertou && (
                            <button onClick={() => handleCriarFlashcard(selectedSimulado, q, fcKey)} disabled={fcStatus === 'loading' || fcStatus === 'done'}
                              className={`h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all ${fcStatus === 'done' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700'}`}>
                              {fcStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : fcStatus === 'done' ? <CheckCircle size={14} /> : <Zap size={14} />}
                              {fcStatus === 'done' ? 'Node_Patched' : 'Deploy_Patch'}
                            </button>
                          )}
                        </div>

                        <div className="p-8 space-y-4">
                           {q.opcoes.map((opt, oIdx) => {
                             const isCorrect = q.correta === oIdx;
                             const isSelected = q.respostaUsuario === oIdx;
                             let statusCls = 'bg-slate-50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800 opacity-60';
                             if (isCorrect) statusCls = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500 !opacity-100';
                             if (isSelected && !isCorrect) statusCls = 'bg-rose-500/10 border-rose-500/40 text-rose-500 !opacity-100';

                             return (
                               <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${statusCls}`}>
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono text-[12px] bg-black/20">{String.fromCharCode(65 + oIdx)}</div>
                                  <span className="font-bold text-[15px]">{opt}</span>
                               </div>
                             );
                           })}
                           
                           {q.explicacao && (
                             <div className="mt-8 p-6 rounded-2xl bg-indigo-500/[0.03] border-2 border-indigo-500/10 relative overflow-hidden">
                               <div className="flex items-center gap-3 mb-4 text-indigo-500">
                                 <FileSearch size={16} />
                                 <span className="text-[10px] font-black uppercase tracking-[0.3em]">Documentation_Lookup</span>
                               </div>
                               <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">"{q.explicacao}"</p>
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-center">
                   <Button onClick={() => setSelectedSimulado(null)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-16 !rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-[12px]">Close_Session_Report</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default HistoricoSimulados;