import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Clock, Info } from 'lucide-react';

const StudyTimeline = ({ sessions, period = '7d' }) => {
  const hasData = sessions && sessions.length > 0;
  
  // Mock data for demonstration - in production would be derived from sessions
  const data = hasData ? sessions : [];

  const colors = {
    frontend: '#06b6d4',
    backend: '#6366f1',
    algorithms: '#8b5cf6'
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[28px] p-8 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Clock size={20} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Study Timeline</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Info size={12} />
            <span>Minutos por Área</span>
        </div>
      </div>

      <div style={{ width: '100%', minHeight: 0 }} className="flex-1 min-h-[300px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-slate-950/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Conclua sessões Pomodoro para visualizar sua evolução
              </p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(val) => `${val}m`}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
              formatter={(value, name) => [`${value} min`, name.toUpperCase()]}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <Bar dataKey="frontend" stackId="a" fill={colors.frontend} radius={[0, 0, 0, 0]} />
            <Bar dataKey="backend" stackId="a" fill={colors.backend} radius={[0, 0, 0, 0]} />
            <Bar dataKey="algorithms" stackId="a" fill={colors.algorithms} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Média Diária</span>
            <span className="text-xl font-black text-white tabular-nums">{hasData ? '74m' : '--'}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Melhor Dia</span>
            <span className="text-xl font-black text-emerald-500 tabular-nums">{hasData ? '14/03' : '--'}</span>
        </div>
      </div>
    </div>
  );
};

StudyTimeline.displayName = 'StudyTimeline';

export default memo(StudyTimeline);
