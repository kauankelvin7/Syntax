import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HeatmapCalendar = ({ data }) => {
  const weeksToShow = 52;
  const daysPerWeek = 7;
  
  const today = new Date();
  const startDate = startOfWeek(subWeeks(today, weeksToShow - 1), { weekStartsOn: 0 });

  const getColorIntensity = (minutes) => {
    if (!minutes || minutes === 0) return 'bg-slate-800/40';
    if (minutes <= 30) return 'bg-indigo-900';
    if (minutes <= 60) return 'bg-indigo-700';
    if (minutes <= 120) return 'bg-indigo-500';
    return 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.4)]';
  };

  const calendarData = useMemo(() => {
    const weeks = [];
    let currentDay = startDate;

    for (let w = 0; w < weeksToShow; w++) {
      const week = [];
      for (let d = 0; d < daysPerWeek; d++) {
        const dateStr = format(currentDay, 'yyyy-MM-dd');
        week.push({
          date: currentDay,
          dateStr,
          stats: data[dateStr] || { minutes: 0, sessions: 0, flashcards: 0 }
        });
        currentDay = addDays(currentDay, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [data, startDate]);

  const monthLabels = useMemo(() => {
    const labels = [];
    calendarData.forEach((week, wIdx) => {
      const firstDay = week[0].date;
      if (firstDay.getDate() <= 7) {
        labels.push({
          label: format(firstDay, 'MMM', { locale: ptBR }),
          index: wIdx
        });
      }
    });
    return labels;
  }, [calendarData]);

  return (
    <div className="bg-slate-900 border border-white/5 rounded-[28px] p-8 shadow-xl overflow-x-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Heatmap de Estudo</h3>
          {Object.keys(data).length === 0 && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Conclua sessões Pomodoro para ver seu histórico</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-slate-800/40" />
            <div className="w-3 h-3 rounded bg-indigo-900" />
            <div className="w-3 h-3 rounded bg-indigo-700" />
            <div className="w-3 h-3 rounded bg-indigo-500" />
            <div className="w-3 h-3 rounded bg-indigo-400" />
          </div>
          <span>Mais</span>
        </div>
      </div>

      <div className="min-w-[800px]">
        {/* Month Labels */}
        <div className="flex h-5 mb-2 relative">
          {monthLabels.map((m, idx) => (
            <div 
              key={idx} 
              className="absolute text-[10px] font-black text-slate-500 uppercase tracking-widest"
              style={{ left: `${m.index * 14}px` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day Labels */}
          <div className="flex flex-col gap-1 pr-3 pt-1">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, idx) => (
              <div key={idx} className="h-[10px] text-[8px] font-black text-slate-600 uppercase flex items-center">
                {idx % 2 === 0 ? day : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {calendarData.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => (
                  <motion.div
                    key={day.dateStr}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (wIdx * 7 + dIdx) * 0.001 }}
                    className={`w-[10px] h-[10px] rounded-[2px] cursor-help transition-all ${getColorIntensity(day.stats.minutes)}`}
                    title={`${format(day.date, 'dd/MM/yyyy')} — ${day.stats.minutes}min estudados · ${day.stats.sessions} sessões`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

HeatmapCalendar.displayName = 'HeatmapCalendar';

export default memo(HeatmapCalendar);
