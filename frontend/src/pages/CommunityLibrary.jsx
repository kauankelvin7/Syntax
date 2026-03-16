import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, BookOpen, Layers, 
  Globe, X, Trash2, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext-firebase';
import { 
  getCommunityResources, 
  likeResource, 
  importResource,
  shareResource,
  deleteResource,
} from '../services/communityService';
import ResourceCard from '../components/community/ResourceCard';

const CommunityLibrary = () => {
  const { user } = useAuth();
  const [resources, setResources]               = useState([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [activeCategory, setActiveCategory]     = useState('todos');
  const [search, setSearch]                     = useState('');
  const [showContribute, setShowContribute]     = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isDeleting, setIsDeleting]             = useState(false);

  const categories = [
    { id: 'todos',     label: 'Todos',      icon: Globe    },
    { id: 'flashcard', label: 'Flashcards', icon: Layers   },
    { id: 'resumo',    label: 'Resumos',    icon: BookOpen },
  ];

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    try {
      setResources(await getCommunityResources());
    } catch {
      toast.error('Erro ao carregar a biblioteca comunitária.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadResources(); }, [loadResources]);

  const handleLike = useCallback(async (resource) => {
    if (!user) { toast.error('Faça login para curtir.'); return; }
    try {
      await likeResource(resource.type, resource.id);
      setResources(prev =>
        prev.map(r => r.id === resource.id ? { ...r, likes: (r.likes || 0) + 1 } : r)
      );
    } catch {
      toast.error('Erro ao curtir recurso.');
    }
  }, [user]);

  const handleImport = useCallback(async (resource) => {
    if (!user) { toast.error('Você precisa estar logado para importar.'); return; }
    
    // Toast de loading visual enquanto o Firebase trabalha
    const toastId = toast.loading('Importando recurso...');
    
    try {
      // Chama o serviço que agora sabe lidar com Arrays
      await importResource(resource.type, resource, user.uid);
      
      // Atualiza o número de downloads na tela
      setResources(prev =>
        prev.map(r => r.id === resource.id ? { ...r, downloads: (r.downloads || 0) + 1 } : r)
      );
      
      const dest = resource.type === 'flashcard' ? 'Flashcards' : 'Resumos';
      toast.success(`"${resource.title}" importado para seus ${dest}!`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar recurso.', { id: toastId });
    }
  }, [user]);

  const handleConfirmDelete = useCallback(async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(resourceToDelete.type, resourceToDelete.id);
      setResources(prev => prev.filter(r => r.id !== resourceToDelete.id));
      toast.success('Recurso removido da biblioteca.');
      setResourceToDelete(null);
    } catch {
      toast.error('Erro ao remover recurso.');
    } finally {
      setIsDeleting(false);
    }
  }, [resourceToDelete]);

  const filteredResources = useMemo(() => resources.filter(r => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.topic || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'todos' || r.type === activeCategory;
    return matchesSearch && matchesCategory;
  }), [resources, search, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto overflow-x-hidden">

      {/* Header */}
      <header className="flex flex-col gap-6 mb-8 sm:mb-12">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-xl shadow-cyan-600/20 shrink-0">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Community Library
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                {isLoading ? 'Carregando...' : `${resources.length} recursos`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative group flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar recursos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 sm:h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl pl-9 pr-4 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowContribute(true)}
            className="shrink-0 flex items-center gap-1.5 h-10 sm:h-12 px-4 sm:px-6 rounded-2xl bg-cyan-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-tighter shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 active:scale-95 transition-all"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
        </div>
      </header>

      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 sm:mb-12 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {categories.map(cat => {
          const count = cat.id === 'todos' ? resources.length : resources.filter(r => r.type === cat.id).length;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300'
              }`}
            >
              <cat.icon size={13} />
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[9px] font-black px-1 ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <main>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[320px] rounded-[28px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredResources.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  currentUserId={user?.uid}
                  onLike={() => handleLike(resource)}
                  onImport={() => handleImport(resource)}
                  onDelete={resource.authorId === user?.uid ? () => setResourceToDelete(resource) : null}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16">
            <Globe size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
              {search || activeCategory !== 'todos' ? 'Nenhum recurso encontrado' : 'Biblioteca vazia'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {search || activeCategory !== 'todos' ? 'Tente outro filtro.' : 'Seja o primeiro a contribuir!'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {(search || activeCategory !== 'todos') && (
                <button
                  onClick={() => { setSearch(''); setActiveCategory('todos'); }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                  Limpar filtros
                </button>
              )}
              <button
                onClick={() => setShowContribute(true)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-sm shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-all"
              >
                Compartilhar recurso
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Contribuir */}
      <AnimatePresence>
        {showContribute && (
          <ContributeModal
            user={user}
            onClose={() => setShowContribute(false)}
            onSuccess={() => {
              setShowContribute(false);
              loadResources();
              toast.success('Recurso compartilhado com a comunidade!');
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal Confirmar Delete */}
      <AnimatePresence>
        {resourceToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setResourceToDelete(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 bottom-8 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[400px] bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-white/10 z-[101] shadow-2xl p-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={28} className="text-rose-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter text-center mb-2">
                Remover Recurso?
              </h2>
              <p className="text-sm text-slate-500 text-center mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">"{resourceToDelete.title}"</span>
              </p>
              <p className="text-xs text-slate-400 text-center mb-8">
                Ele será removido permanentemente da biblioteca comunitária.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResourceToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-tighter text-sm transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isDeleting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Removendo...</>
                    : <><Trash2 size={14} />Remover</>
                  }
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════
   MODAL CONTRIBUIR
════════════════════════════════ */
const ContributeModal = ({ user, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('resumo');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados específicos de conteúdo
  const [content, setContent] = useState(''); // Para Resumos
  const [flashcards, setFlashcards] = useState([{ question: '', answer: '' }]); // Para Flashcards

  // Funções de manipulação dos Flashcards
  const handleAddFlashcard = () => {
    setFlashcards([...flashcards, { question: '', answer: '' }]);
  };

  const handleRemoveFlashcard = (index) => {
    if (flashcards.length > 1) {
      setFlashcards(flashcards.filter((_, i) => i !== index));
    }
  };

  const handleFlashcardChange = (index, field, value) => {
    const newCards = [...flashcards];
    newCards[index][field] = value;
    setFlashcards(newCards);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações base
    if (!title.trim() || !topic.trim()) {
      toast.error('Preencha o título e o tópico.');
      return;
    }

    // Validações por tipo
    if (type === 'resumo' && !content.trim()) {
      toast.error('O conteúdo do resumo é obrigatório.');
      return;
    }

    if (type === 'flashcard') {
      const isCardsValid = flashcards.every(f => f.question.trim() && f.answer.trim());
      if (!isCardsValid || flashcards.length === 0) {
        toast.error('Preencha todas as perguntas e respostas dos seus flashcards.');
        return;
      }
    }

    if (!user?.uid) { toast.error('Você precisa estar logado.'); return; }

    setIsSubmitting(true);
    try {
      // Define o payload final baseado no tipo selecionado
      const finalContent = type === 'flashcard' ? flashcards : content.trim();

      await shareResource(type, {
        title: title.trim(),
        topic: topic.trim(),
        description: description.trim(),
        content: finalContent,
        authorName: user.displayName || 'Anônimo',
        authorId: user.uid,
        authorAvatar: user.photoURL || '',
        tags: [topic.toLowerCase().trim()],
      });
      onSuccess();
    } catch {
      toast.error('Erro ao compartilhar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center">
              <Plus size={18} className="text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Compartilhar Recurso
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            {['resumo', 'flashcard'].map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                  type === t
                    ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500'
                }`}
              >
                {t === 'flashcard' ? <Layers size={13} /> : <BookOpen size={13} />}
                {t === 'flashcard' ? 'Flashcards' : 'Resumo'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Título <span className="text-rose-500">*</span>
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:border-cyan-500 outline-none transition-all"
              placeholder={type === 'flashcard' ? "Ex: Deck de Espanhol - Verbos" : "Ex: Guia Definitivo de SQL"} />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Tópico / Matéria <span className="text-rose-500">*</span>
            </label>
            <input value={topic} onChange={e => setTopic(e.target.value)} required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:border-cyan-500 outline-none transition-all"
              placeholder="Ex: Banco de Dados" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Descrição curta
            </label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:border-cyan-500 outline-none transition-all"
              placeholder="O que este recurso cobre?" />
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/5">
            {type === 'resumo' ? (
              // INTERFACE DE RESUMO
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Conteúdo do Resumo <span className="text-rose-500">*</span>
                </label>
                <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:border-cyan-500 outline-none resize-none transition-all"
                  placeholder="Escreva ou cole seu resumo aqui..." />
              </div>
            ) : (
              // INTERFACE DE FLASHCARDS
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Cartões ({flashcards.length}) <span className="text-rose-500">*</span>
                  </label>
                </div>
                
                <div className="space-y-4">
                  {flashcards.map((card, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-2xl relative group transition-all">
                      
                      {/* Botão de excluir cartão */}
                      {flashcards.length > 1 && (
                        <button type="button" onClick={() => handleRemoveFlashcard(index)}
                          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <div className="space-y-3 pt-1">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Frente (Pergunta)</p>
                          <input
                            value={card.question}
                            onChange={(e) => handleFlashcardChange(index, 'question', e.target.value)}
                            placeholder="Ex: O que é uma chave primária?"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:border-cyan-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verso (Resposta)</p>
                          <textarea
                            rows={2}
                            value={card.answer}
                            onChange={(e) => handleFlashcardChange(index, 'answer', e.target.value)}
                            placeholder="Ex: Identificador único de um registro em uma tabela."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 focus:border-cyan-500 outline-none resize-none transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddFlashcard}
                  className="w-full py-3 mt-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold hover:border-cyan-500 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar novo cartão
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full mt-6 py-4 rounded-2xl bg-cyan-600 text-white font-black uppercase tracking-tighter shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publicando...</>
              : 'Publicar na Biblioteca'
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
};

CommunityLibrary.displayName = 'CommunityLibraryPage';

export default CommunityLibrary;