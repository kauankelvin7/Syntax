import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Target, Info } from 'lucide-react';

const SkillRadar = ({ skills }) => {
  const hasData = skills && skills.length > 0;
  
  // Empty state data
  const emptyData = [
    { subject: 'Algoritmos', score: 0, fullMark: 100 },
    { subject: 'Frontend', score: 0, fullMark: 100 },
    { subject: 'Backend', score: 0, fullMark: 100 },
    { subject: 'Arquitetura', score: 0, fullMark: 100 },
    { subject: 'BD', score: 0, fullMark: 100 },
    { subject: 'DevOps', score: 0, fullMark: 100 },
    { subject: 'Soft Skills', score: 0, fullMark: 100 },
  ];

  const data = hasData ? skills : emptyData;

  const metaData = data.map(d => ({
    ...d,
    target: 80 // Meta para nível pleno
  }));

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[28px] p-8 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Target size={20} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Skill Radar</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Info size={12} />
            <span>Distribuição de Habilidades</span>
        </div>
      </div>

      <div style={{ width: '100%', minHeight: 0 }} className="flex-1 min-h-[350px] relative">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-slate-950/50 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Crie flashcards por matéria para ver seu mapa de habilidades
              </p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metaData}>
            <PolarGrid stroke="#1e293b" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              axisLine={false} 
              tick={false} 
            />
            <Radar
              name="Seu nível"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={3}
              fill="#6366f1"
              fillOpacity={0.4}
              animationDuration={2000}
            />
            <Radar
              name="Meta Pleno"
              dataKey="target"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              animationDuration={2000}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ponto mais forte</span>
            <span className="text-sm font-black text-cyan-400 uppercase tracking-tighter">{hasData ? 'Frontend' : '--'}</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col gap-1 items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">A melhorar</span>
            <span className="text-sm font-black text-rose-500 uppercase tracking-tighter">{hasData ? 'DevOps' : '--'}</span>
        </div>
      </div>
    </div>
  );
};

SkillRadar.displayName = 'SkillRadar';

export default memo(SkillRadar);
