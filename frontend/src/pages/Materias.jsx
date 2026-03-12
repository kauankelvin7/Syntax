/**
 * 📂 STACKS (Matérias) — Syntax Theme Premium
 * * Gerenciamento tático de módulos de conhecimento.
 * - Features: Grid Responsivo, Seletor de Stacks, Telemetria de Progresso.
 * - Design: Infrastructure Dashboard (Bordas de 24px, Glow Dinâmico).
 * - Lógica: 100% Preservada (Sincronização Firebase + Filtros Indexados).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Plus, 
  Code2, 
  Edit2, 
  Trash2, 
  CreditCard,
  FileText,
  Palette,
  TrendingUp,
  Search,
  ArrowUpDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Layers,
  Check,
  AlertTriangle,
  Terminal,
  Activity,
  Cpu
} from 'lucide-react';

import { listarMaterias, criarMateria, atualizarMateria, deletarMateria, listarFlashcards } from '../services/firebaseService';
import { isDueForReview } from '../utils/sm2';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import ConfirmModal from '../components/ui/ConfirmModal';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const CORES_DISPONIVEIS = [
  { nome: 'Sky', valor: '#0EA5E9' },
  { nome: 'Blue', valor: '#3B82F6' },
  { nome: 'Purple', valor: '#A855F7' },
  { nome: 'Pink', valor: '#EC4899' },
  { nome: 'Orange', valor: '#F97316' },
  { nome: 'Green', valor: '#10B981' },
  { nome: 'Indigo', valor: '#6366F1' },
  { nome: 'Red', valor: '#EF4444' },
];

function Materias() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [materias, setMaterias] = useState([]);
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#6366F1',
    concluida: false
  });
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recente');

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // ─── DADOS COMPUTADOS (Lógica Intacta) ───

  const reviewsByMateria = useMemo(() => {
    const map = {};
    allFlashcards.forEach(fc => {
      const mid = fc.materiaId;
      if (!mid) return;
      if (!map[mid]) map[mid] = { total: 0, pending: 0 };
      map[mid].total++;
      if (isDueForReview(fc)) map[mid].pending++;
    });
    return map;
  }, [allFlashcards]);

  const completionPercent = useMemo(() => {
    if (materias.length === 0) return 0;
    return Math.round((materias.filter(m => m.concluida).length / materias.length) * 100);
  }, [materias]);

  const filterAndSort = (list) => {
    let filtered = list;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => m.nome.toLowerCase().includes(term) || (m.descricao || '').toLowerCase().includes(term));
    }
    const sorted = [...filtered];
    switch (sortBy) {
      case 'nome': sorted.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); break;
      case 'flashcards': sorted.sort((a, b) => (b.totalFlashcards || 0) - (a.totalFlashcards || 0)); break;
      case 'revisao': sorted.sort((a, b) => (reviewsByMateria[b.id]?.pending || 0) - (reviewsByMateria[a.id]?.pending || 0)); break;
      default: break;
    }
    return sorted;
  };

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16) || 99;
    const g = parseInt(hex.slice(3, 5), 16) || 102;
    const b = parseInt(hex.slice(5, 7), 16) || 241;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // ─── EFFECTS & HANDLERS ───

  useEffect(() => {
    if (user) carregarMaterias();
  }, [user]);

  const carregarMaterias = async () => {
    try {
      setLoading(true);
      const userId = user.id || user.uid;
      const [data, fcData] = await Promise.all([listarMaterias(userId), listarFlashcards(userId)]);
      setMaterias(data);
      setAllFlashcards(fcData);
    } catch (err) {
      setError('Telemetria_Error: Falha ao sincronizar stacks.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;
    try {
      if (editingId) await atualizarMateria(editingId, formData);
      else await criarMateria(formData, user.id || user.uid);
      await carregarMaterias();
      resetForm();
      toast.success('Stack_Update: Sincronização concluída.');
    } catch { toast.error('Falha no deploy da stack.'); }
  };

  const handleEdit = (materia) => {
    setFormData({ nome: materia.nome, descricao: materia.descricao || '', cor: materia.cor || '#6366F1', concluida: !!materia.concluida });
    setEditingId(materia.id);
    setShowModal(true);
  };

  const toggleConcluida = async (materia) => {
    try {
      await atualizarMateria(materia.id, { ...materia, concluida: !materia.concluida });
      await carregarMaterias();
    } catch { toast.error('Erro de status.'); }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', cor: '#6366F1', concluida: false });
    setEditingId(null);
    setShowModal(false);
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id) return;
    setIsDeleting(true);
    try {
      await deletarMateria(confirmDelete.id);
      await carregarMaterias();
      toast.success('Módulo deletado.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="w-20 h-20 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Mapping_Inventory_Nodes...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <motion.div className="mb-12" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[22px] bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl border-2 border-white/10">
                <Layers size={32} className="text-white dark:text-slate-900" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-1">System_Stacks</h1>
                <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-cyan-500" /> Infrastructure & Knowledge Modules
                </p>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 font-black uppercase tracking-widest text-[11px] !rounded-[16px] shadow-lg shadow-indigo-600/20">
              <Plus size={18} className="mr-2" strokeWidth={3} /> New_Module
            </Button>
          </div>

          {/* TELEMETRY DASH */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'Efficiency_Rate', val: `${completionPercent}%`, sub: 'Concluídas', icon: CheckCircle2, col: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Active_Modules', val: materias.filter(m => !m.concluida).length, sub: 'Em andamento', icon: Cpu, col: 'text-indigo-500', bg: 'bg-indigo-500/10' },
              { label: 'Hot_Syncs', val: Object.values(reviewsByMateria).reduce((s, r) => s + r.pending, 0), sub: 'Revisões pendentes', icon: RotateCcw, col: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((s, i) => (
              <motion.div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] p-6 shadow-sm flex flex-col" whileHover={{ y: -4 }}>
                <div className={`w-10 h-10 rounded-[12px] ${s.bg} flex items-center justify-center mb-4 ${s.col}`}><s.icon size={20} strokeWidth={2.5} /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">{s.val}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-2">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* BARRA DE PROBE (BUSCA) */}
          <motion.div className="flex flex-col sm:flex-row gap-3 mt-10 bg-white dark:bg-slate-900 p-3 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Probe system stacks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 h-14 rounded-[16px] bg-slate-50 dark:bg-slate-950 border-0 text-slate-900 dark:text-white font-bold" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-14 px-6 rounded-[16px] bg-slate-50 dark:bg-slate-950 border-0 font-black uppercase text-[11px] tracking-widest cursor-pointer">
              <option value="recente">Most_Recent</option>
              <option value="nome">A-Z_Sort</option>
              <option value="flashcards">Logic_Units</option>
            </select>
          </motion.div>
        </motion.div>

        {/* LISTING */}
        <AnimatePresence mode="popLayout">
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={gridVariants} initial="hidden" animate="visible">
            {filterAndSort(materias).map((materia) => {
              const pending = reviewsByMateria[materia.id]?.pending || 0;
              const color = materia.cor || '#6366F1';
              return (
                <motion.div key={materia.id} layout variants={cardItemVariants} whileHover={{ y: -6 }}>
                  <div className={`relative bg-white dark:bg-slate-900 rounded-[32px] border-2 transition-all duration-300 overflow-hidden h-full flex flex-col ${materia.concluida ? 'opacity-60 grayscale' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500/50'}`}>
                    
                    {/* Efeito Glow Tático */}
                    <div className="absolute top-0 left-0 right-0 h-32 opacity-5 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }} />

                    <div className="p-8 flex-1 flex flex-col relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-[18px] flex items-center justify-center shadow-lg" style={{ backgroundColor: hexToRgba(color, 0.15), color, border: `2px solid ${hexToRgba(color, 0.2)}` }}>
                          <Code2 size={28} strokeWidth={2.5} />
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleEdit(materia)} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900"><Edit2 size={16} /></button>
                           <button onClick={() => setConfirmDelete({ isOpen: true, id: materia.id, nome: materia.nome })} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase leading-tight">{materia.nome}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-8">{materia.descricao || 'No documentation provided.'}</p>
                      
                      <div className="mt-auto flex flex-wrap gap-2">
                        {pending > 0 && <span className="px-3 py-1.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-amber-500/20"><RotateCcw size={12} /> {pending} Sync_Needed</span>}
                        {materia.concluida && <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"><CheckCircle2 size={12} /> Compiled</span>}
                      </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                       <div className="flex gap-3">
                         <div className="flex flex-col">
                           <span className="text-[14px] font-black font-mono text-slate-900 dark:text-white leading-none">{materia.totalFlashcards || 0}</span>
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Logics</span>
                         </div>
                         <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 my-auto" />
                         <div className="flex flex-col">
                           <span className="text-[14px] font-black font-mono text-slate-900 dark:text-white leading-none">{materia.totalResumos || 0}</span>
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Docs</span>
                         </div>
                       </div>
                       <button onClick={() => toggleConcluida(materia)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${materia.concluida ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-300 border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500'}`}>
                         <Check size={20} strokeWidth={3} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* MODAL EDITOR */}
        <Modal isOpen={showModal} onClose={resetForm} title={editingId ? 'Edit_Stack_Node' : 'Initialize_New_Stack'} size="md">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Input label="Module_Name" placeholder="Ex: Backend System, Cloud Infra..." value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required className="!h-14 !rounded-2xl" />
            <Textarea label="Documentation_Brief" placeholder="Module scope and core objectives..." value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} rows={3} className="!rounded-2xl" />
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Identity_Color_Hash</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-[24px] border-2 border-slate-100 dark:border-slate-900">
                {CORES_DISPONIVEIS.map(cor => (
                  <button key={cor.valor} type="button" onClick={() => setFormData({ ...formData, cor: cor.valor })} className="aspect-square rounded-[14px] relative transition-transform hover:scale-110" style={{ backgroundColor: cor.valor }}>
                    {formData.cor === cor.valor && <Check size={18} className="absolute inset-0 m-auto text-white drop-shadow-md" strokeWidth={4} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-indigo-600 h-16 !rounded-[18px] font-black uppercase tracking-widest text-[11px] shadow-xl">Commit_Stack</Button>
              <Button type="button" onClick={resetForm} variant="secondary" className="px-8 h-16 !rounded-[18px] font-black uppercase tracking-widest text-[11px]">Abort</Button>
            </div>
          </form>
        </Modal>

        <ConfirmModal isOpen={confirmDelete.isOpen} onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })} onConfirm={confirmarExclusao} title="Stack_Termination_Request" itemName={confirmDelete.nome} confirmText="Confirm_Termination" isLoading={isDeleting} type="danger" />
      </div>
    </div>
  );
}

export default Materias;