/**
 * 🛰️ FLASHCARDS PRO — Syntax Theme
 *
 * @fixes
 * - Validação granular do formulário (campos obrigatórios + feedback inline)
 * - Guard uid undefined em todas as ops Firestore
 * - useEffect do keyboard com deps corretas (sem stale closures)
 * - Loading states independentes por operação
 * - carregarDados não recria referência a cada render (useCallback)
 * - Empty state diferencia "sem flashcards" de "sem resultados no filtro"
 * - Modo estudo: botão de virar card acessível além do clique
 * - Cleanup correto do event listener de teclado
 * - Separação de SM-2 rating: não avança automaticamente sem o usuário avaliar
 * - resetForm não depende de closure stale
 */

import React, {
  useState, useEffect, useCallback,
  useMemo, useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Filter, CreditCard, ImageIcon, X, Play,
  ChevronLeft, ChevronRight, RotateCcw, Terminal,
  Cpu, Zap, Activity, CheckCircle2, AlertTriangle,
  RefreshCw, BookOpen,
} from 'lucide-react';

import {
  listarFlashcards, criarFlashcard, atualizarFlashcard,
  deletarFlashcard, listarMateriasSimples,
} from '../services/firebaseService';
import { compressImage }              from '../utils/imageCompressor';
import { Z }                          from '../constants/zIndex';
import TagInput                       from '../components/TagInput';
import { calculateSM2, isDueForReview, getNextReviewLabel } from '../utils/sm2';
import { useAuth }                    from '../contexts/AuthContext-firebase';
import Button                         from '../components/ui/Button';
import Modal                          from '../components/ui/Modal';
import { Textarea, Select }           from '../components/ui/Input';
import FlashcardItem                  from '../components/FlashcardItem';
import Badge                          from '../components/ui/Badge';
import ConfirmModal                   from '../components/ui/ConfirmModal';
import { isTypingInInput }            from '../utils/keyboard';

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────── */
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden:   { opacity: 0, y: 15, scale: 0.96 },
  visible:  { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const slideVariants = {
  enter:  (d) => ({ x: d > 0 ?  400 : -400, opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] } },
  exit:   (d) => ({ x: d < 0 ?  400 : -400, opacity: 0, scale: 0.92, transition: { duration: 0.3 } }),
};

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const FORM_INITIAL = {
  pergunta:   '',
  resposta:   '',
  materiaId:  '',
  materiaNome:'',
  materiaCor: '',
  tags:       [],
};

const MAX_PERGUNTA = 400;
const MAX_RESPOSTA = 800;

/* ─────────────────────────────────────────
   FORM VALIDATION
───────────────────────────────────────── */
const validateForm = (data) => {
  const e = {};
  if (!data.pergunta.trim())               e.pergunta  = 'A pergunta é obrigatória.';
  if (data.pergunta.length > MAX_PERGUNTA) e.pergunta  = `Máximo ${MAX_PERGUNTA} caracteres.`;
  if (!data.resposta.trim())               e.resposta  = 'A resposta é obrigatória.';
  if (data.resposta.length > MAX_RESPOSTA) e.resposta  = `Máximo ${MAX_RESPOSTA} caracteres.`;
  if (!data.materiaId)                     e.materiaId = 'Selecione uma matéria.';
  return e;
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Flashcards() {
  const { user }   = useAuth();
  const location   = useLocation();
  const uid        = user?.uid || user?.id;

  /* ── Data ── */
  const [flashcards, setFlashcards]       = useState([]);
  const [materias, setMaterias]           = useState([]);

  /* ── UI ── */
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState(null);
  const [saving, setSaving]               = useState(false);

  /* ── Modal ── */
  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);

  /* ── Form ── */
  const [formData, setFormData]           = useState(FORM_INITIAL);
  const [formErrors, setFormErrors]       = useState({});
  const [imagePreview, setImagePreview]   = useState(null);
  const [imageFile, setImageFile]         = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);

  /* ── Filtros ── */
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [selectedTag, setSelectedTag]         = useState('all');

  /* ── Delete ── */
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting]       = useState(false);

  /* ── Modo Estudo ── */
  const [modoEstudo, setModoEstudo]       = useState(false);
  const [modoRevisao, setModoRevisao]     = useState(false);
  const [studyCards, setStudyCards]       = useState([]);
  const [currentIndex, setCurrentIndex]  = useState(0);
  const [isFlipped, setIsFlipped]        = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);

  /* Refs para o keyboard handler — evita closure stale */
  const isFlippedRef    = useRef(isFlipped);
  const currentIndexRef = useRef(currentIndex);
  const studyCardsRef   = useRef(studyCards);
  const modoEstudoRef   = useRef(modoEstudo);

  useEffect(() => { isFlippedRef.current    = isFlipped;    }, [isFlipped]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { studyCardsRef.current   = studyCards;   }, [studyCards]);
  useEffect(() => { modoEstudoRef.current   = modoEstudo;   }, [modoEstudo]);

  /* ════════════════════════════════════════
     DATA
  ════════════════════════════════════════ */
  const carregarDados = useCallback(async () => {
    if (!uid) return;
    setLoadError(null);
    setLoading(true);
    try {
      const [fcs, mats] = await Promise.all([
        listarFlashcards(uid),
        listarMateriasSimples(uid),
      ]);
      const enriched = (fcs ?? []).map(fc => {
        if (fc.materiaNome && fc.materiaCor) return fc;
        const m = (mats ?? []).find(x => x.id === fc.materiaId);
        return { ...fc, materiaNome: fc.materiaNome || m?.nome || 'Sem Matéria', materiaCor: fc.materiaCor || m?.cor || '#6366f1' };
      });
      setFlashcards(enriched);
      setMaterias(mats ?? []);
    } catch (err) {
      console.error('[Flashcards] carregarDados:', err);
      setLoadError('Não foi possível carregar seus flashcards. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  /* ── Location state ── */
  useEffect(() => {
    if (location.state?.filterMateria) {
      setSelectedMateria(location.state.filterMateria);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.reviewMode && flashcards.length > 0 && !modoEstudo) {
      iniciarModoEstudo(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, flashcards.length]); // eslint-disable-line

  /* ════════════════════════════════════════
     FILTROS
  ════════════════════════════════════════ */
  const flashcardsFiltrados = useMemo(() => {
    let list = [...flashcards];
    if (selectedMateria !== 'all') list = list.filter(fc => fc.materiaId === selectedMateria);
    if (selectedTag     !== 'all') list = list.filter(fc => fc.tags?.includes(selectedTag));
    return list;
  }, [flashcards, selectedMateria, selectedTag]);

  const allTags = useMemo(() => {
    const base = selectedMateria === 'all' ? flashcards : flashcards.filter(fc => fc.materiaId === selectedMateria);
    return [...new Set(base.flatMap(fc => fc.tags ?? []))].sort();
  }, [flashcards, selectedMateria]);

  const pendingReviewCount = useMemo(
    () => flashcards.filter(fc => isDueForReview(fc)).length,
    [flashcards]
  );

  /* ════════════════════════════════════════
     FORM HELPERS
  ════════════════════════════════════════ */
  const patchForm = (patch) => setFormData(p => ({ ...p, ...patch }));

  const handleMateriaChange = (e) => {
    const mat = materias.find(m => m.id === e.target.value);
    patchForm({ materiaId: e.target.value, materiaNome: mat?.nome ?? '', materiaCor: mat?.cor ?? '#6366f1' });
    if (formErrors.materiaId) setFormErrors(p => ({ ...p, materiaId: undefined }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo 10MB.'); return; }
    setCompressingImage(true);
    try {
      const b64 = await compressImage(file);
      setImageFile(b64);
      setImagePreview(b64);
    } catch {
      toast.error('Erro ao processar a imagem. Tente outro arquivo.');
    } finally {
      setCompressingImage(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData(FORM_INITIAL);
    setFormErrors({});
    setEditingId(null);
    setImagePreview(null);
    setImageFile(null);
    setShowModal(false);
  }, []);

  /* ════════════════════════════════════════
     CRUD
  ════════════════════════════════════════ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid) { toast.error('Sessão expirada. Faça login novamente.'); return; }

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Corrija os campos antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        pergunta:    formData.pergunta.trim(),
        resposta:    formData.resposta.trim(),
        materiaId:   formData.materiaId,
        materiaNome: formData.materiaNome,
        materiaCor:  formData.materiaCor,
        tags:        formData.tags ?? [],
      };
      if (editingId) await atualizarFlashcard(editingId, payload, imageFile);
      else           await criarFlashcard(payload, imageFile, uid);

      await carregarDados();
      resetForm();
      toast.success(editingId ? 'Flashcard atualizado!' : 'Flashcard criado!');
    } catch (err) {
      console.error('[Flashcards] handleSubmit:', err);
      toast.error('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fc) => {
    setFormData({
      pergunta:    fc.pergunta    ?? '',
      resposta:    fc.resposta    ?? '',
      materiaId:   fc.materiaId   ?? '',
      materiaNome: fc.materiaNome ?? '',
      materiaCor:  fc.materiaCor  ?? '#6366f1',
      tags:        fc.tags        ?? [],
    });
    setFormErrors({});
    setEditingId(fc.id);
    setImagePreview(fc.imagemUrl ?? null);
    setImageFile(fc.imagemUrl   ?? null);
    setShowModal(true);
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id || !uid) return;
    setIsDeleting(true);
    try {
      await deletarFlashcard(confirmDelete.id);
      await carregarDados();
      toast.success('Flashcard excluído.');
    } catch {
      toast.error('Erro ao excluir. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  /* ════════════════════════════════════════
     MODO ESTUDO
  ════════════════════════════════════════ */
  const iniciarModoEstudo = useCallback((reviewOnly = false) => {
    const base = reviewOnly
      ? flashcardsFiltrados.filter(fc => isDueForReview(fc))
      : flashcardsFiltrados;

    if (base.length === 0) {
      toast.info(reviewOnly ? 'Nenhuma revisão pendente! 🎉' : 'Nenhum flashcard disponível.');
      return;
    }
    setStudyCards(base);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSlideDirection(1);
    setModoRevisao(reviewOnly);
    setModoEstudo(true);
  }, [flashcardsFiltrados]);

  const fecharModoEstudo = useCallback(() => {
    setModoEstudo(false);
    setModoRevisao(false);
    setStudyCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const proximoCard = useCallback(() => {
    setSlideDirection(1);
    setIsFlipped(false);
    setCurrentIndex(p => Math.min(p + 1, studyCardsRef.current.length - 1));
  }, []);

  const cardAnterior = useCallback(() => {
    setSlideDirection(-1);
    setIsFlipped(false);
    setCurrentIndex(p => Math.max(p - 1, 0));
  }, []);

  const flipCard = useCallback(() => setIsFlipped(p => !p), []);

  /* SM-2 rating */
  const handleSM2Rating = useCallback(async (quality) => {
    const card = studyCardsRef.current[currentIndexRef.current];
    if (!card) return;

    const result = calculateSM2(
      quality,
      card.repetitions ?? 0,
      card.interval    ?? 0,
      card.easeFactor  ?? 2.5
    );

    try {
      await atualizarFlashcard(card.id, {
        interval:       result.interval,
        repetitions:    result.repetitions,
        easeFactor:     result.easeFactor,
        nextReviewDate: result.nextReviewDate,
      });
      setFlashcards(prev => prev.map(fc => fc.id === card.id ? { ...fc, ...result } : fc));
    } catch {
      toast.error('Erro ao salvar progresso de revisão.');
    }

    const idx  = currentIndexRef.current;
    const last = studyCardsRef.current.length - 1;

    if (idx < last) {
      proximoCard();
    } else {
      toast.success('Sessão de estudos concluída! 🎉');
      fecharModoEstudo();
      carregarDados();
    }
  }, [proximoCard, fecharModoEstudo, carregarDados]);

  /* ── Keyboard handler — usa refs, zero stale closure ── */
  useEffect(() => {
    const onKey = (e) => {
      if (!modoEstudoRef.current || isTypingInInput()) return;

      switch (e.key) {
        case 'ArrowRight': proximoCard();  break;
        case 'ArrowLeft':  cardAnterior(); break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          flipCard();
          break;
        case 'Escape':
          fecharModoEstudo();
          break;
        default:
          if (isFlippedRef.current) {
            if (e.key === '1') handleSM2Rating(1);
            if (e.key === '2') handleSM2Rating(3);
            if (e.key === '3') handleSM2Rating(5);
          }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [proximoCard, cardAnterior, flipCard, fecharModoEstudo, handleSM2Rating]);

  /* ════════════════════════════════════════
     DERIVED
  ════════════════════════════════════════ */
  const currentCard    = studyCards[currentIndex] ?? null;
  const progressPercent = studyCards.length > 0 ? ((currentIndex + 1) / studyCards.length) * 100 : 0;

  /* ════════════════════════════════════════
     LOADING / ERROR
  ════════════════════════════════════════ */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[32px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 max-w-sm w-full text-center shadow-sm">
          <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
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
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[18px] flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                <CreditCard size={28} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Flashcards</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Activity size={14} className="text-cyan-500" />
                  Repetição espaçada com algoritmo SM-2
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {pendingReviewCount > 0 && (
                <Button
                  onClick={() => iniciarModoEstudo(true)}
                  className="bg-amber-500 hover:bg-amber-600 !rounded-xl px-5 h-11 font-semibold text-sm shadow-lg shadow-amber-500/20"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Revisar ({pendingReviewCount})
                </Button>
              )}
              <Button
                onClick={() => iniciarModoEstudo(false)}
                disabled={flashcardsFiltrados.length === 0}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 !rounded-xl px-5 h-11 font-semibold text-sm shadow-md disabled:opacity-50"
              >
                <Play size={16} className="mr-2" /> Iniciar Estudo
              </Button>
              <Button
                onClick={() => { setFormData(FORM_INITIAL); setFormErrors({}); setEditingId(null); setShowModal(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 !rounded-xl px-5 h-11 font-semibold text-sm shadow-md shadow-indigo-600/20"
              >
                <Plus size={18} className="mr-1.5" strokeWidth={2.5} /> Novo Flashcard
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col lg:flex-row gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-3 shadow-sm">
            <div className="flex items-center gap-2 px-2 text-slate-400 shrink-0">
              <Filter size={15} strokeWidth={2.5} />
              <span className="text-xs font-semibold text-slate-400">Filtrar:</span>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedMateria}
                onChange={e => { setSelectedMateria(e.target.value); setSelectedTag('all'); }}
                className="!rounded-[12px] bg-slate-50 dark:bg-slate-950 border-0 h-10 text-sm flex-1"
              >
                <option value="all">Todas as Matérias</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>

              {allTags.length > 0 && (
                <Select
                  value={selectedTag}
                  onChange={e => setSelectedTag(e.target.value)}
                  className="!rounded-[12px] bg-slate-50 dark:bg-slate-950 border-0 h-10 text-sm flex-1"
                >
                  <option value="all">Todas as Tags</option>
                  {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
                </Select>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-[12px] border border-indigo-100 dark:border-indigo-800/50 shrink-0">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {flashcardsFiltrados.length} cards
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Grid ── */}
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {flashcardsFiltrados.map(fc => (
              <motion.div key={fc.id} layout variants={cardVariants} exit="exit">
                <FlashcardItem
                  flashcard={fc}
                  onEdit={handleEdit}
                  onDelete={(fc) => setConfirmDelete({ isOpen: true, id: fc.id, nome: fc.pergunta.slice(0, 50) + '...' })}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ── Empty states ── */}
        {flashcardsFiltrados.length === 0 && (
          <div className="py-20 text-center">
            <BookOpen size={44} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" strokeWidth={1.5} />
            {flashcards.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum flashcard ainda
                </h3>
                <p className="text-sm text-slate-400 mt-1 mb-6">
                  Crie seu primeiro flashcard para começar a estudar.
                </p>
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-indigo-600 h-11 px-6 font-semibold !rounded-xl mx-auto"
                >
                  <Plus size={16} className="mr-2" /> Criar primeiro flashcard
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum resultado
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Tente ajustar os filtros de matéria ou tag.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Modal de criação/edição ── */}
        <Modal
          isOpen={showModal}
          onClose={resetForm}
          title={editingId ? 'Editar Flashcard' : 'Novo Flashcard'}
          size="lg"
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Coluna esquerda */}
              <div className="space-y-5">
                {/* Matéria */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Matéria <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.materiaId}
                    onChange={handleMateriaChange}
                    className={`w-full h-12 px-4 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all ${
                      formErrors.materiaId
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  >
                    <option value="">Selecione a matéria...</option>
                    {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                  {formErrors.materiaId && <p className="text-xs text-rose-500">{formErrors.materiaId}</p>}
                </div>

                {/* Pergunta */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pergunta <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.pergunta}
                    onChange={e => {
                      patchForm({ pergunta: e.target.value });
                      if (formErrors.pergunta) setFormErrors(p => ({ ...p, pergunta: undefined }));
                    }}
                    placeholder="O que você quer perguntar?"
                    rows={5}
                    maxLength={MAX_PERGUNTA}
                    className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none resize-none transition-all placeholder:text-slate-400 ${
                      formErrors.pergunta
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                  <div className="flex justify-between">
                    {formErrors.pergunta
                      ? <p className="text-xs text-rose-500">{formErrors.pergunta}</p>
                      : <span />
                    }
                    <p className="text-xs text-slate-400 tabular-nums">{formData.pergunta.length}/{MAX_PERGUNTA}</p>
                  </div>
                </div>
              </div>

              {/* Coluna direita */}
              <div className="space-y-5">
                {/* Resposta */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Resposta <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.resposta}
                    onChange={e => {
                      patchForm({ resposta: e.target.value });
                      if (formErrors.resposta) setFormErrors(p => ({ ...p, resposta: undefined }));
                    }}
                    placeholder="Qual é a resposta?"
                    rows={9}
                    maxLength={MAX_RESPOSTA}
                    className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none resize-none transition-all placeholder:text-slate-400 ${
                      formErrors.resposta
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                  <div className="flex justify-between">
                    {formErrors.resposta
                      ? <p className="text-xs text-rose-500">{formErrors.resposta}</p>
                      : <span />
                    }
                    <p className="text-xs text-slate-400 tabular-nums">{formData.resposta.length}/{MAX_RESPOSTA}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload + Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Imagem */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Imagem (opcional)
                </label>
                <label className="relative group rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-6 flex flex-col items-center text-center min-h-[120px] justify-center">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} className="h-24 w-full object-cover rounded-xl mb-2" alt="Preview" />
                        <span className="text-xs text-slate-400">Clique para trocar</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
                        <span className="text-xs font-medium text-slate-400">
                          {compressingImage ? 'Processando...' : 'Clique para adicionar imagem'}
                        </span>
                      </>
                    )}
                  </div>
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
                  >
                    Remover imagem
                  </button>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tags (opcional)
                </label>
                <TagInput
                  tags={formData.tags}
                  onChange={ts => patchForm({ tags: ts })}
                  suggestions={[...new Set(flashcards.flatMap(fc => fc.tags ?? []))]}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                loading={saving}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 !rounded-xl font-semibold shadow-md disabled:opacity-60"
              >
                {editingId ? 'Salvar Alterações' : 'Criar Flashcard'}
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                className="px-8 h-12 !rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── MODO ESTUDO ── */}
        <AnimatePresence>
          {modoEstudo && currentCard && (
            <motion.div
              className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden"
              style={{ zIndex: Z.onboarding }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-indigo-600/10 rounded-full blur-[120px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-cyan-400/5 rounded-full blur-[100px] -ml-40 -mb-40" />
              </div>

              {/* Top bar */}
              <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md">
                    <Cpu size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-slate-900 dark:text-white font-bold text-base leading-tight">
                      {modoRevisao ? 'Revisão Espaçada' : 'Modo Estudo'}
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Card {currentIndex + 1} de {studyCards.length}
                      {currentCard.materiaNome && <span className="ml-2 text-slate-600">· {currentCard.materiaNome}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Atalhos de teclado — hint desktop */}
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">Space</kbd>
                    <span>virar</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">←→</kbd>
                    <span>navegar</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">Esc</kbd>
                    <span>sair</span>
                  </div>
                  <button
                    onClick={fecharModoEstudo}
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white flex items-center justify-center border border-slate-200 dark:border-white/10 transition-all active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 relative z-10">
                <motion.div
                  className="h-full bg-cyan-500"
                  style={{ boxShadow: '0 0 10px rgba(6,182,212,0.6)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Card área */}
              <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={currentIndex}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="w-full max-w-3xl"
                    style={{ perspective: 1500 }}
                  >
                    <div
                      onClick={flipCard}
                      className="relative w-full cursor-pointer select-none"
                      style={{
                        height: 'clamp(320px, 50vh, 520px)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        style={{ transformStyle: 'preserve-3d' }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.45, ease: 'circOut' }}
                      >
                        {/* FRENTE */}
                        <div
                          className="absolute inset-0 rounded-[32px] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/5 p-8 sm:p-12 flex flex-col justify-between shadow-2xl overflow-auto"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-6 flex-wrap">
                              <Badge color={currentCard.materiaCor} className="!rounded-lg text-xs font-semibold">
                                {currentCard.materiaNome}
                              </Badge>
                              {currentCard.tags?.slice(0, 3).map(t => (
                                <span key={t} className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  #{t}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                              <Zap size={12} className="text-cyan-500 shrink-0" />
                              <span className="text-cyan-500 text-xs font-semibold uppercase tracking-wider">Pergunta</span>
                            </div>
                            <h3 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                              {currentCard.pergunta}
                            </h3>
                          </div>
                          <div className="text-center pt-4">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 text-xs font-medium border border-slate-100 dark:border-white/5 animate-pulse">
                              Toque para ver a resposta
                            </span>
                          </div>
                        </div>

                        {/* VERSO */}
                        <div
                          className="absolute inset-0 rounded-[32px] p-8 sm:p-12 flex flex-col justify-between shadow-2xl overflow-auto"
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
                          }}
                        >
                          <div className="flex-1 overflow-y-auto">
                            <div className="flex items-center gap-2 mb-6">
                              <CheckCircle2 size={14} className="text-white/60" />
                              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Resposta</span>
                            </div>
                            <p className="text-xl sm:text-3xl font-semibold text-white leading-relaxed">
                              {currentCard.resposta}
                            </p>
                            {currentCard.imagemUrl && (
                              <img
                                src={currentCard.imagemUrl}
                                className="w-full rounded-xl mt-6 border-2 border-white/10 shadow-xl"
                                alt="Imagem do flashcard"
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controles SM-2 / Navegação */}
              <div className="px-4 pb-8 sm:pb-10 relative z-10 shrink-0">
                <AnimatePresence mode="wait">
                  {isFlipped ? (
                    /* SM-2 rating */
                    <motion.div
                      key="rating"
                      className="max-w-2xl mx-auto"
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 30, opacity: 0 }}
                    >
                      <p className="text-center text-slate-500 text-xs font-medium uppercase tracking-widest mb-4">
                        Como foi? <span className="hidden sm:inline">(teclas 1, 2, 3)</span>
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { q: 1, label: 'Difícil',  emoji: '😓', color: 'from-rose-600   to-rose-500',   ring: 'hover:ring-rose-500/40'    },
                          { q: 3, label: 'Ok',        emoji: '🤔', color: 'from-amber-600  to-amber-500',  ring: 'hover:ring-amber-500/40'   },
                          { q: 5, label: 'Fácil',    emoji: '😊', color: 'from-emerald-600 to-emerald-500', ring: 'hover:ring-emerald-500/40' },
                        ].map(btn => (
                          <motion.button
                            key={btn.q}
                            onClick={() => handleSM2Rating(btn.q)}
                            className={`py-4 sm:py-5 rounded-2xl bg-gradient-to-br ${btn.color} flex flex-col items-center gap-1.5 ring-2 ring-transparent ${btn.ring} transition-all active:scale-95`}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <span className="text-xl">{btn.emoji}</span>
                            <span className="text-sm font-bold text-white">{btn.label}</span>
                            <span className="text-[10px] text-white/60">
                              {getNextReviewLabel(btn.q, currentCard?.repetitions ?? 0, currentCard?.interval ?? 0, currentCard?.easeFactor ?? 2.5)}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    /* Navegação */
                    <motion.div
                      key="nav"
                      className="flex justify-center gap-4 max-w-sm mx-auto"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                    >
                      <button
                        onClick={cardAnterior}
                        disabled={currentIndex === 0}
                        className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-sm disabled:opacity-30 hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <ChevronLeft size={18} /> Anterior
                      </button>
                      <button
                        onClick={flipCard}
                        className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xl transition-all active:scale-95"
                      >
                        Ver Resposta
                      </button>
                      <button
                        onClick={proximoCard}
                        disabled={currentIndex === studyCards.length - 1}
                        className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-sm disabled:opacity-30 hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        Próximo <ChevronRight size={18} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Confirm Delete ── */}
        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
          onConfirm={confirmarExclusao}
          title="Excluir Flashcard?"
          itemName={confirmDelete.nome}
          confirmText="Sim, excluir"
          isLoading={isDeleting}
          type="danger"
        />
      </div>

      <style>{`
        .custom-scrollbar-study::-webkit-scrollbar       { width: 4px; }
        .custom-scrollbar-study::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
      `}</style>
    </div>
  );
}