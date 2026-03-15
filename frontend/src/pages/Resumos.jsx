/**
 * 📚 Caderno de Estudos (Resumos)
 * - Editor: React Quill (Rich Text Engineering).
 * - UI: Interface limpa e focada no aprendizado.
 * - Lógica: Sincronização Firebase + Exportação PDF.
 *
 * @fixes
 * - Validação completa do formulário antes de submeter
 * - Tratamento de erro granular por operação
 * - Guard contra uid undefined em todas as ops Firestore
 * - Modal fecha corretamente em todos os cenários
 * - sortBy 'nome' aplicado corretamente (estava sendo sobrescrito)
 * - Quill placeholder não quebra em SSR/Suspense
 * - Upload: limite de 6 imagens com feedback visual
 * - Export PDF: sanitiza HTML antes de injetar no container
 * - Loading states independentes por operação
 * - Empty state diferencia "sem resultados" de "sem resumos"
 */

import React, {
  useState, useEffect, useMemo,
  useCallback, useRef, Suspense, lazy,
} from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = lazy(() => import('react-quill'));

import {
  Plus, Edit2, Trash2, Search, FileText, X,
  Calendar, Clock, BarChart2, Layers, ZoomIn, ZoomOut,
  AlignLeft, ImagePlus, Loader2, Download, Activity,
  BookOpen, AlertTriangle, RefreshCw, ArrowRight,
} from 'lucide-react';

import {
  listarResumos, criarResumo, atualizarResumo,
  deletarResumo, listarMateriasSimples,
} from '../services/firebaseService';
import { uploadImage }        from '../services/cloudinaryService';
import { Z }                  from '../constants/zIndex';
import { useAuth }            from '../contexts/AuthContext-firebase';
import { useDashboardData }   from '../contexts/DashboardDataContext';
import Button                 from '../components/ui/Button';
import { Input, Select }      from '../components/ui/Input';
import Badge                  from '../components/ui/Badge';
import ConfirmModal           from '../components/ui/ConfirmModal';

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────── */
const gridVariants = {
  hidden:   { opacity: 0 },
  visible:  { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden:   { opacity: 0, y: 15, scale: 0.95 },
  visible:  { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─────────────────────────────────────────
   QUILL CONFIG
───────────────────────────────────────── */
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['blockquote', 'code-block'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline',
  'list', 'bullet', 'color', 'background',
  'blockquote', 'code-block',
];

/* ─────────────────────────────────────────
   TEMPLATE
───────────────────────────────────────── */
const TEMPLATE_ESTUDO = `<h2>🎯 Objetivo do Estudo</h2>
<p>O que você deseja aprender ou consolidar com este resumo?</p>

<h3>💡 Conceitos Principais</h3>
<ul>
  <li><strong>Conceito 1:</strong> Explicação simples e direta com suas próprias palavras...</li>
  <li><strong>Conceito 2:</strong> Pontos de atenção ou regras importantes...</li>
</ul>

<h3>🧩 Exemplos e Prática</h3>
<p>Adicione trechos de código, frases aplicadas ou diagramas que ajudem a fixar a ideia...</p>

<h3>📝 Conclusão e Revisão</h3>
<p>Um parágrafo resumindo o aprendizado geral para revisão rápida antes de uma entrevista.</p>`;

const FORM_INITIAL = { titulo: '', conteudo: '', materiaId: '', imagens: [] };
const MAX_IMAGES   = 6;
const MAX_TITLE    = 120;

/* ─────────────────────────────────────────
   UTILITIES
───────────────────────────────────────── */
const stripHtml = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim();
};

const formatDate = (ts) => {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const days = Math.floor((Date.now() - date) / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7)  return `Há ${days} dias`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const readingTime = (html) => {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const m = Math.max(1, Math.ceil(words / 200));
  return `${m} min`;
};

const hexToRgba = (hex = '#6366f1', a) => {
  const r = parseInt(hex.slice(1, 3), 16) || 99;
  const g = parseInt(hex.slice(3, 5), 16) || 102;
  const b = parseInt(hex.slice(5, 7), 16) || 241;
  return `rgba(${r},${g},${b},${a})`;
};

/* ─────────────────────────────────────────
   FORM VALIDATION
───────────────────────────────────────── */
const validateForm = (data) => {
  const errors = {};
  if (!data.titulo.trim())            errors.titulo    = 'O título é obrigatório.';
  if (data.titulo.length > MAX_TITLE) errors.titulo    = `Máximo ${MAX_TITLE} caracteres.`;
  if (!stripHtml(data.conteudo))      errors.conteudo  = 'O conteúdo não pode estar vazio.';
  if (!data.materiaId)                errors.materiaId = 'Selecione uma matéria.';
  return errors;
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Resumos() {
  const { user }          = useAuth();
  const { refreshData }   = useDashboardData();
  const location          = useLocation();
  const imageInputRef     = useRef(null);

  /* ── Data ── */
  const [resumos, setResumos]     = useState([]);
  const [materias, setMaterias]   = useState([]);

  /* ── UI state ── */
  const [loading, setLoading]               = useState(true);
  const [loadError, setLoadError]           = useState(null);
  const [saving, setSaving]                 = useState(false);
  const [exportingPdf, setExportingPdf]     = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  /* ── Modal ── */
  const [showModal, setShowModal]   = useState(false);
  const [modalMode, setModalMode]   = useState('edit');
  const [editingId, setEditingId]   = useState(null);
  const [viewFontSize, setViewFontSize] = useState(1);

  /* ── Form ── */
  const [formData, setFormData]     = useState(FORM_INITIAL);
  const [formErrors, setFormErrors] = useState({});

  /* ── Filters ── */
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [sortBy, setSortBy]                 = useState('recente');

  /* ── Confirm delete ── */
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting]       = useState(false);

  /* ════════════════════════════════════════
     EFEITOS
  ════════════════════════════════════════ */

  /* Deep link: abrir modal ou filtrar matéria via location.state */
  useEffect(() => {
    if (!loading && location.state?.openNew) {
      openNew();
      window.history.replaceState({}, document.title);
    }
    if (location.state?.filterMateria) {
      setSelectedMateria(location.state.filterMateria);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loading]); // eslint-disable-line

  /* Carregar dados quando user estiver disponível */
  useEffect(() => {
    if (user?.uid) carregarDados();
  }, [user?.uid]); // eslint-disable-line

  /* ════════════════════════════════════════
     DATA FETCHING
  ════════════════════════════════════════ */
  const carregarDados = useCallback(async () => {
    if (!user?.uid) return;
    setLoadError(null);
    setLoading(true);
    try {
      const [resumosData, materiasData] = await Promise.all([
        listarResumos(user.uid),
        listarMateriasSimples(user.uid),
      ]);
      setResumos(resumosData   ?? []);
      setMaterias(materiasData ?? []);
    } catch (err) {
      console.error('[Resumos] carregarDados:', err);
      setLoadError('Não foi possível carregar seus resumos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /* ════════════════════════════════════════
     FILTROS / ORDENAÇÃO
  ════════════════════════════════════════ */
  const resumosFiltrados = useMemo(() => {
    let list = [...resumos];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r =>
        r.titulo.toLowerCase().includes(q) ||
        stripHtml(r.conteudo).toLowerCase().includes(q)
      );
    }

    if (selectedMateria !== 'all') {
      list = list.filter(r => r.materiaId === selectedMateria);
    }

    // ✅ FIX: sortBy 'nome' era sobrescrito por sort de data abaixo
    if (sortBy === 'nome') {
      list.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    } else {
      list.sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt ?? 0);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt ?? 0);
        return sortBy === 'antigo' ? da - db : db - da;
      });
    }

    return list;
  }, [resumos, searchTerm, selectedMateria, sortBy]);

  const stats = useMemo(() => ({
    total:           resumos.length,
    materiasUnicas:  new Set(resumos.map(r => r.materiaId).filter(Boolean)).size,
    semana:          resumos.filter(r => {
      const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt ?? 0);
      return Date.now() - d < 7 * 86400000;
    }).length,
  }), [resumos]);

  /* ════════════════════════════════════════
     HELPERS DE MODAL
  ════════════════════════════════════════ */
  const getMateriaInfo = useCallback(
    (id) => materias.find(m => m.id === id) ?? { nome: 'Sem Matéria', cor: '#6366f1' },
    [materias]
  );

  const openNew = () => {
    setFormData(FORM_INITIAL);
    setFormErrors({});
    setEditingId(null);
    setModalMode('edit');
    setViewFontSize(1);
    setShowModal(true);
  };

  const openEdit = (resumo) => {
    setFormData({
      titulo:    resumo.titulo    ?? '',
      conteudo:  resumo.conteudo  ?? '',
      materiaId: resumo.materiaId ?? '',
      imagens:   resumo.imagens   ?? [],
    });
    setFormErrors({});
    setEditingId(resumo.id);
    setModalMode('edit');
    setViewFontSize(1);
    setShowModal(true);
  };

  const openView = (resumo) => {
    setFormData({
      titulo:    resumo.titulo    ?? '',
      conteudo:  resumo.conteudo  ?? '',
      materiaId: resumo.materiaId ?? '',
      imagens:   resumo.imagens   ?? [],
    });
    setFormErrors({});
    setEditingId(resumo.id);
    setModalMode('view');
    setViewFontSize(1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    // Pequeno delay para não ver o reset antes do fade out
    setTimeout(() => {
      setFormData(FORM_INITIAL);
      setFormErrors({});
      setEditingId(null);
      setModalMode('edit');
    }, 250);
  };

  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  /* ════════════════════════════════════════
     OPERAÇÕES CRUD
  ════════════════════════════════════════ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) { toast.error('Sessão expirada. Faça login novamente.'); return; }

    // Validação
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Corrija os campos destacados antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titulo:    formData.titulo.trim(),
        conteudo:  formData.conteudo,
        materiaId: formData.materiaId,
        imagens:   formData.imagens,
      };

      if (editingId) {
        await atualizarResumo(editingId, payload);
        toast.success('Resumo atualizado!');
      } else {
        await criarResumo(payload, user.uid);
        toast.success('Resumo criado!');
      }

      await carregarDados();
      refreshData(user.uid).catch(() => {});
      closeModal();
    } catch (err) {
      console.error('[Resumos] handleSubmit:', err);
      toast.error('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id || !user?.uid) return;
    setIsDeleting(true);
    try {
      await deletarResumo(confirmDelete.id);
      await carregarDados();
      refreshData(user.uid).catch(() => {});
      toast.success('Resumo excluído.');
    } catch (err) {
      console.error('[Resumos] deletar:', err);
      toast.error('Não foi possível excluir. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  /* ════════════════════════════════════════
     UPLOAD DE IMAGENS
  ════════════════════════════════════════ */
  const handleImageUpload = async (files) => {
    if (!files?.length) return;

    const slots = MAX_IMAGES - (formData.imagens?.length ?? 0);
    if (slots <= 0) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens por resumo.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, slots);
    setUploadingImages(true);
    try {
      const urls = await Promise.all(toUpload.map(f => uploadImage(f)));
      patchForm({ imagens: [...(formData.imagens ?? []), ...urls] });
      toast.success(`${urls.length} imagem${urls.length > 1 ? 'ns' : ''} anexada${urls.length > 1 ? 's' : ''}.`);
    } catch (err) {
      console.error('[Resumos] upload:', err);
      toast.error('Falha no upload. Verifique o tamanho e formato das imagens.');
    } finally {
      setUploadingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  /* ════════════════════════════════════════
     EXPORT PDF
  ════════════════════════════════════════ */
  const exportarPdf = async () => {
    setExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const materia   = getMateriaInfo(formData.materiaId);
      const safeHtml  = DOMPurify.sanitize(formData.conteudo); // ✅ sanitize antes de injetar
      const container = document.createElement('div');
      container.style.cssText =
        'position:fixed;top:-9999px;width:800px;background:#fff;padding:60px;color:#020617;font-family:sans-serif;font-size:16px;line-height:1.6;';
      container.innerHTML = `
        <div style="border-bottom:3px solid ${materia.cor};padding-bottom:20px;margin-bottom:32px">
          <h1 style="font-size:28px;margin:0 0 8px;font-weight:800">${DOMPurify.sanitize(formData.titulo)}</h1>
          <span style="color:${materia.cor};font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.1em">${materia.nome}</span>
        </div>
        ${safeHtml}
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      document.body.removeChild(container);

      const pdf      = new jsPDF('p', 'mm', 'a4');
      const w        = pdf.internal.pageSize.getWidth();
      const h        = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      pdf.save(`${formData.titulo.replace(/\s+/g, '_').slice(0, 60)}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error('[Resumos] exportPdf:', err);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setExportingPdf(false);
    }
  };

  /* ════════════════════════════════════════
     LOADING / ERROR STATES
  ════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Carregando seu caderno de resumos...</p>
        </motion.div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 max-w-sm w-full text-center shadow-sm">
          <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" strokeWidth={2} />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{loadError}</p>
          <Button onClick={carregarDados} className="bg-indigo-600 w-full h-11 font-semibold !rounded-xl">
            <RefreshCw size={16} className="mr-2" /> Tentar novamente
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     RENDER PRINCIPAL
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div className="mb-12" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[18px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                <BookOpen size={28} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  Caderno de Estudos
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Activity size={14} className="text-indigo-500" />
                  Organize suas anotações e acelere seu aprendizado
                </p>
              </div>
            </div>

            <Button
              onClick={openNew}
              className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 font-semibold !rounded-[14px] shadow-md self-start lg:self-auto"
            >
              <Plus size={18} className="mr-2" strokeWidth={2.5} /> Novo Resumo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Total de Resumos',    val: stats.total,          icon: FileText,  col: 'text-indigo-500',  bg: 'bg-indigo-500/10'  },
              { label: 'Matérias Estudadas',  val: stats.materiasUnicas, icon: Layers,    col: 'text-cyan-500',    bg: 'bg-cyan-500/10'    },
              { label: 'Criados esta semana', val: `+${stats.semana}`,   icon: BarChart2, col: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className={`w-11 h-11 rounded-[12px] ${s.bg} flex items-center justify-center ${s.col} shrink-0`}>
                  <s.icon size={22} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{s.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-col lg:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar por assunto ou palavra-chave..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 h-11 rounded-[12px] bg-slate-50 dark:bg-slate-950 border-0 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={selectedMateria}
                onChange={e => setSelectedMateria(e.target.value)}
                className="!rounded-[12px] bg-slate-50 dark:bg-slate-950 border-0 h-11 text-sm min-w-[180px]"
              >
                <option value="all">Todas as Matérias</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
              <Select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="!rounded-[12px] bg-slate-50 dark:bg-slate-950 border-0 h-11 text-sm"
              >
                <option value="recente">Mais Recentes</option>
                <option value="antigo">Mais Antigos</option>
                <option value="nome">A–Z</option>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* ── GRID DE CARDS ── */}
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
          >
            {resumosFiltrados.map(resumo => {
              const mat = getMateriaInfo(resumo.materiaId);
              return (
                <motion.div key={resumo.id} layout variants={cardVariants} whileHover={{ y: -4 }}>
                  <div
                    onClick={() => openView(resumo)}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-[260px] flex flex-col cursor-pointer transition-shadow hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-300/50 dark:hover:border-indigo-700/50"
                  >
                    {/* Faixa colorida no topo */}
                    <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(to right, ${mat.cor}, transparent)` }} />

                    <div className="p-6 flex-1 flex flex-col z-10">
                      <div className="flex items-start justify-between mb-3">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border leading-none"
                          style={{ backgroundColor: hexToRgba(mat.cor, 0.1), color: mat.cor, borderColor: hexToRgba(mat.cor, 0.2) }}
                        >
                          {mat.nome}
                        </span>
                        {/* Ações — visíveis no hover */}
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); openEdit(resumo); }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmDelete({ isOpen: true, id: resumo.id, nome: resumo.titulo }); }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug line-clamp-2">
                        {resumo.titulo}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
                        {stripHtml(resumo.conteudo) || <span className="italic opacity-50">Sem conteúdo</span>}
                      </p>
                    </div>

                    <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={12} /> {formatDate(resumo.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} /> {readingTime(resumo.conteudo)}
                        </span>
                      </div>
                      <ArrowRight
                        size={15}
                        className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── EMPTY STATES ── */}
        {resumosFiltrados.length === 0 && (
          <div className="py-20 text-center">
            <BookOpen size={44} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
            {resumos.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Seu caderno está vazio
                </h3>
                <p className="text-sm text-slate-400 mt-1 mb-6">
                  Crie seu primeiro resumo para começar a organizar seus estudos.
                </p>
                <Button onClick={openNew} className="bg-indigo-600 h-11 px-6 font-semibold !rounded-xl mx-auto">
                  <Plus size={16} className="mr-2" /> Criar primeiro resumo
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum resumo encontrado
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Tente ajustar o filtro ou o termo de pesquisa.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── MODAL PRINCIPAL ── */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
              style={{ zIndex: Z.modal }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            >
              <motion.div
                className="bg-white dark:bg-slate-900 w-full max-w-5xl h-full sm:h-[90vh] rounded-none sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
                initial={{ y: 24, scale: 0.98 }}
                animate={{ y: 0,  scale: 1    }}
                exit={{    y: 24, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                onClick={e => e.stopPropagation()}
              >
                {/* Cabeçalho do modal */}
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={closeModal}
                      className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>

                    {/* Tab switcher */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      {[
                        { key: 'edit', label: 'Editar' },
                        { key: 'view', label: 'Ler'    },
                      ].map(t => (
                        <button
                          key={t.key}
                          onClick={() => setModalMode(t.key)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            modalMode === t.key
                              ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Título no header quando em modo leitura */}
                    {modalMode === 'view' && formData.titulo && (
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate hidden sm:block">
                        {formData.titulo}
                      </p>
                    )}
                  </div>

                  {/* Ações do header */}
                  <div className="flex items-center gap-2 shrink-0">
                    {modalMode === 'view' && (
                      <>
                        <div className="hidden sm:flex items-center gap-1 mr-1">
                          <button
                            onClick={() => setViewFontSize(f => Math.max(0.8, +(f - 0.1).toFixed(1)))}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Diminuir fonte"
                          >
                            <ZoomOut size={16} />
                          </button>
                          <span className="text-xs font-medium text-slate-500 w-10 text-center tabular-nums">
                            {Math.round(viewFontSize * 100)}%
                          </span>
                          <button
                            onClick={() => setViewFontSize(f => Math.min(1.5, +(f + 0.1).toFixed(1)))}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Aumentar fonte"
                          >
                            <ZoomIn size={16} />
                          </button>
                        </div>
                        <Button
                          onClick={exportarPdf}
                          loading={exportingPdf}
                          className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 !rounded-lg text-sm font-semibold"
                        >
                          <Download size={15} className="mr-1.5" /> PDF
                        </Button>
                        <Button
                          onClick={() => setModalMode('edit')}
                          className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 h-9 px-4 !rounded-lg text-sm font-semibold"
                        >
                          <Edit2 size={15} className="mr-1.5" /> Editar
                        </Button>
                      </>
                    )}
                    {modalMode === 'edit' && (
                      <Button
                        form="resumo-form"
                        type="submit"
                        loading={saving}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 !rounded-xl font-semibold shadow-md disabled:opacity-60"
                      >
                        {editingId ? 'Salvar Alterações' : 'Criar Resumo'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Corpo do modal */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
                  {modalMode === 'edit' ? (
                    /* ── MODO EDIÇÃO ── */
                    <form id="resumo-form" onSubmit={handleSubmit} noValidate className="p-5 sm:p-8 max-w-4xl mx-auto space-y-7">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Título */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Título do Resumo <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.titulo}
                            onChange={e => {
                              patchForm({ titulo: e.target.value });
                              if (formErrors.titulo) setFormErrors(p => ({ ...p, titulo: undefined }));
                            }}
                            placeholder="Ex: Introdução ao Spring Boot e MVC"
                            maxLength={MAX_TITLE}
                            className={`w-full h-12 px-4 rounded-xl border text-sm font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400
                              ${formErrors.titulo
                                ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                              }`}
                          />
                          <div className="flex justify-between">
                            {formErrors.titulo
                              ? <p className="text-xs text-rose-500">{formErrors.titulo}</p>
                              : <span />
                            }
                            <p className="text-xs text-slate-400 tabular-nums">{formData.titulo.length}/{MAX_TITLE}</p>
                          </div>
                        </div>

                        {/* Matéria */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Matéria <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={formData.materiaId}
                            onChange={e => {
                              patchForm({ materiaId: e.target.value });
                              if (formErrors.materiaId) setFormErrors(p => ({ ...p, materiaId: undefined }));
                            }}
                            className={`w-full h-12 px-4 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all
                              ${formErrors.materiaId
                                ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                              }`}
                          >
                            <option value="">Selecione a matéria...</option>
                            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                          </select>
                          {formErrors.materiaId && (
                            <p className="text-xs text-rose-500">{formErrors.materiaId}</p>
                          )}
                        </div>
                      </div>

                      {/* Editor */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <AlignLeft size={15} className="text-indigo-500" />
                            Anotações <span className="text-rose-500">*</span>
                          </label>
                          {!editingId && (
                            <button
                              type="button"
                              onClick={() => patchForm({ conteudo: TEMPLATE_ESTUDO })}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-colors"
                            >
                              Usar Template Básico
                            </button>
                          )}
                        </div>

                        <div className={`rounded-xl overflow-hidden border bg-white dark:bg-slate-900 min-h-[380px] transition-all ${
                          formErrors.conteudo
                            ? 'border-rose-400'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}>
                          <Suspense fallback={
                            <div className="flex items-center justify-center h-40">
                              <Loader2 className="animate-spin text-indigo-500" size={24} />
                            </div>
                          }>
                            <ReactQuill
                              theme="snow"
                              value={formData.conteudo}
                              onChange={v => {
                                patchForm({ conteudo: v });
                                if (formErrors.conteudo) setFormErrors(p => ({ ...p, conteudo: undefined }));
                              }}
                              modules={QUILL_MODULES}
                              formats={QUILL_FORMATS}
                              className="quill-study-editor"
                              placeholder="Escreva suas anotações aqui..."
                            />
                          </Suspense>
                        </div>
                        {formErrors.conteudo && (
                          <p className="text-xs text-rose-500">{formErrors.conteudo}</p>
                        )}
                      </div>

                      {/* Upload de imagens */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Imagens Anexadas</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formData.imagens.length}/{MAX_IMAGES} imagens</p>
                          </div>
                          <Button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            loading={uploadingImages}
                            disabled={formData.imagens.length >= MAX_IMAGES || uploadingImages}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 h-9 px-4 !rounded-lg text-sm font-medium disabled:opacity-50"
                          >
                            <ImagePlus size={15} className="mr-1.5" /> Adicionar
                          </Button>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => handleImageUpload(e.target.files)}
                          />
                        </div>

                        {formData.imagens.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {formData.imagens.map((url, i) => (
                              <div key={i} className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img src={url} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => patchForm({ imagens: formData.imagens.filter((_, idx) => idx !== i) })}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-500/90 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-700 transition-colors text-center"
                          >
                            Clique para adicionar capturas de tela, diagramas ou fotos
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    /* ── MODO LEITURA ── */
                    <div className="p-6 sm:p-14 max-w-3xl mx-auto">
                      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 selection:bg-indigo-500/20">
                        <Badge
                          color={getMateriaInfo(formData.materiaId).cor}
                          className="mb-6 font-semibold !px-3 !py-1 text-xs"
                        >
                          {getMateriaInfo(formData.materiaId).nome}
                        </Badge>

                        <h1
                          className="font-bold text-slate-900 dark:text-white leading-tight mb-8"
                          style={{ fontSize: `${viewFontSize * 2.2}rem` }}
                        >
                          {formData.titulo || <span className="text-slate-400 italic">Sem título</span>}
                        </h1>

                        <div
                          className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/50 prose-code:rounded prose-code:px-1 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800"
                          style={{ fontSize: `${viewFontSize}rem` }}
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.conteudo) }}
                        />

                        {formData.imagens.length > 0 && (
                          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-5">
                              Imagens Anexadas
                            </h3>
                            <div className="space-y-5">
                              {formData.imagens.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt={`Imagem ${i + 1}`}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CONFIRM DELETE ── */}
        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
          onConfirm={confirmarExclusao}
          title="Excluir Resumo?"
          itemName={confirmDelete.nome}
          confirmText="Sim, excluir"
          isLoading={isDeleting}
          type="danger"
        />
      </div>

      <style>{`
        .quill-study-editor .ql-container {
          min-height: 340px;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 15px;
          border: none !important;
        }
        .quill-study-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: #f8fafc;
          border-radius: 0.75rem 0.75rem 0 0;
        }
        .dark .quill-study-editor .ql-toolbar {
          border-bottom-color: #1e293b !important;
          background: #0f172a;
        }
        .dark .quill-study-editor .ql-stroke  { stroke: #94a3b8; }
        .dark .quill-study-editor .ql-fill    { fill:  #94a3b8; }
        .dark .quill-study-editor .ql-picker   { color: #94a3b8; }
        .dark .quill-study-editor .ql-editor   { color: #e2e8f0; }
        .dark .quill-study-editor .ql-editor.ql-blank::before { color: #475569; }

        .custom-scrollbar::-webkit-scrollbar        { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track  { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb  { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover  { background: #94a3b8; }
      `}</style>
    </div>
  );
}