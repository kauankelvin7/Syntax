/**
 * 📅 ADD EVENT MODAL (Syntax Theme)
 * * Modal refinado para criação de eventos no cronograma.
 * - Header adaptativo por categoria
 * - Seleção tátil otimizada com ícones tech
 * - Animações fluidas e Glassmorphism
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Terminal, // Substitui o BookOpen
  FileCode2, // Substitui o FileText
  Rocket, // Substitui o GraduationCap
  Check
} from 'lucide-react';
import { Input } from '../ui/Input';
import Button from '../ui/Button';

// Adaptado para Engenharia de Software
const EVENT_TYPES = [
  { id: 'sprint', label: 'Sprint', icon: Terminal, color: 'from-indigo-500 to-cyan-500', shadow: 'shadow-cyan-500/20' },
  { id: 'deploy', label: 'Entrega', icon: Rocket, color: 'from-rose-500 to-orange-500', shadow: 'shadow-orange-500/20' },
  { id: 'trabalho', label: 'Trabalho', icon: FileCode2, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-indigo-500/20' },
];

const formatDateShort = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AddEventModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate = new Date() 
}) => {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('sprint');
  const [eventDate, setEventDate] = useState(selectedDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const selectedTypeConfig = EVENT_TYPES.find(t => t.id === tipo) || EVENT_TYPES[0];

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setTipo('sprint');
      setEventDate(selectedDate || new Date());
      setError('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('Dê um nome ao seu evento');
      inputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ titulo: titulo.trim(), tipo, data: eventDate });
      onClose();
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop Blur Premium */}
          <motion.div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800/60"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Adaptativo (Cor muda conforme o tipo selecionado) */}
            <div className={`px-6 py-8 bg-gradient-to-br ${selectedTypeConfig.color} relative overflow-hidden transition-colors duration-500`}>
              {/* Abstract glow no fundo do header */}
              <div className="absolute top-[-30%] right-[-20%] w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-[16px] flex items-center justify-center shadow-inner border border-white/20">
                    <Calendar className="text-white" size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight leading-none">Agendar Tarefa</h2>
                    <p className="text-white/80 text-[13px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-widest">
                      {formatDateShort(eventDate)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar criação de evento"
                  className="w-10 h-10 flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full text-white transition-all active:scale-95"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Form Area */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
              <div className="space-y-5">
                
                {/* Input de Título */}
                <Input
                  ref={inputRef}
                  label="Nome da Tarefa / Evento"
                  type="text"
                  value={titulo}
                  onChange={(e) => { setTitulo(e.target.value); setError(''); }}
                  placeholder="Ex: Entregar API Rest, Estudar Docker..."
                  error={error}
                  maxLength={60}
                  className="h-14 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 font-bold focus:ring-4 focus:ring-cyan-500/20 text-[15px]"
                />

                {/* Seleção de Categoria */}
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-[12px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Tipo de Evento</label>
                  <div className="grid grid-cols-3 gap-3">
                    {EVENT_TYPES.map((et) => {
                      const Icon = et.icon;
                      const active = tipo === et.id;
                      return (
                        <button
                          key={et.id}
                          type="button"
                          onClick={() => setTipo(et.id)}
                          className={`group relative p-4 rounded-[20px] border-2 transition-all duration-300 flex flex-col items-center gap-2.5 ${
                            active
                              ? `border-transparent bg-gradient-to-br ${et.color} text-white shadow-lg ${et.shadow} scale-105 z-10`
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? '' : 'opacity-80 group-hover:opacity-100 transition-opacity'} />
                          <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                            {et.label}
                          </span>
                          
                          {/* Badge de Check quando selecionado */}
                          {active && (
                            <motion.div 
                              layoutId="check-event"
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

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={onClose}
                  className="h-14 rounded-2xl font-bold order-2 sm:order-1 border-slate-200 dark:border-slate-700 text-[15px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  className={`h-14 rounded-2xl font-bold order-1 sm:order-2 bg-gradient-to-r ${selectedTypeConfig.color} border-none text-[15px] shadow-lg ${selectedTypeConfig.shadow}`}
                >
                  Salvar
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddEventModal;