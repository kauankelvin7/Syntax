import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, BookOpen, Layers, 
  Download, Heart, User, Filter, 
  ChevronRight, Zap, Trophy, Globe,
  MessageSquare, Star, Clock, Info,
  ExternalLink, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext-firebase';
import { 
  getCommunityResources, 
  likeResource, 
  trackDownload,
  shareResource
} from '../services/communityService';
import ResourceCard from '../components/community/ResourceCard';
import { Z } from '../constants/zIndex';

const CommunityLibrary = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [search, setSearch] = useState('');
  const [showContribute, setShowContribute] = useState(false);
  
  const categories = [
    { id: 'todos', label: 'Todos', icon: Globe },
    { id: 'flashcard', label: 'Flashcards', icon: Layers },
    { id: 'resumo', label: 'Resumos', icon: BookOpen },
  ];

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCommunityResources();
      setResources(data);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      toast.error('Erro ao carregar a biblioteca comunitária.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleLike = async (resource) => {
    try {
      await likeResource(resource.type, resource.id);
      setResources(prev => prev.map(r => r.id === resource.id ? { ...r, likes: (r.likes || 0) + 1 } : r));
    } catch (error) {
      toast.error('Erro ao curtir recurso.');
    }
  };

  const handleImport = async (resource) => {
    if (!user) {
      toast.error('Você precisa estar logado para importar.');
      return;
    }

    try {
      await trackDownload(resource.type, resource.id);
      setResources(prev => prev.map(r => r.id === resource.id ? { ...r, downloads: (r.downloads || 0) + 1 } : r));
      toast.success(`"${resource.title}" importado com sucesso para seu perfil!`);
    } catch (error) {
      toast.error('Erro ao importar recurso.');
    }
  };

  const filteredResources = resources.filter(r => {
    const title = r.title || '';
    const topic = r.topic || '';
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                          topic.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'todos' || r.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto overflow-x-hidden">
      {/* Header Responsivo */}
      <header className="flex flex-col gap-6 mb-8 sm:mb-12">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-cyan-600 flex items-center justify-center shadow-xl shadow-cyan-600/20 shrink-0">
            <BookOpen size={22} className="text-white sm:hidden" />
            <BookOpen size={28} className="text-white hidden sm:block" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Community Library
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                {resources.length > 0 ? `${resources.length} recursos` : 'Carregando...'}
              </p>
            </div>
          </div>
        </div>

        {/* Search + Botão na mesma linha em mobile */}
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

      {/* Categorias - Scroll Horizontal Correto */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 sm:mb-12 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id;
          const count = cat.id === 'todos' 
            ? resources.length 
            : resources.filter(r => r.type === cat.id).length;
          
          return (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                isActive 
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500'
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

      {/* Grid Responsivo */}
      <main>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-[280px] rounded-[32px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredResources.map((resource) => (
                <ResourceCard 
                  key={resource.id} 
                  resource={resource} 
                  onLike={() => handleLike(resource)}
                  onImport={() => handleImport(resource)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty State com CTA */
          <div className="text-center py-16">
            <Globe size={40} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
              {search || activeCategory !== 'todos' ? 'Nenhum recurso encontrado' : 'Biblioteca vazia'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {search || activeCategory !== 'todos' ? 'Tente outro filtro.' : 'Seja o primeiro a contribuir com a comunidade!'}
            </p>
            <div className="flex items-center justify-center gap-3">
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
                Compartilhar primeiro recurso
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal Contribute */}
      <AnimatePresence>
        {showContribute && (
          <ContributeModal 
            onClose={() => setShowContribute(false)}
            onSuccess={() => {
              setShowContribute(false);
              loadResources();
              toast.success('Recurso compartilhado!');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Modal simples caso ContributeModal.jsx não exista ou seja complexo
const ContributeModal = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('resumo');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !topic || !content) return toast.error('Preencha todos os campos');
    
    setIsSubmitting(true);
    try {
      await shareResource(type, {
        title,
        topic,
        content,
        authorName: 'Comunidade', // Idealmente viria do user context
        authorId: 'system',
        tags: [topic.toLowerCase()]
      });
      onSuccess();
    } catch (error) {
      toast.error('Erro ao compartilhar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Compartilhar Recurso</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Título do Recurso</label>
            <input 
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none"
              placeholder="Ex: Guia Definitivo de SQL"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tópico/Matéria</label>
            <input 
              value={topic} onChange={e => setTopic(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none"
              placeholder="Ex: Banco de Dados"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button" onClick={() => setType('resumo')}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${type === 'resumo' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500'}`}
            >
              Resumo
            </button>
            <button 
              type="button" onClick={() => setType('flashcard')}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${type === 'flashcard' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500'}`}
            >
              Flashcards
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Conteúdo (Markdown)</label>
            <textarea 
              rows={4} value={content} onChange={e => setContent(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none resize-none"
              placeholder="Escreva seu conteúdo aqui..."
            />
          </div>
          <button 
            type="submit" disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-cyan-600 text-white font-black uppercase tracking-tighter shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Compartilhando...' : 'Publicar na Biblioteca'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

CommunityLibrary.displayName = 'CommunityLibraryPage';

export default CommunityLibrary;
