/**
 * 📚 DOCS_CORE (Resumos) — Syntax Theme Premium
 * * Repositório central de documentação técnica e arquitetura.
 * - Editor: React Quill (Rich Text Engineering).
 * - UI: Responsive Documentation Hub (Glow-Filtered Grid).
 * - Lógica: 100% Preservada (Sincronização Firebase + Exportação PDF).
 */

import React, { useState, useEffect, useMemo, Suspense, lazy, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-quill/dist/quill.snow.css';

// Lazy loading para performance de rede
const ReactQuill = lazy(() => import('react-quill'));

import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  FileText,
  X,
  Calendar,
  ClipboardList,
  BookOpen,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Download,
  Clock,
  BarChart2,
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  ImagePlus,
  Paperclip,
  Loader2,
  AlertTriangle,
  Terminal,
  Cpu,
  Hash,
  Activity
} from 'lucide-react';

import { 
  listarResumos, 
  criarResumo, 
  atualizarResumo, 
  deletarResumo, 
  listarMateriasSimples
} from '../services/firebaseService';
import { uploadImage } from '../services/cloudinaryService';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';

/* ═══════════════════════════════════════════
   ANIMATION & CONFIG
   ═══════════════════════════════════════════ */

const gridVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ list: 'ordered'}, { list: 'bullet' }],
    [{ color: [] }],
    ['clean']
  ],
};

const quillFormats = ['header', 'bold', 'italic', 'list', 'bullet', 'color'];

// Novo Template: Engenharia de Software
const TEMPLATE_ARQUITETURA = `<h2>🏗️ System Architecture Proposal</h2>

<h3>Core Objective</h3>
<p>Defina o propósito principal deste módulo ou funcionalidade...</p>

<h3>Stack Trace & Dependencies</h3>
<p>Listagem de linguagens, frameworks e bibliotecas utilizadas...</p>

<h3>System Design</h3>
<ul>
<li><strong>Pattern:</strong> (Ex: MVC, Microservices, Event-Driven)</li>
<li><strong>Frontend:</strong> </li>
<li><strong>Backend:</strong> </li>
<li><strong>Database:</strong> </li>
<li><strong>Infrastructure:</strong> </li>
</ul>

<h3>Data Flow & Logic</h3>
<p>Explicação de como os dados trafegam pelo sistema...</p>

<h3>Endpoint Documentation</h3>
<ul>
<li><strong>GET /route:</strong> Descrição</li>
<li><strong>POST /route:</strong> Descrição</li>
</ul>

<h3>Testing Strategy</h3>
<p>Plano de testes unitários, integrados e E2E...</p>
`;

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Recent_Log';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const estimateReadingTime = (html) => {
  const words = stripHtml(html).trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.ceil(words / 200);
  return mins <= 1 ? '1m' : `${mins}m`;
};

const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16) || 99;
  const g = parseInt(hex.slice(3, 5), 16) || 102;
  const b = parseInt(hex.slice(5, 7), 16) || 241;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

function Resumos() {
  const { user } = useAuth();
  const { refreshData } = useDashboardData();
  const location = useLocation();
  
  const [resumos, setResumos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingResumo, setViewingResumo] = useState(null);
  const [modalMode, setModalMode] = useState('edit');
  const [viewFontSize, setViewFontSize] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [sortBy, setSortBy] = useState('recente');
  const [formData, setFormData] = useState({ titulo: '', conteudo: '', materiaId: '', imagens: [] });
  const [error, setError] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = React.useRef(null);

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (location.state?.openNew && !loading) {
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
    if (location.state?.filterMateria) {
      setSelectedMateria(location.state.filterMateria);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loading]);

  useEffect(() => {
    if (user) carregarDados();
  }, [user]);

  const resumosFiltrados = useMemo(() => {
    let filtered = [...resumos];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.titulo.toLowerCase().includes(q) ||
        stripHtml(r.conteudo).toLowerCase().includes(q)
      );
    }
    if (selectedMateria !== 'all') {
      filtered = filtered.filter(r => r.materiaId === selectedMateria);
    }
    
    filtered.sort((a, b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return sortBy === 'antigo' ? da - db : db - da;
    });

    if (sortBy === 'nome') filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
    
    return filtered;
  }, [resumos, searchTerm, selectedMateria, sortBy]);

  const statsResumos = useMemo(() => {
    const materiasCobertas = new Set(resumos.map(r => r.materiaId).filter(Boolean)).size;
    const semanaPassada = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const novosNaSemana = resumos.filter(r => {
      const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || 0);
      return d >= semanaPassada;
    }).length;
    return { total: resumos.length, materiasCobertas, novosNaSemana };
  }, [resumos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userId = user?.uid;
      const [resumosData, materiasData] = await Promise.all([
        listarResumos(userId),
        listarMateriasSimples(userId)
      ]);
      setResumos(resumosData);
      setMaterias(materiasData);
    } catch (err) {
      setError('Telemetria_Error: Falha na ingestão do repositório.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.conteudo.trim()) return;
    try {
      const userId = user?.uid;
      if (editingId) await atualizarResumo(editingId, formData);
      else await criarResumo(formData, userId);
      await carregarDados();
      refreshData(userId).catch(() => {});
      resetForm();
      toast.success('Commit_Success: Documentação sincronizada.');
    } catch {
      toast.error('Deploy_Error: Falha ao salvar documento.');
    }
  };

  const handleEdit = (resumo) => {
    setFormData({ titulo: resumo.titulo, conteudo: resumo.conteudo, materiaId: resumo.materiaId || '', imagens: resumo.imagens || [] });
    setEditingId(resumo.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleView = (resumo) => {
    setViewingResumo(resumo);
    setModalMode('view');
    setEditingId(resumo.id);
    setFormData({ titulo: resumo.titulo, conteudo: resumo.conteudo, materiaId: resumo.materiaId || '', imagens: resumo.imagens || [] });
    setShowModal(true);
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id) return;
    setIsDeleting(true);
    try {
      await deletarResumo(confirmDelete.id);
      await carregarDados();
      refreshData(user.uid).catch(() => {});
      toast.success('Resource_Terminated: Documento removido.');
    } catch {
      toast.error('Erro na remoção do asset.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const uploads = Array.from(files).slice(0, 6 - (formData.imagens?.length || 0));
      const urls = await Promise.all(uploads.map(f => uploadImage(f)));
      setFormData(prev => ({ ...prev, imagens: [...(prev.imagens || []), ...urls] }));
      toast.success(`${urls.length} assets anexados.`);
    } catch {
      toast.error('Image_Ingestion_Fault.');
    } finally {
      setUploadingImages(false);
    }
  };

  const exportarPdf = async () => {
    const resumo = viewingResumo || formData;
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;top:-9999px;width:800px;background:white;padding:60px;color:#020617;font-family:sans-serif;';
      const materia = getMateriaInfo(resumo.materiaId);
      
      container.innerHTML = `
        <div style="border-bottom:2px solid #6366F1;padding-bottom:20px;margin-bottom:30px">
          <h1 style="font-size:32px;margin:0;">${resumo.titulo}</h1>
          <p style="color:#6366F1;font-weight:bold;margin:10px 0 0;">${materia.nome.toUpperCase()}</p>
        </div>
        <div style="line-height:1.6;font-size:16px;">${resumo.conteudo}</div>
      `;
      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2 });
      document.body.removeChild(container);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(canvas.toDataURL('image/png'));
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resumo.titulo.replace(/\s+/g, '_')}.pdf`);
      toast.success('Documentation_Exported: PDF gerado.');
    } catch {
      toast.error('Export_Fault.');
    } finally {
      setExportingPdf(false);
    }
  };

  const resetForm = () => {
    setFormData({ titulo: '', conteudo: '', materiaId: '', imagens: [] });
    setEditingId(null);
    setShowModal(false);
    setViewingResumo(null);
  };

  const getMateriaInfo = (materiaId) => materias.find(m => m.id === materiaId) || { nome: 'Default_Stack', cor: '#6366F1' };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="w-20 h-20 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Documentation_Repository...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <motion.div className="mb-12" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[22px] bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl border-2 border-white/10 shrink-0">
                <FileText size={32} className="text-white dark:text-slate-900" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-1">Doc_Repository</h1>
                <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" /> Synthesized Knowledge Assets
                </p>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-indigo-600 h-14 px-8 font-black uppercase tracking-widest text-[11px] !rounded-[16px] shadow-lg">
              <Plus size={18} className="mr-2" strokeWidth={3} /> New_Document
            </Button>
          </div>

          {/* TELEMETRY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10">
            {[
              { label: 'Total_Docs', val: statsResumos.total, icon: FileText, col: 'text-indigo-500', bg: 'bg-indigo-500/10' },
              { label: 'Stacks_Documented', val: statsResumos.materiasCobertas, icon: Layers, col: 'text-cyan-500', bg: 'bg-cyan-500/10' },
              { label: 'Weekly_Throughput', val: `+${statsResumos.novosNaSemana}`, icon: BarChart2, col: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] p-6 shadow-sm">
                <div className={`w-10 h-10 rounded-[12px] ${s.bg} flex items-center justify-center mb-4 ${s.col}`}><s.icon size={20} strokeWidth={2.5} /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">{s.val}</p>
              </div>
            ))}
          </div>

          {/* PROBE BAR */}
          <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-900 p-3 rounded-[24px] border-2 border-slate-100 dark:border-slate-800 shadow-sm mt-10">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Probe documentation..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 h-14 rounded-[16px] bg-slate-50 dark:bg-slate-950 border-0 text-slate-900 dark:text-white font-bold" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedMateria} onChange={(e) => setSelectedMateria(e.target.value)} className="!rounded-[14px] bg-slate-50 dark:bg-slate-950 border-0 h-14 font-bold min-w-[200px]">
                <option value="all">All_Stacks</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="!rounded-[14px] bg-slate-50 dark:bg-slate-950 border-0 h-14 font-black uppercase text-[11px] tracking-widest">
                <option value="recente">Most_Recent</option>
                <option value="antigo">Legacy_First</option>
                <option value="nome">Alpha_Sort</option>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* LISTING */}
        <AnimatePresence mode="popLayout">
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={gridVariants} initial="hidden" animate="visible">
            {resumosFiltrados.map((resumo) => {
              const materia = getMateriaInfo(resumo.materiaId);
              return (
                <motion.div key={resumo.id} layout variants={cardItemVariants} whileHover={{ y: -6 }}>
                  <div onClick={() => handleView(resumo)} className="group relative bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 overflow-hidden h-[280px] flex flex-col cursor-pointer transition-all hover:border-indigo-500/50">
                    <div className="absolute top-0 left-0 right-0 h-32 opacity-5 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${materia.cor}, transparent)` }} />
                    <div className="p-8 flex-1 flex flex-col relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border" style={{ backgroundColor: hexToRgba(materia.cor, 0.1), color: materia.cor, borderColor: hexToRgba(materia.cor, 0.2) }}>{materia.nome}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(resumo); }} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 size={14} /></button>
                           <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ isOpen: true, id: resumo.id, nome: resumo.titulo }); }} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter leading-tight line-clamp-2">{resumo.titulo}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">{stripHtml(resumo.conteudo)}</p>
                    </div>
                    <div className="px-8 py-5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                       <div className="flex gap-4">
                         <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Calendar size={12} /> {formatDate(resumo.createdAt)}</span>
                         <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Clock size={12} /> {estimateReadingTime(resumo.conteudo)}</span>
                       </div>
                       <ArrowRight size={16} className="text-indigo-500 transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* EMPTY STATE */}
        {resumosFiltrados.length === 0 && (
          <div className="py-24 text-center opacity-40">
            <Terminal size={48} className="mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-tight">Repository_Empty</h3>
            <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest mt-2">Nenhum documento localizado no buffer atual.</p>
          </div>
        )}

        {/* FULLSCREEN MODAL */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-6 bg-slate-950/90 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm}>
              <motion.div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-full sm:h-[90vh] rounded-none sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl border-2 border-white/5" initial={{ y: 50, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.98 }} onClick={e => e.stopPropagation()}>
                
                {/* MODAL HEADER */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button onClick={resetForm} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"><X size={20} strokeWidth={3} /></button>
                    <div className="h-10 w-px bg-slate-200 dark:border-slate-800" />
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-[14px] shadow-inner">
                      <button onClick={() => setModalMode('edit')} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${modalMode === 'edit' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-lg' : 'text-slate-400'}`}>Edit_Node</button>
                      <button onClick={() => setModalMode('view')} className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${modalMode === 'view' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-lg' : 'text-slate-400'}`}>Preview_Log</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                     {modalMode === 'view' && (
                       <div className="flex items-center gap-2 mr-4">
                          <button onClick={() => setViewFontSize(f => Math.max(0.8, f-0.1))} className="p-2 text-slate-400 hover:text-white"><ZoomOut size={18} /></button>
                          <span className="text-[10px] font-black font-mono text-slate-500 w-12 text-center">{Math.round(viewFontSize*100)}%</span>
                          <button onClick={() => setViewFontSize(f => Math.min(1.5, f+0.1))} className="p-2 text-slate-400 hover:text-white"><ZoomIn size={18} /></button>
                          <Button onClick={exportarPdf} loading={exportingPdf} className="bg-emerald-600 h-10 px-4 !rounded-xl text-[10px] uppercase font-black tracking-widest"><Download size={14} className="mr-2" /> PDF</Button>
                       </div>
                     )}
                     {modalMode === 'edit' && <Button form="resumo-form" type="submit" className="bg-indigo-600 h-12 px-8 !rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/20">Sincronizar Buffer</Button>}
                  </div>
                </div>

                {/* MODAL BODY */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {modalMode === 'edit' ? (
                    <form id="resumo-form" onSubmit={handleSubmit} className="p-10 max-w-4xl mx-auto space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input label="Document_Identity" placeholder="Ex: Microservices Topology..." value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required className="!h-16 !text-lg !rounded-2xl bg-white dark:bg-slate-950 font-black italic" />
                        <Select label="Vincular Stack" value={formData.materiaId} onChange={e => setFormData({...formData, materiaId: e.target.value})} required className="!h-16 !rounded-2xl" >
                          <option value="">Select Stack...</option>
                          {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2"><AlignLeft size={14} className="text-indigo-500" /> Content_Buffer</label>
                           {!editingId && <button type="button" onClick={() => setFormData({...formData, conteudo: TEMPLATE_ARQUITETURA})} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/10 transition-all">Use Architecture Template</button>}
                        </div>
                        <div className="rounded-[24px] overflow-hidden border-2 border-slate-100 dark:border-slate-800 min-h-[400px]">
                          <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>}>
                            <ReactQuill theme="snow" value={formData.conteudo} onChange={c => setFormData({...formData, conteudo: c})} modules={quillModules} formats={quillFormats} className="quill-syntax-editor" />
                          </Suspense>
                        </div>
                      </div>

                      {/* IMAGE UPLOAD */}
                      <div className="bg-slate-50 dark:bg-black/40 rounded-[32px] p-8 border-2 border-dashed border-slate-200 dark:border-slate-800">
                         <div className="flex items-center justify-between mb-8">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Resource_Assets</span>
                           <Button type="button" onClick={() => imageInputRef.current?.click()} loading={uploadingImages} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-10 px-6 !rounded-xl text-[10px] uppercase font-black"><ImagePlus size={14} className="mr-2" /> Import Assets</Button>
                           <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
                         </div>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                           {formData.imagens.map((url, i) => (
                             <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-white/5">
                               <img src={url} className="w-full h-full object-cover" />
                               <button type="button" onClick={() => setFormData(p => ({...p, imagens: p.imagens.filter((_, idx) => idx !== i)}))} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                             </div>
                           ))}
                         </div>
                      </div>
                    </form>
                  ) : (
                    <div className="p-12 sm:p-20 max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow-inner rounded-[42px] my-10 border border-slate-100 dark:border-slate-800 selection:bg-indigo-500 selection:text-white">
                      <Badge color={getMateriaInfo(formData.materiaId).cor} className="mb-10 uppercase font-black text-[10px] tracking-[0.2em] !px-4 !py-2 shadow-xl">{getMateriaInfo(formData.materiaId).nome}</Badge>
                      <h1 className="font-black text-slate-900 dark:text-white leading-tight mb-12 tracking-tighter uppercase italic" style={{ fontSize: `${viewFontSize * 3}rem` }}>{formData.titulo}</h1>
                      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:italic prose-p:font-medium prose-p:leading-relaxed" style={{ fontSize: `${viewFontSize}rem` }} dangerouslySetInnerHTML={{ __html: formData.conteudo }} />
                      
                      {formData.imagens.length > 0 && (
                        <div className="mt-20 pt-20 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10 block text-center">Reference_Attachments</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {formData.imagens.map((url, i) => (
                              <img key={i} src={url} className="w-full rounded-[24px] border-4 border-slate-100 dark:border-slate-800 shadow-2xl" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmModal isOpen={confirmDelete.isOpen} onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })} onConfirm={confirmarExclusao} title="Destroy_Document_Asset?" itemName={confirmDelete.nome} confirmText="Terminate_Resource" isLoading={isDeleting} type="danger" />
      </div>

      <style>{`
        .quill-syntax-editor .ql-container { min-height: 400px; font-family: 'Inter', sans-serif; font-size: 16px; border: none !important; }
        .quill-syntax-editor .ql-toolbar { border: none !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; background: rgba(0,0,0,0.02); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default Resumos;