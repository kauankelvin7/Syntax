/**
 * AgendaWidget — Dashboard Calendar + Upcoming Events
 * Theme: Syntax (Software Engineering / Tech Premium)
 * Features:
 * - Tech-oriented event types (Sprint, Deploy, Task)
 * - Custom CSS for react-calendar with neon accents
 * - Premium Glassmorphism Modal embedded
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  X, 
  Calendar as CalendarIcon, 
  Trash2, 
  Terminal, 
  Rocket, 
  FileCode2,
  Check
} from 'lucide-react';
import { salvarEvento, listarEventos, deletarEvento } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';

// Configuração Tech dos Eventos
const EVENT_TYPES = {
  sprint: { 
    label: 'Sprint/Estudo', 
    icon: Terminal, 
    color: 'from-indigo-500 to-blue-600', 
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800/50' 
  },
  deploy: { 
    label: 'Deploy/Entrega', 
    icon: Rocket, 
    color: 'from-rose-500 to-orange-500', 
    badge: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-800/50' 
  },
  task: { 
    label: 'Task/Outro', 
    icon: FileCode2, 
    color: 'from-cyan-500 to-teal-500', 
    badge: 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-800/50' 
  }
};

const AgendaWidget = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    titulo: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    tipo: 'sprint'
  });

  useEffect(() => {
    if (user) {
      carregarEventos();
    }
  }, [user]);

  const carregarEventos = async () => {
    try {
      setLoading(true);
      const data = await listarEventos(user.id || user.uid);
      setEventos(data);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salvarEvento(formData, user.id || user.uid);
      await carregarEventos();
      setFormData({ titulo: '', data: format(new Date(), 'yyyy-MM-dd'), tipo: 'sprint' });
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      alert('Erro ao salvar evento. Tente novamente.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este evento/task?')) {
      try {
        await deletarEvento(id);
        await carregarEventos();
      } catch (err) {
        console.error('Erro ao deletar evento:', err);
        alert('Erro ao deletar evento.');
      }
    }
  };

  const tileClassName = ({ date }) => {
    const hasEvento = eventos.some(evento => {
      const eventoDate = evento.data?.toDate?.() ?? new Date(evento.data);
      return isSameDay(eventoDate, date);
    });
    return hasEvento ? 'has-evento' : null;
  };

  const proximosEventos = eventos
    .map(evento => ({
      ...evento,
      dataObj: evento.data?.toDate?.() ?? new Date(evento.data)
    }))
    .filter(evento => evento.dataObj >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => a.dataObj - b.dataObj)
    .slice(0, 5);

  const selectedConfig = EVENT_TYPES[formData.tipo] || EVENT_TYPES['sprint'];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[14px] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center shadow-inner">
            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Timeline</h2>
            <p className="text-[12px] font-medium text-slate-500">Seus prazos e sprints</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowModal(true)}
          className="w-10 h-10 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[12px] hover:scale-105 transition-transform shadow-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Novo Evento"
        >
          <Plus size={20} strokeWidth={3} />
        </motion.button>
      </div>

      {/* Calendário */}
      <div className="agenda-calendar mb-6 bg-slate-50 dark:bg-slate-800/40 rounded-[20px] p-4 border border-slate-100 dark:border-slate-800">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          locale="pt-BR"
          tileClassName={tileClassName}
          className="w-full"
        />
      </div>

      {/* Próximos Eventos */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
          Próximas Tasks
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-500 dark:text-slate-400 text-sm font-medium">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            Carregando agenda...
          </div>
        ) : proximosEventos.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <CalendarIcon className="text-slate-300 dark:text-slate-600" size={24} />
            </div>
            <p className="text-[14px] font-bold text-slate-600 dark:text-slate-300">Agenda livre</p>
            <p className="text-[12px] font-medium text-slate-400 mt-1">Nenhum evento programado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proximosEventos.map((evento, index) => {
              const conf = EVENT_TYPES[evento.tipo] || EVENT_TYPES['task'];
              const Icon = conf.icon;
              
              return (
                <motion.div
                  key={evento.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-[16px] p-3.5 flex items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${conf.badge}`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                      {evento.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {format(evento.dataObj, "dd 'de' MMM", { locale: ptBR })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {conf.label}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => handleDelete(evento.id)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0"
                    whileTap={{ scale: 0.9 }}
                    title="Excluir task"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Novo Evento - Estilo Syntax Premium */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800/60"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Dinâmico */}
              <div className={`px-6 py-8 bg-gradient-to-br ${selectedConfig.color} relative overflow-hidden transition-colors duration-500`}>
                <div className="absolute top-[-30%] right-[-20%] w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-[16px] flex items-center justify-center shadow-inner border border-white/20">
                      <CalendarIcon className="text-white" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight leading-none">Agendar Task</h2>
                      <p className="text-white/80 text-[13px] font-bold mt-1.5 uppercase tracking-widest">
                        {format(new Date(formData.data + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-10 h-10 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full text-white transition-all"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ml-1">
                      Título da Task
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[15px] font-bold rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 outline-none transition-all shadow-inner"
                      placeholder="Ex: Refatorar API de Autenticação"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 ml-1">
                      Data do Praz/Evento
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[15px] font-bold rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 ml-1">
                      Tipo de Evento
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(EVENT_TYPES).map(([key, config]) => {
                        const Icon = config.icon;
                        const active = formData.tipo === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData({ ...formData, tipo: key })}
                            className={`group relative p-3 rounded-[16px] border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                              active
                                ? `border-transparent bg-gradient-to-br ${config.color} text-white shadow-lg scale-105 z-10`
                                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? '' : 'opacity-80'} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-400'}`}>
                              {key}
                            </span>
                            
                            {active && (
                              <motion.div 
                                layoutId="check-event-agenda"
                                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
                              >
                                <Check size={12} strokeWidth={4} className="text-white dark:text-slate-900" />
                              </motion.div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <motion.button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-[15px] hover:bg-slate-200 transition-colors"
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    className={`flex-1 h-14 bg-gradient-to-r ${selectedConfig.color} text-white rounded-2xl font-bold text-[15px] shadow-lg border-none hover:opacity-90 transition-opacity`}
                    whileTap={{ scale: 0.97 }}
                  >
                    Salvar Task
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS customizado para o calendário - Substituídas as vars de CSS antigas por cores Tech (Indigo/Cyan) */}
      <style>{`
        .agenda-calendar .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
          background: transparent;
        }

        .agenda-calendar .react-calendar__navigation {
          display: flex;
          margin-bottom: 1rem;
        }

        .agenda-calendar .react-calendar__navigation button {
          color: inherit;
          font-weight: 800;
          font-size: 1.1rem;
          background: transparent;
          padding: 0.5rem;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .agenda-calendar .react-calendar__navigation button:hover:not(:disabled) {
          background: rgba(79, 70, 229, 0.1);
          color: #4f46e5;
        }

        .dark .agenda-calendar .react-calendar__navigation button:hover:not(:disabled) {
          background: rgba(79, 70, 229, 0.2);
          color: #818cf8;
        }

        .agenda-calendar .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }

        .agenda-calendar .react-calendar__tile {
          padding: 0.75rem 0.5rem;
          background: transparent;
          color: inherit;
          border-radius: 0.75rem;
          transition: all 0.2s;
          position: relative;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .agenda-calendar .react-calendar__tile:hover:not(:disabled):not(.react-calendar__tile--active) {
          background: rgba(79, 70, 229, 0.1);
          color: #4f46e5;
        }
        
        .dark .agenda-calendar .react-calendar__tile:hover:not(:disabled):not(.react-calendar__tile--active) {
          background: rgba(79, 70, 229, 0.2);
          color: #818cf8;
        }

        /* Active Day Style (Gradient) */
        .agenda-calendar .react-calendar__tile--active {
          background: linear-gradient(135deg, #4f46e5, #06b6d4) !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
          font-weight: 800;
        }

        /* Today Style */
        .agenda-calendar .react-calendar__tile--now {
          background: rgba(6, 182, 212, 0.1);
          color: #0891b2;
        }
        .dark .agenda-calendar .react-calendar__tile--now {
          color: #22d3ee;
        }

        /* Glowing Dot for Events */
        .agenda-calendar .react-calendar__tile.has-evento::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          background: #06b6d4;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(6, 182, 212, 0.8);
        }

        .agenda-calendar .react-calendar__tile--active.has-evento::after {
          background: white;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
        }

        .agenda-calendar .react-calendar__month-view__days__day--neighboringMonth {
          color: #cbd5e1;
        }
        .dark .agenda-calendar .react-calendar__month-view__days__day--neighboringMonth {
          color: #475569;
        }
      `}</style>
    </div>
  );
};

export default AgendaWidget;