import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, TrendingUp, BookOpen, Star, ArrowRight, Share2, Award, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const InterviewFeedback = ({ score, categoryScores, strengths, improvements, idealAnswers, onSave }) => {
  const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899'];
  
  const gaugeData = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score }
  ];

  const categoryData = Object.entries(categoryScores).map(([name, value]) => ({ name, value }));

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 pt-10">
      {/* Hero Score Section */}
      <section className="flex flex-col md:flex-row items-center gap-12 justify-center bg-slate-900 border border-white/5 rounded-[38px] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award size={200} />
        </div>
        
        <div style={{ width: 256, height: 256, minHeight: 0 }} className="relative">
          <ResponsiveContainer width="100%" height={256}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#6366f1" />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{score}</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Score Geral</span>
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">
            {score >= 80 ? 'Excelente Performance!' : score >= 60 ? 'Bom Trabalho, Continue!' : 'Continue Praticando!'}
          </h2>
          <p className="text-lg text-slate-400 font-medium max-w-xl">
            Sua análise técnica foi precisa, mas houve pontos de melhoria na comunicação da solução.
          </p>
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <button 
              onClick={onSave}
              className="flex items-center gap-2 px-8 py-4 rounded-[18px] bg-indigo-600 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
            >
              Salvar no Histórico <Share2 size={16} />
            </button>
            <button className="flex items-center gap-2 px-8 py-4 rounded-[18px] bg-white/5 text-slate-300 font-black uppercase tracking-tighter text-sm hover:bg-white/10 transition-all border border-white/10">
              Ver Gráficos Detalhados
            </button>
          </div>
        </div>
      </section>

      {/* Grid Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Scores */}
        <section className="bg-slate-900 border border-white/5 rounded-[28px] p-8 shadow-xl h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-8">
                <TrendingUp size={24} className="text-indigo-400" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Performance por Categoria</h3>
            </div>
            <div style={{ width: '100%', minHeight: 0 }} className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData} layout="vertical">
                        <XAxis type="number" hide domain={[0, 10]} />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                            width={120}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                        <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* Strengths & Improvements */}
        <div className="space-y-8">
            <section className="bg-slate-900 border border-white/5 rounded-[28px] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Pontos Fortes</h3>
                </div>
                <ul className="space-y-4">
                    {strengths.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-slate-300 text-sm font-medium">
                            <Zap size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                            {point}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="bg-slate-900 border border-white/5 rounded-[28px] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <XCircle size={24} className="text-amber-400" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Áreas de Melhoria</h3>
                </div>
                <ul className="space-y-4">
                    {improvements.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-slate-300 text-sm font-medium">
                            <ArrowRight size={14} className="text-amber-400 mt-0.5 shrink-0" />
                            {point}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
      </div>

      {/* Recommended Path */}
      <section className="bg-indigo-600/10 border border-indigo-500/20 rounded-[28px] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                <BookOpen size={32} className="text-white" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Próximos Passos Recomendados</h3>
                <p className="text-slate-400 font-medium">A Ada identificou que você pode se beneficiar revisando estes tópicos:</p>
                <div className="flex flex-wrap gap-2 pt-4 justify-center md:justify-start">
                    {['Estrutura de Dados', 'Sistemas Distribuídos', 'React Hooks'].map(tag => (
                        <span key={tag} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-tighter text-xs shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all">
                Iniciar Revisão <ArrowRight size={14} />
            </button>
        </div>
      </section>
    </div>
  );
};

InterviewFeedback.displayName = 'InterviewFeedback';

export default memo(InterviewFeedback);
