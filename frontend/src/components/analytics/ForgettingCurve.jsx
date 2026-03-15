import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { Cpu, Zap, Info } from 'lucide-react';

const ForgettingCurve = ({ flashcards, reviewHistory }) => {
  const hasData = flashcards && flashcards.length > 0;
  
  const data = useMemo(() => {
    const points = [];
    if (!hasData) {
      for (let i = 0; i <= 30; i++) points.push({ day: i, retention: 0 });
      return points;
    }
    for (let i = 0; i <= 30; i++) {
      // Fórmula de Ebbinghaus: R = e^(-t/S)
      // Usando uma estabilidade média S=10 para demonstração
      const retention = Math.exp(-i / 10) * 100;
      points.push({
        day: i,
        retention: Math.round(retention),
        threshold: 60
      });
    }
    return points;
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-8 shadow-sm hover:shadow-xl h-full flex flex-col transition-all">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Cpu size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Curva de Esquecimento</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Info size={12} />
            <span>Retenção Estimada</span>
        </div>
      </div>

      <div style={{ width: '100%', minHeight: 0 }} className="flex-1 min-h-[300px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-white/80 dark:bg-slate-950/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-sm">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Revise flashcards para visualizar sua curva de retenção
              </p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" vertical={false} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: window.innerWidth < 640 ? 9 : 11, fontWeight: 700 }}
              className="text-slate-400 dark:text-slate-600"
              label={window.innerWidth < 640 ? null : { value: 'Dias após estudo', position: 'insideBottom', offset: -5, fill: 'currentColor', fontSize: 10, fontWeight: 700, className: 'text-slate-400 dark:text-slate-600' }}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'currentColor', fontSize: window.innerWidth < 640 ? 9 : 11, fontWeight: 700 }}
              className="text-slate-400 dark:text-slate-600"
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'currentColor', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
              className="text-white dark:text-slate-900 bg-slate-900 dark:bg-white"
              itemStyle={{ color: '#6366f1', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: 'currentColor', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
              formatter={(value) => [`${value}%`, 'Retenção']}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Limite', position: 'right', fill: '#f43f5e', fontSize: 10, fontWeight: 700 }} />
            <Area 
              type="monotone" 
              dataKey="retention" 
              stroke="#6366f1" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorRetention)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-start gap-4 group">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
          <Zap size={16} />
        </div>
        <div className="flex-1 space-y-1">
          <span className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Ada Insight</span>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
            Você esquece conceitos de <span className="text-slate-900 dark:text-white font-bold">Arquitetura</span> 1.4x mais rápido que <span className="text-slate-900 dark:text-white font-bold">Frontend</span>. Recomendamos focar em revisões de 3 dias para esta matéria.
          </p>
        </div>
      </div>
    </div>
  );
};

ForgettingCurve.displayName = 'ForgettingCurve';

export default memo(ForgettingCurve);
