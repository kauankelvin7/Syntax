/**
 * 📊 ANALYTICS PREMIUM - Syntax Theme
 * * Performance Dashboard: Telemetria de produtividade e métricas de aprendizado.
 * - Engine: Recharts (Data Visualization de alta fidelidade)
 * - Design: Monitoring Dashboard Style (Inspirado em ferramentas de infraestrutura)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Cpu,
  Terminal,
  FileCode,
  Zap,
  Clock,
  ChevronRight,
  Plus,
  Play,
  Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext-firebase';
import { listarFlashcards, listarResumos, listarMaterias, listarSimulados } from '../services/firebaseService';
import Button from '../components/ui/Button';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || user?.uid;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ flashcards: [], resumos: [], materias: [], simulados: [] });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [flashcards, resumos, materias, simulados] = await Promise.all([
          listarFlashcards(userId).catch(() => []),
          listarResumos(userId).catch(() => []),
          listarMaterias(userId).catch(() => []),
          listarSimulados(userId, 200).catch(() => []),
        ]);
        setData({ flashcards, resumos, materias, simulados });
      } catch (err) {
        console.error('Telemetria error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // Map: Content per Stack (Matéria)
  const materiasChart = useMemo(() => {
    return data.materias.map(m => ({
      name: m.nome?.length > 15 ? m.nome.substring(0, 15) + '…' : m.nome,
      fullName: m.nome,
      flashcards: data.flashcards.filter(f => f.materiaId === m.id).length,
      resumos: data.resumos.filter(r => r.materiaId === m.id).length,
    })).filter(m => m.flashcards > 0 || m.resumos > 0);
  }, [data]);

  // Map: Test performance over time
  const simuladosChart = useMemo(() => {
    return data.simulados
      .slice()
      .sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.data);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || b.data);
        return da - db;
      })
      .map((s, i) => ({
        name: `RUN_${i + 1}`,
        nota: s.score || 0,
        tema: s.tema || 'Default_Stack',
      }));
  }, [data.simulados]);

  // Map: System Activity (Last 7 days)
  const activityChart = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);

      const toMs = (item) => {
        const c = item.createdAt;
        if (!c) return 0;
        if (c.toDate) return c.toDate().getTime();
        if (c.seconds) return c.seconds * 1000;
        return new Date(c).getTime();
      };

      const fc = data.flashcards.filter(f => { const ms = toMs(f); return ms >= d.getTime() && ms < next.getTime(); }).length;
      const rs = data.resumos.filter(r => { const ms = toMs(r); return ms >= d.getTime() && ms < next.getTime(); }).length;

      const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
      days.push({
        name: dayNames[d.getDay()],
        flashcards: fc,
        resumos: rs,
      });
    }
    return days;
  }, [data]);

  const pieData = useMemo(() => {
    const items = [];
    if (data.flashcards.length > 0) items.push({ name: 'Logic_Units', value: data.flashcards.length });
    if (data.resumos.length > 0) items.push({ name: 'Documentation', value: data.resumos.length });
    if (data.simulados.length > 0) items.push({ name: 'Test_Suites', value: data.simulados.length });
    return items;
  }, [data]);

  const avgScore = useMemo(() => {
    if (data.simulados.length === 0) return 0;
    return Math.round(data.simulados.reduce((s, sim) => s + (sim.score || 0), 0) / data.simulados.length);
  }, [data.simulados]);

  const totalStudyTime = useMemo(() => {
    const secs = data.simulados.reduce((s, sim) => s + (sim.tempoSegundos || 0), 0);
    return Math.round(secs / 60);
  }, [data.simulados]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-20 h-20 border-[3px] border-indigo-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <Cpu className="absolute inset-0 m-auto text-indigo-500/40" size={24} />
          </div>
          <p className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
            Ingesting_Data_Stream...
          </p>
        </motion.div>
      </div>
    );
  }

  const KpiCard = ({ icon: Icon, label, value, colorClass, gradientClass, sub, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -4, scale: 1.01 } : {}}
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm group transition-all ${onClick ? 'cursor-pointer hover:border-cyan-500/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center ${gradientClass} shadow-lg shadow-black/5`}>
          <Icon size={20} className="text-white" strokeWidth={2.5} />
        </div>
        <Activity size={16} className="text-slate-200 dark:text-slate-800" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1 block">{label}</span>
      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
      {sub && (
        <div className={`mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold ${colorClass}`}>
          {sub}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Premium (Control Center Style) */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-[22px] flex items-center justify-center shadow-2xl">
              <BarChart3 size={32} className="text-white dark:text-slate-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                System_Analytics
              </h1>
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Performance Monitoring
              </p>
            </div>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <KpiCard 
            icon={Cpu} 
            label="Logic_Units" 
            value={data.flashcards.length} 
            gradientClass="bg-indigo-600" 
            colorClass="text-indigo-500"
            sub="Active Assets"
          />
          <KpiCard 
            icon={FileCode} 
            label="Documentation" 
            value={data.resumos.length} 
            gradientClass="bg-cyan-500"
            colorClass="text-cyan-500" 
            sub="Knowledge Base"
          />
          <KpiCard 
            icon={Target} 
            label="Test_Suites" 
            value={data.simulados.length} 
            gradientClass="bg-amber-500" 
            colorClass="text-amber-500"
            sub={<span>Success Rate: {avgScore}% <ChevronRight size={12} className="inline" /></span>} 
            onClick={() => navigate('/historico-simulados')}
          />
          <KpiCard 
            icon={Clock} 
            label="Uptime" 
            value={`${totalStudyTime}m`} 
            gradientClass="bg-rose-500" 
            colorClass="text-rose-500"
            sub="Simulation Time" 
          />
        </div>

        {/* Conditional Content */}
        {data.flashcards.length === 0 && data.resumos.length === 0 && data.simulados.length === 0 ? (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="py-24 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500 animate-gradient-x" />
              <Terminal size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" strokeWidth={1.5} />
              <h3 className="text-[20px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Telemetry_Inactive</h3>
              <p className="text-[14px] text-slate-400 mt-2 mb-10 max-w-xs mx-auto font-medium">Nenhum fluxo de dados detectado. Inicialize seu material para gerar métricas.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={() => navigate('/flashcards')} className="bg-indigo-600 !rounded-[14px] px-8 py-6 uppercase tracking-widest font-black text-[11px]">
                  <Plus className="mr-2" size={16} /> Deploy_Flashcards
                </Button>
                <Button onClick={() => navigate('/simulados')} variant="secondary" className="!rounded-[14px] px-8 py-6 uppercase tracking-widest font-black text-[11px] border-2">
                  <Play className="mr-2" size={16} /> Run_Simulation
                </Button>
              </div>
           </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Gráfico: Ingest Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[28px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                  <Calendar size={16} className="text-indigo-500" />
                  Data_Ingest (Last 7 Days)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={activityChart} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 800 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 800 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                    contentStyle={{ borderRadius: 16, border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', padding: '12px 16px' }}
                  />
                  <Bar dataKey="flashcards" name="Logic" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="resumos" name="Docs" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Gráfico: Resource Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-900 rounded-[28px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <Activity size={16} className="text-cyan-500" />
                Resource_Distribution
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', backgroundColor: '#0f172a', color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Gráfico: Success Rate Evolution */}
            {simuladosChart.length > 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[28px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <TrendingUp size={16} className="text-amber-500" />
                  Test_Suite_Uptime (% Score)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={simuladosChart} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 800 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                      formatter={(val) => [`${val}%`, 'Score']}
                    />
                    <Area type="monotone" dataKey="nota" stroke="#f59e0b" strokeWidth={4} fill="url(#scoreGradient)" activeDot={{ r: 8, strokeWidth: 0, fill: '#f59e0b' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Breakdown por Stack */}
            {materiasChart.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[28px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <Zap size={16} className="text-indigo-500" />
                  Stack_Inventory_Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={Math.max(240, materiasChart.length * 50)}>
                  <BarChart data={materiasChart} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 900, textTransform: 'uppercase' }} axisLine={false} tickLine={false} width={140} />
                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} contentStyle={{ borderRadius: 12, border: 'none', backgroundColor: '#0f172a', color: '#fff' }} />
                    <Bar dataKey="flashcards" name="Logic" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={10} />
                    <Bar dataKey="resumos" name="Docs" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default Analytics;