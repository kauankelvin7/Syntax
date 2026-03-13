/**
 * 🛰️ FLASHCARDS PRO — Syntax Theme
 * * Componente central de gerenciamento e Modo Estudo com algoritmo SM-2.
 * - Design: Infrastructure Monitor Style (Slate-950 / Cyan / Indigo).
 * - Lógica: 100% Preservada (Repetição Espaçada, Categorias, Busca Global).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  CreditCard, 
  ImageIcon,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Sparkles,
  Terminal,
  Cpu,
  Zap,
  Activity,
  Code2,
  Database,
  Hash,
  CheckCircle2 // ← ADD
} from 'lucide-react';
import { 
  listarFlashcards, 
  criarFlashcard, 
  atualizarFlashcard, 
  deletarFlashcard,
  listarMateriasSimples
} from '../services/firebaseService';
import { compressImage } from '../utils/imageCompressor';
import TagInput from '../components/TagInput';
import { calculateSM2, isDueForReview, getNextReviewLabel } from '../utils/sm2';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';
import FlashcardItem from '../components/FlashcardItem';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';
import { isTypingInInput } from '../utils/keyboard';

/* ═══════════════════════════════════════════
   ANIMATION CONFIGURATIONS
   ═══════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.96 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.15 } 
  }
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.92
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }
  },
  exit: (direction) => ({
    x: direction < 0 ? 400 : -400,
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.3 }
  })
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

function Flashcards() {
  const { user } = useAuth();
  const location = useLocation();
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsFiltrados, setFlashcardsFiltrados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMateria, setSelectedMateria] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [formData, setFormData] = useState({
    pergunta: '',
    resposta: '',
    materiaId: '',
    materiaNome: '',
    materiaCor: '',
    tags: []
  });
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [error, setError] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, nome: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const [modoEstudo, setModoEstudo] = useState(false);
  const [modoRevisao, setModoRevisao] = useState(false); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStudyFlipped, setIsStudyFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);
  const [studyCards, setStudyCards] = useState([]); 
  const [reviewStats, setReviewStats] = useState({ easy: 0, medium: 0, hard: 0 });

  // Variáveis derivadas para o modo estudo
  const currentFlashcard = studyCards[currentIndex] ?? null;
  const progressPercent = studyCards.length > 0 
    ? ((currentIndex + 1) / studyCards.length) * 100 
    : 0;

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.filterMateria) {
      setSelectedMateria(location.state.filterMateria);
      window.history.replaceState({}, document.title);
    }
    if (location.state?.reviewMode) {
      setModoRevisao(true);
    }
  }, [location.state]);

  useEffect(() => {
    let filtered = flashcards;
    if (selectedMateria !== 'all') {
      filtered = filtered.filter(fc => fc.materiaId === selectedMateria);
    }
    if (selectedTag !== 'all') {
      filtered = filtered.filter(fc => fc.tags && fc.tags.includes(selectedTag));
    }
    setFlashcardsFiltrados(filtered);
  }, [selectedMateria, selectedTag, flashcards]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?.uid;
      const [flashcardsData, materiasData] = await Promise.all([
        listarFlashcards(userId),
        listarMateriasSimples(userId)
      ]);
      
      const flashcardsEnriquecidos = flashcardsData.map(fc => {
        if (fc.materiaNome && fc.materiaCor) return fc;
        const materia = materiasData.find(m => m.id === fc.materiaId);
        return {
          ...fc,
          materiaNome: fc.materiaNome || materia?.nome || 'Default_Node',
          materiaCor: fc.materiaCor || materia?.cor || '#6366F1'
        };
      });
      
      setFlashcards(flashcardsEnriquecidos);
      setFlashcardsFiltrados(flashcardsEnriquecidos);
      setMaterias(materiasData);
      setError(null);
    } catch (err) {
      setError('Telemetria_Error: Falha na ingestão de dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.reviewMode && flashcards.length > 0 && !modoEstudo) {
      iniciarModoEstudo(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, flashcards.length, modoEstudo]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Image_Size_Overflow: Máximo 10MB.');
      return;
    }
    try {
      setCompressingImage(true);
      const base64Data = await compressImage(file);
      setSelectedImageFile(base64Data);
      setImagePreview(base64Data);
      setError(null);
    } catch (err) {
      setError('Compression_Fault.');
    } finally {
      setCompressingImage(false);
    }
  };

  const handleMateriaChange = (e) => {
    const materiaId = e.target.value;
    const materia = materias.find(m => m.id === materiaId);
    setFormData(prev => ({
      ...prev,
      materiaId: materiaId,
      materiaNome: materia?.nome || '',
      materiaCor: materia?.cor || '#6366F1'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pergunta.trim() || !formData.resposta.trim()) return;
    try {
      const userId = user?.id || user?.uid;
      const dadosFlashcard = {
        pergunta: formData.pergunta,
        resposta: formData.resposta,
        materiaId: formData.materiaId,
        materiaNome: formData.materiaNome,
        materiaCor: formData.materiaCor,
        tags: formData.tags || []
      };

      if (editingId) {
        await atualizarFlashcard(editingId, dadosFlashcard, selectedImageFile);
      } else {
        await criarFlashcard(dadosFlashcard, selectedImageFile, userId);
      }
      
      await carregarDados();
      resetForm();
      toast.success('Flashcard salvo com sucesso.');
    } catch (err) {
      toast.error('Erro ao salvar flashcard. Tente novamente.');
    }
  };

  const handleEdit = (flashcard) => {
    setFormData({
      pergunta: flashcard.pergunta,
      resposta: flashcard.resposta,
      materiaId: flashcard.materiaId || '',
      materiaNome: flashcard.materiaNome || '',
      materiaCor: flashcard.materiaCor || '#6366F1',
      tags: flashcard.tags || []
    });
    setEditingId(flashcard.id);
    setImagePreview(flashcard.imagemUrl || null);
    setSelectedImageFile(flashcard.imagemUrl || null);
    setShowModal(true);
  };

  const handleDelete = (flashcard) => {
    setConfirmDelete({
      isOpen: true,
      id: flashcard.id,
      nome: flashcard.pergunta.substring(0, 50) + '...'
    });
  };

  const confirmarExclusao = async () => {
    if (!confirmDelete.id) return;
    setIsDeleting(true);
    try {
      await deletarFlashcard(confirmDelete.id);
      await carregarDados();
      toast.success('Node_Removed: Logic_Unit deletada.');
    } catch {
      toast.error('Erro na remoção do dado.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ isOpen: false, id: null, nome: '' });
    }
  };

  const resetForm = useCallback(() => {
    setFormData({ pergunta: '', resposta: '', materiaId: '', materiaNome: '', materiaCor: '', tags: [] });
    setEditingId(null);
    setImagePreview(null);
    setSelectedImageFile(null);
    setShowModal(false);
  }, []);

  /* ═══════════════════════════════════════════
     SM-2 STUDY LOGIC
     ═══════════════════════════════════════════ */
  
  const iniciarModoEstudo = (reviewOnly = false) => {
    let cards = flashcardsFiltrados;
    if (reviewOnly) {
      cards = flashcardsFiltrados.filter(fc => isDueForReview(fc));
      if (cards.length === 0) {
        toast.info('System_Optimal: Nenhuma revisão pendente. 🎉');
        return;
      }
    }
    if (cards.length === 0) return;
    setStudyCards(cards);
    setCurrentIndex(0);
    setIsStudyFlipped(false);
    setSlideDirection(0);
    setModoRevisao(reviewOnly);
    setModoEstudo(true);
  };

  const fecharModoEstudo = () => {
    setModoEstudo(false);
    setModoRevisao(false);
    setStudyCards([]);
  };

  const handleSM2Rating = async (quality) => {
    const card = studyCards[currentIndex];
    if (!card) return;

    const result = calculateSM2(quality, card.repetitions || 0, card.interval || 0, card.easeFactor || 2.5);

    try {
      await atualizarFlashcard(card.id, {
        interval: result.interval,
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        nextReviewDate: result.nextReviewDate,
      });

      setFlashcards(prev => prev.map(fc => fc.id === card.id ? { ...fc, ...result } : fc));
    } catch {
      toast.error('Erro ao salvar telemetria SM-2.');
    }

    if (currentIndex < studyCards.length - 1) {
      setSlideDirection(1);
      setIsStudyFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      toast.success('Sessão_Finalizada: Sync concluído.');
      fecharModoEstudo();
      carregarDados();
    }
  };

  const pendingReviewCount = useMemo(() => flashcards.filter(fc => isDueForReview(fc)).length, [flashcards]);

  const proximoCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setSlideDirection(1);
      setIsStudyFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const cardAnterior = () => {
    if (currentIndex > 0) {
      setSlideDirection(-1);
      setIsStudyFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const flipStudyCard = useCallback(() => setIsStudyFlipped(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modoEstudo || isTypingInInput()) return;
      if (e.key === 'ArrowRight') proximoCard();
      if (e.key === 'ArrowLeft') cardAnterior();
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipStudyCard(); }
      if (isStudyFlipped) {
        if (e.key === '1') handleSM2Rating(1);
        if (e.key === '2') handleSM2Rating(3);
        if (e.key === '3') handleSM2Rating(5);
      }
      if (e.key === 'Escape') fecharModoEstudo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modoEstudo, currentIndex, isStudyFlipped, studyCards.length]);

  /* ═══════════════════════════════════════════
     SKELETON LOADING TECH STYLE
     ═══════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="min-h-screen pb-32 pt-10 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-12 animate-pulse">
            <div className="w-16 h-16 rounded-[22px] bg-slate-900 border border-white/5" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-64 bg-slate-900 rounded-xl" />
              <div className="h-4 w-96 bg-slate-900/50 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 rounded-[32px] bg-slate-900/50 border border-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        
        {/* ─── Header Tático ─── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-[22px] flex items-center justify-center shadow-2xl shrink-0 border-2 border-white/10">
                <CreditCard size={32} className="text-white dark:text-slate-900" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-1">Flashcards</h1>
                <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-cyan-500" /> Sincronização de conhecimento ativa
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {pendingReviewCount > 0 && (
                <Button onClick={() => iniciarModoEstudo(true)} className="bg-amber-500 hover:bg-amber-600 !rounded-xl px-6 h-14 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-amber-500/20">
                  <RotateCcw size={16} className="mr-2" /> Revisão Pendente ({pendingReviewCount})
                </Button>
              )}
              <Button onClick={() => iniciarModoEstudo(false)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 !rounded-xl px-6 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl">
                <Play size={16} className="mr-2" /> Iniciar Estudo
              </Button>
              <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 !rounded-xl px-6 h-14 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/20">
                <Plus size={20} className="mr-2" strokeWidth={3} /> Adicionar Flashcard
              </Button>
            </div>
          </div>

          {/* Barra de Filtros Indexada */}
          <motion.div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[24px] p-4 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 px-2 text-slate-400">
              <Filter size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtros:</span>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={selectedMateria} onChange={(e) => { setSelectedMateria(e.target.value); setSelectedTag('all'); }} className="!rounded-[14px] bg-slate-50 dark:bg-slate-950 border-0 h-12 text-sm font-bold">
                <option value="all">Todas as Matérias</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </Select>
              {(() => {
                const baseCards = selectedMateria === 'all' ? flashcards : flashcards.filter(fc => fc.materiaId === selectedMateria);
                const allTags = [...new Set(baseCards.flatMap(fc => fc.tags || []))].sort();
                return allTags.length > 0 && (
                  <Select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="!rounded-[14px] bg-slate-50 dark:bg-slate-950 border-0 h-12 text-sm font-bold">
                    <option value="all">Todas as Tags</option>
                    {allTags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
                  </Select>
                );
              })()}
            </div>
            <div className="flex items-center gap-2 px-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-[14px] border border-indigo-100 dark:border-indigo-800/50">
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 font-mono">{flashcardsFiltrados.length} CARDS</span>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Grid de Units ─── */}
        <AnimatePresence mode="popLayout">
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" variants={containerVariants} initial="hidden" animate="visible">
            {flashcardsFiltrados.map((fc) => (
              <motion.div key={fc.id} layout variants={cardVariants} exit="exit">
                <FlashcardItem flashcard={fc} onEdit={handleEdit} onDelete={handleDelete} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {flashcardsFiltrados.length === 0 && (
          <div className="py-24 text-center opacity-40">
            <Terminal size={48} className="mx-auto mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-black uppercase tracking-tight">Nenhum flashcard encontrado</h3>
            <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest mt-2">Crie seu primeiro flashcard para começar.</p>
          </div>
        )}

        {/* ─── Modal de Escrita (Editor Syntax) ─── */}
        <Modal isOpen={showModal} onClose={resetForm} title={editingId ? 'Edit_Logic_Unit' : 'New_Logic_Unit'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Select label="System_Stack" value={formData.materiaId} onChange={handleMateriaChange} required className="!rounded-2xl h-14" >
                  <option value="">Select Stack...</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </Select>
                <Textarea label="Front_Side (Probe)" placeholder="Input question/prompt..." value={formData.pergunta} onChange={(e) => setFormData(p => ({ ...p, pergunta: e.target.value }))} required rows={4} className="!rounded-2xl" />
              </div>
              <div className="space-y-6">
                <Textarea label="Back_Side (Buffer)" placeholder="Input answer/result..." value={formData.resposta} onChange={(e) => setFormData(p => ({ ...p, resposta: e.target.value }))} required rows={8} className="!rounded-2xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
               <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Resource_Asset</label>
                  <div className="relative group rounded-3xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all">
                     <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                     <div className="p-8 flex flex-col items-center text-center">
                        {imagePreview ? (
                          <img src={imagePreview} className="h-32 w-full object-cover rounded-xl" alt="" />
                        ) : (
                          <>
                            <ImageIcon size={32} className="text-slate-300 mb-2" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase">{compressingImage ? 'Compiling...' : 'Upload_Visual_Data'}</span>
                          </>
                        )}
                     </div>
                  </div>
               </div>
               <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Data_Index_Tags</label>
                  <TagInput tags={formData.tags} onChange={ts => setFormData(p => ({ ...p, tags: ts }))} suggestions={[...new Set(flashcards.flatMap(fc => fc.tags || []))]} />
               </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1 bg-indigo-600 h-16 !rounded-[18px] font-black uppercase tracking-widest text-[12px] shadow-xl">Commit_Changes</Button>
              <Button type="button" onClick={resetForm} variant="secondary" className="px-10 h-16 !rounded-[18px] font-black uppercase tracking-widest text-[11px]">Abort</Button>
            </div>
          </form>
        </Modal>

        {/* ─── MODO ESTUDO IMERSIVO (The Syntax Chamber) ─── */}
        <AnimatePresence>
          {modoEstudo && currentFlashcard && (
            <motion.div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden" 
              style={{ zIndex: Z.onboarding }}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}>
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-indigo-600/10 rounded-full blur-[150px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-cyan-400/5 rounded-full blur-[150px] -ml-40 -mb-40" />
              </div>

              <div className="relative z-10 flex items-center justify-between px-8 py-6 bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg"><Cpu size={24} className="text-white" /></div>
                  <div>
                    <h2 className="text-white font-black text-lg uppercase tracking-tighter">{modoRevisao ? 'Scheduled_Sync' : 'Deep_Simulation'}</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Executing: Unit {currentIndex + 1} / {studyCards.length}</p>
                  </div>
                </div>
                <button onClick={fecharModoEstudo} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10 transition-all active:scale-90"><X size={24} /></button>
              </div>

              <div className="w-full h-1.5 bg-slate-900 relative z-10"><motion.div className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} /></div>

              <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div key={currentIndex} custom={slideDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" className="w-full max-w-4xl h-[550px] perspective-1000" onClick={flipStudyCard}>
                    <motion.div className="relative w-full h-full transform-style-3d" animate={{ rotateY: isStudyFlipped ? 180 : 0 }} transition={{ duration: 0.5, ease: "circOut" }}>
                      
                      {/* FRONT (The Probe) */}
                      <div className="absolute inset-0 backface-hidden rounded-[42px] bg-slate-900 border-2 border-white/5 p-12 flex flex-col justify-between shadow-2xl">
                        <div>
                          <div className="flex items-center gap-3 mb-10">
                            <Badge color={currentFlashcard.materiaCor} className="!rounded-lg uppercase font-black text-[10px] tracking-widest">{currentFlashcard.materiaNome}</Badge>
                            {currentFlashcard.tags?.slice(0,2).map(t => <span key={t} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">#{t}</span>)}
                          </div>
                          <div className="space-y-6">
                            <span className="flex items-center gap-2 text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4"><Zap size={14} /> System_Query</span>
                            <h3 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter">{currentFlashcard.pergunta}</h3>
                          </div>
                        </div>
                        <div className="text-center"><span className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest border border-white/5 animate-pulse">Tap to Reveal Buffer</span></div>
                      </div>

                      {/* BACK (The Result) */}
                      <div className="absolute inset-0 backface-hidden rounded-[42px] bg-indigo-600 p-12 flex flex-col justify-between shadow-2xl rotate-y-180 border-4 border-white/20 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-cyan-600 opacity-90" />
                        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar-study pr-4">
                           <span className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-[0.3em] mb-6"><CheckCircle2 size={14} /> Output_Success</span>
                           <p className="text-2xl md:text-4xl font-bold text-white leading-relaxed tracking-tight mb-8">{currentFlashcard.resposta}</p>
                           {currentFlashcard.imagemUrl && <img src={currentFlashcard.imagemUrl} className="w-full rounded-2xl border-4 border-white/10 shadow-2xl" alt="" />}
                        </div>
                        <div className="relative z-10 text-center pt-8 border-t border-white/10"><span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Logic_Verified</span></div>
                      </div>

                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* SM-2 RATING CONTROLS (Tático) */}
              <div className="px-6 pb-12 relative z-10">
                <AnimatePresence>
                  {isStudyFlipped && (
                    <motion.div className="max-w-3xl mx-auto space-y-6" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
                      <p className="text-center text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Quality_Assessment (Keys: 1, 2, 3)</p>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { q: 1, l: 'Hard', c: 'bg-rose-500', icon: '❌' },
                          { q: 3, l: 'Medium', c: 'bg-amber-500', icon: '⚠️' },
                          { q: 5, l: 'Optimal', c: 'bg-emerald-500', icon: '✅' }
                        ].map((btn) => (
                          <motion.button key={btn.q} onClick={() => handleSM2Rating(btn.q)} className={`group relative py-6 rounded-[24px] flex flex-col items-center gap-3 border-2 border-transparent transition-all ${btn.c}/10 hover:border-white/20`} whileHover={{ y: -5 }}>
                            <span className="text-2xl mb-1">{btn.icon}</span>
                            <span className="text-[11px] font-black uppercase text-white tracking-widest">{btn.l}</span>
                            <span className="text-[9px] font-bold text-white/40">{getNextReviewLabel(btn.q, currentFlashcard?.repetitions || 0, currentFlashcard?.interval || 0, currentFlashcard?.easeFactor || 2.5)}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isStudyFlipped && (
                  <div className="flex justify-center gap-4 max-w-xl mx-auto">
                    <button onClick={cardAnterior} disabled={currentIndex === 0} className="flex-1 h-16 rounded-[22px] bg-white/5 border border-white/5 text-white font-black uppercase tracking-widest text-[11px] disabled:opacity-20">Prev_Unit</button>
                    <button onClick={proximoCard} disabled={currentIndex === studyCards.length - 1} className="flex-1 h-16 rounded-[22px] bg-indigo-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl disabled:opacity-20">Next_Unit</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          .perspective-1000 { perspective: 1500px; }
          .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
          .transform-style-3d { transform-style: preserve-3d; }
          .rotate-y-180 { transform: rotateY(180deg); }
          .custom-scrollbar-study::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar-study::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin-slow { animation: spin-slow 15s linear infinite; }
        `}</style>

        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, id: null, nome: '' })}
          onConfirm={confirmarExclusao}
          title="Unit_Termination_Request"
          itemName={confirmDelete.nome}
          confirmText="Execute_Delete"
          isLoading={isDeleting}
          type="danger"
        />
      </div>
    </div>
  );
}

export default Flashcards;