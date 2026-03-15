import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Target, 
  Zap, 
  Clock, 
  Calendar, 
  Cpu, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { 
  listarFlashcards, 
  listarResumos, 
  listarSimulados, 
  listarMaterias 
} from '../services/firebaseService';
import { 
  calculateReadinessScore, 
  calculateSkillScores, 
  buildHeatmapData 
} from '../services/analyticsService';

import ReadinessScore from '../components/analytics/ReadinessScore';
import SkillRadar from '../components/analytics/SkillRadar';
import HeatmapCalendar from '../components/analytics/HeatmapCalendar';
import ForgettingCurve from '../components/analytics/ForgettingCurve';
import StudyTimeline from '../components/analytics/StudyTimeline';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState({
    flashcards: [],
    resumos: [],
    simulados: [],
    materias: [],
    readiness: 0,
    skills: [],
    heatmap: {},
    streak: 0,
    hours: 0,
    readinessBreakdown: null
  });

  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [
          flashcards, 
          resumos, 
          simulados, 
          materias, 
          readinessData, 
          skills, 
          heatmap
        ] = await Promise.all([
          listarFlashcards(user.uid),
          listarResumos(user.uid),
          listarSimulados(user.uid),
          listarMaterias(user.uid),
          calculateReadinessScore(user.uid, true), // Pass true to get full object if needed
          calculateSkillScores(user.uid),
          buildHeatmapData(user.uid)
        ]);

        // Get streak from user doc
        const userDoc = await listarMaterias(user.uid); // reuse listing or get doc
        
        setData({
          flashcards,
          resumos,
          simulados,
          materias,
          readiness: typeof readinessData === 'object' ? readinessData.score : readinessData,
          readinessBreakdown: typeof readinessData === 'object' ? readinessData.breakdown : null,
          skills,
          heatmap,
          streak: 0, // In production, get from user profile
          hours: 0   // In production, sum from pomodoroHistory
        });
      } catch (error) {
        console.error('Erro ao carregar analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  const periods = [
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: '90d', label: 'Últimos 90 dias' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600/40 dark:text-indigo-500/40">
            <Activity size={24} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] animate-pulse">Analiticos_Processando</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 animate-pulse">Sincronizando telemetria de aprendizado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-6 md:px-10 max-w-[1600px] mx-auto overflow-x-hidden relative">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
              <BarChart3 size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analytics Profundo</h1>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Stream: Online & Synchronized</p>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Row 1: Readiness & Skills */}
        <div className="lg:col-span-5 h-[500px]">
          <ReadinessScore score={data.readiness} breakdown={data.readinessBreakdown} />
        </div>
        <div className="lg:col-span-7 h-[500px]">
          <SkillRadar skills={data.skills} />
        </div>

        {/* Row 2: Heatmap */}
        <div className="lg:col-span-12">
          <HeatmapCalendar data={data.heatmap} />
        </div>

        {/* Row 3: Forgetting Curve & Timeline */}
        <div className="lg:col-span-8 h-[550px]">
          <ForgettingCurve flashcards={data.flashcards} />
        </div>
        <div className="lg:col-span-4 h-[550px]">
          <StudyTimeline period={period} />
        </div>

        {/* Row 4: KPI Cards */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-4">
            {[
                { label: 'Streak Ativa', value: data.streak > 0 ? `${data.streak} dias` : '0 dias', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { label: 'Total de Horas', value: data.hours > 0 ? `${data.hours}h` : '0h', icon: Clock, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Logics Revisados', value: data.flashcards.length, icon: Cpu, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
                { label: 'Simulados Run', value: data.simulados.length, icon: Target, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Docs Criados', value: data.resumos.length, icon: Activity, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
            ].map((kpi, idx) => (
                <motion.div 
                    key={idx}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-xl relative overflow-hidden transition-all"
                >
                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}>
                        <kpi.icon size={20} />
                    </div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{kpi.value}</span>
                </motion.div>
            ))}
        </div>

        {/* Row 5: Top Subjects Table */}
        <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-8 shadow-sm hover:shadow-xl mt-4 transition-all">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Top Matérias por Telemetria</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200 dark:border-white/5">
                            <th className="text-left pb-4">Stack</th>
                            <th className="text-center pb-4">Tempo Estudo</th>
                            <th className="text-center pb-4">Retenção</th>
                            <th className="text-center pb-4">Sucesso</th>
                            <th className="text-right pb-4">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                        {data.materias.slice(0, 5).map((m, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border" style={{ backgroundColor: `${m.cor}15`, color: m.cor, borderColor: `${m.cor}30` }}>
                                            {m.nome.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{m.nome}</span>
                                    </div>
                                </td>
                                <td className="py-5 text-center text-xs font-black text-slate-500 dark:text-slate-400 tabular-nums">24h 15m</td>
                                <td className="py-5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-600" style={{ width: '85%' }} />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">85%</span>
                                    </div>
                                </td>
                                <td className="py-5 text-center">
                                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Ótimo</span>
                                </td>
                                <td className="py-5 text-right">
                                    <button className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-600 transition-all">
                                        <ChevronRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Decorative BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

Analytics.displayName = 'AnalyticsPage';

export default Analytics;
