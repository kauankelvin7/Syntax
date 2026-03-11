/**
 * CalendarWidget — Flat calendar + upcoming events
 * Theme: Syntax (Premium Tech / Software Engineering)
 * * Renders WITHOUT its own card wrapper — the parent provides the card.
 * Uses calendar-container-compact CSS class for compact sizing.
 */

import { useState } from 'react';
import Calendar from 'react-calendar';
import { motion } from 'framer-motion';
import 'react-calendar/dist/Calendar.css';
import '../../styles/calendar.css';
import { CalendarDays, Trash2, Terminal } from 'lucide-react';

const CalendarWidget = ({ eventos = [], onOpenAddModal, onClickDay, onDeleteEvento }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Verifica se a data tem eventos
  const hasEventOnDate = (date) => {
    return eventos.some(evento => {
      const eventoDate = evento.data?.toDate?.() || new Date(evento.data);
      return (
        eventoDate.getDate() === date.getDate() &&
        eventoDate.getMonth() === date.getMonth() &&
        eventoDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Ponto indicador de evento nos dias (Estilo LED Cyan)
  const tileContent = ({ date, view }) => {
    if (view === 'month' && hasEventOnDate(date)) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-1.5 h-1.5 bg-cyan-400 dark:bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
        </div>
      );
    }
    return null;
  };

  // Próximos eventos (ordenados, max 3)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximosEventos = eventos
    .map(evento => ({
      ...evento,
      dataObj: evento.data?.toDate?.() || new Date(evento.data),
    }))
    .filter(evento => evento.dataObj >= hoje)
    .sort((a, b) => a.dataObj - b.dataObj)
    .slice(0, 3);

  const handleDayClick = (date) => {
    setSelectedDate(date);
    if (onClickDay) onClickDay(date);
  };

  return (
    <div className="calendar-container-compact flex flex-col h-full">
      {/* Calendar grid customizado no CSS */}
      <Calendar
        onChange={setSelectedDate}
        onClickDay={handleDayClick}
        value={selectedDate}
        tileContent={tileContent}
        locale="pt-BR"
        className="w-full border-none !bg-transparent"
      />

      {/* Seção de Próximos Eventos */}
      <div className="mt-4 pt-5 border-t border-slate-200 dark:border-slate-800/80 flex-1">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Terminal size={12} className="text-indigo-500" />
          Próximos Prazos
        </h4>

        {proximosEventos.length > 0 ? (
          <div className="space-y-3">
            {proximosEventos.map((evento, index) => (
              <motion.div
                key={evento.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="group flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[14px] hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Date Badge (Estilo Vercel/Linear) */}
                <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 dark:bg-indigo-900/30 rounded-[10px] flex flex-col items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                  <span className="text-[14px] font-mono font-black text-indigo-600 dark:text-indigo-400 leading-none">
                    {evento.dataObj.getDate()}
                  </span>
                  <span className="text-[9px] font-bold text-indigo-500/80 dark:text-indigo-400/80 uppercase tracking-wider leading-none mt-1">
                    {evento.dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                    {evento.titulo || evento.title}
                  </p>
                  {evento.tipo && (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {evento.tipo}
                    </p>
                  )}
                </div>

                {/* Delete button (Aparece no hover) */}
                {onDeleteEvento && evento.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteEvento(evento); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-90"
                    title="Excluir evento"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-6 flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CalendarDays size={20} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
              Nenhum evento próximo
            </p>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
              Sua agenda está livre.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CalendarWidget;