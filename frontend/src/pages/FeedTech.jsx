/**
 * FeedTech.jsx
 * Feed paginado (12 artigos por página) com filtros por categoria,
 * tema claro/escuro e skeleton loading correto.
 */

import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Github, BookOpen, Clock, Zap, TrendingUp,
  RefreshCw, WifiOff, ChevronLeft, ChevronRight,
  Loader,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  getPersonalizedFeed,
  getGitHubTrending,
  limparCacheFeed,
} from '../services/feedService';
import { TECH_BOOKS } from '../data/techBooks';

import FeedFilters from '../components/feed/FeedFilters';
import NewsCard    from '../components/feed/NewsCard';
import BookCard    from '../components/feed/BookCard';

const ARTICLES_PER_PAGE = 12;

/* ─────────────────────────────
   SKELETON com forwardRef
───────────────────────────── */
const SkeletonCard = forwardRef((_, ref) => (
  <div
    ref={ref}
    className="bg-white dark:bg-slate-900
               border border-slate-200 dark:border-white/5
               rounded-[28px] p-5 sm:p-6 shadow-sm animate-pulse space-y-4"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
    </div>
    <div className="flex gap-2 pt-1">
      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
));
SkeletonCard.displayName = 'SkeletonCard';

/* ─────────────────────────────
   LOADING STATE
───────────────────────────── */
const FeedLoading = () => (
  <div className="space-y-5">
    <div className="flex items-center gap-3 px-4 py-3
                    bg-indigo-50 dark:bg-indigo-900/20
                    border border-indigo-200 dark:border-indigo-500/20
                    rounded-2xl text-xs text-indigo-600 dark:text-indigo-400 font-medium">
      <Loader size={14} className="animate-spin shrink-0" />
      <span>Sincronizando feeds... pode levar até 30s na primeira vez.</span>
    </div>
    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
  </div>
);

/* ─────────────────────────────
   EMPTY / ERROR STATE
───────────────────────────── */
const EmptyState = ({ onRetry, isRetrying, isFilter }) => (
  <div className="flex flex-col items-center justify-center py-20
                  bg-slate-50 dark:bg-slate-900/30
                  rounded-[32px] border-2 border-dashed
                  border-slate-200 dark:border-white/10 p-10 text-center">
    <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900
                    flex items-center justify-center mb-5
                    border border-slate-200 dark:border-white/5 shadow-sm">
      <WifiOff size={26} className="text-slate-400 dark:text-slate-600" />
    </div>
    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
      {isFilter ? 'Nenhum artigo nessa categoria' : 'Feed indisponível'}
    </h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs">
      {isFilter
        ? 'Tente outra categoria ou atualize o feed.'
        : 'Não foi possível carregar. Verifique sua conexão.'}
    </p>
    {!isFilter && (
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl
                   bg-indigo-600 text-white font-bold text-sm
                   shadow-lg shadow-indigo-600/20
                   hover:bg-indigo-700 active:scale-95 transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
        Tentar novamente
      </button>
    )}
  </div>
);

/* ─────────────────────────────
   PAGINAÇÃO
───────────────────────────── */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const arr = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
    } else {
      arr.push(1);
      if (currentPage > 3)              arr.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) arr.push(i);
      if (currentPage < totalPages - 2) arr.push('...');
      arr.push(totalPages);
    }
    return arr;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 pt-8 pb-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 rounded-xl flex items-center justify-center
                   bg-white dark:bg-slate-900
                   border border-slate-200 dark:border-slate-800
                   text-slate-500 dark:text-slate-400
                   hover:border-indigo-400 hover:text-indigo-600
                   disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`dots-${idx}`} className="text-slate-400 dark:text-slate-600 text-sm w-6 text-center">…</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all
              ${page === currentPage
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600'
              }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 rounded-xl flex items-center justify-center
                   bg-white dark:bg-slate-900
                   border border-slate-200 dark:border-slate-800
                   text-slate-500 dark:text-slate-400
                   hover:border-indigo-400 hover:text-indigo-600
                   disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

/* ─────────────────────────────
   SKELETON SIDEBAR
───────────────────────────── */
const SkeletonSidebar = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
    ))}
  </div>
);

/* ─────────────────────────────
   MAIN COMPONENT
───────────────────────────── */
const FeedTech = () => {
  const { isDarkMode } = useTheme();

  const [activeCategory,    setActiveCategory]    = useState('todos');
  const [currentPage,       setCurrentPage]       = useState(1);
  const [articles,          setArticles]          = useState([]);
  const [trendingRepos,     setTrendingRepos]     = useState([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [hasError,          setHasError]          = useState(false);

  const loadFeed = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setHasError(false);
    try {
      if (forceRefresh) limparCacheFeed();
      const feedData = await getPersonalizedFeed([]);
      setArticles(feedData);
      if (feedData.length === 0) setHasError(true);
      if (forceRefresh) {
        feedData.length > 0
          ? toast.success(`${feedData.length} artigos carregados!`)
          : toast.error('Nenhum artigo. Verifique sua conexão.');
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTrending = useCallback(async () => {
    setIsTrendingLoading(true);
    try {
      const repos = await getGitHubTrending([]);
      setTrendingRepos(repos.slice(0, 6));
    } catch { /* silencioso */ }
    finally { setIsTrendingLoading(false); }
  }, []);

  useEffect(() => {
    loadFeed();
    loadTrending();
  }, [loadFeed, loadTrending]);

  // Filtrar artigos pela categoria ativa
  const filteredArticles = useMemo(() => {
    if (activeCategory === 'todos')      return articles;
    if (activeCategory === 'para voce') return articles.filter(a => a.isRecommended);
    return articles.filter(
      a => a.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [articles, activeCategory]);

  // Paginar artigos filtrados
  const totalPages    = Math.max(1, Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE));
  const pagedArticles = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showEmpty  = !isLoading && (hasError || filteredArticles.length === 0);
  const isFiltered = !hasError && activeCategory !== 'todos' && filteredArticles.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950
                    pt-4 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8
                    max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <header className="mb-6 sm:mb-10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white
                           uppercase tracking-tighter">
              Dev Feed
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
              {articles.length > 0
                ? `${articles.length} artigos · ${filteredArticles.length} nesta categoria`
                : 'Sua dose diária de engenharia de software.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadFeed(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl
                         bg-white dark:bg-slate-900
                         border border-slate-200 dark:border-white/10
                         text-slate-600 dark:text-slate-400
                         text-[10px] font-black uppercase tracking-widest
                         hover:text-indigo-600 dark:hover:text-indigo-400
                         hover:border-indigo-300 transition-all shadow-sm
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>

            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl
                            bg-indigo-50 dark:bg-indigo-900/20
                            border border-indigo-200 dark:border-indigo-500/20">
              <Zap size={15} className="text-indigo-600 dark:text-indigo-400" />
              <div className="text-xs leading-tight">
                <span className="block font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                  Ada Digest
                </span>
                <span className="text-slate-400 dark:text-slate-500">
                  {isLoading ? 'Carregando...' : `${articles.length} artigos hoje`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros com contadores reais */}
        <FeedFilters
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          articles={articles}
        />
      </header>

      {/* ── Layout Principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

        {/* ── Feed Principal ── */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <FeedLoading />
          ) : showEmpty ? (
            <EmptyState
              onRetry={() => loadFeed(true)}
              isRetrying={isLoading}
              isFilter={isFiltered}
            />
          ) : (
            <>
              {/* Info de página */}
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  Mostrando {(currentPage - 1) * ARTICLES_PER_PAGE + 1}–
                  {Math.min(currentPage * ARTICLES_PER_PAGE, filteredArticles.length)} de {filteredArticles.length}
                </p>
                {totalPages > 1 && (
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600">
                    Pág. {currentPage}/{totalPages}
                  </p>
                )}
              </div>

              {/* Artigos da página atual */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeCategory}-p${currentPage}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4 sm:space-y-5"
                >
                  {pagedArticles.map((article, idx) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: idx * 0.035 }}
                    >
                      <NewsCard
                        article={article}
                        onSave={() => toast.success('Salvo para ler depois!')}
                        onFlashcard={() => toast.info('Abra os flashcards para criar!')}
                        onAskAda={() => toast.info('Ada está analisando...')}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-5 lg:sticky lg:top-24">

          {/* GitHub Trending */}
          <section className="bg-white dark:bg-slate-900
                              border border-slate-200 dark:border-white/5
                              rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-black uppercase tracking-tighter text-sm
                              text-slate-900 dark:text-white">
                <Github size={15} className="text-indigo-500" />
                <span>Trending</span>
              </div>
              <TrendingUp size={13} className="text-slate-300 dark:text-slate-700" />
            </div>

            {isTrendingLoading ? (
              <SkeletonSidebar />
            ) : trendingRepos.length === 0 ? (
              <p className="text-xs text-center text-slate-400 dark:text-slate-600 py-3">
                Sem repos disponíveis
              </p>
            ) : (
              <div className="space-y-1">
                {trendingRepos.map(repo => (
                  <a
                    key={repo.id}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-2xl group
                               hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0
                                    bg-slate-100 dark:bg-slate-800
                                    border border-slate-200 dark:border-white/10
                                    group-hover:border-indigo-400/40 transition-colors">
                      {repo.ownerAvatar ? (
                        <img src={repo.ownerAvatar} alt="" className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Github size={11} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate
                                    group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {repo.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                        {repo.language || 'Code'} · ⭐ {repo.stars?.toLocaleString?.() ?? 0}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Livros */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1 font-black uppercase tracking-tighter text-sm
                            text-slate-900 dark:text-white">
              <BookOpen size={15} className="text-cyan-500" />
              <span>Leitura da Semana</span>
            </div>
            {TECH_BOOKS.slice(0, 3).map(book => (
              <BookCard key={book.id} book={book}
                onAddToList={() => toast.success('Adicionado à lista!')} />
            ))}
          </section>

          {/* Pomodoro widget */}
          <div className="flex items-center justify-between p-4 rounded-[20px]
                          bg-indigo-50 dark:bg-indigo-900/20
                          border border-indigo-200 dark:border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-600/20
                              flex items-center justify-center shrink-0">
                <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                  Modo Foco
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">25:00 · Pronto</p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white
                               text-[10px] font-black uppercase tracking-widest
                               hover:bg-indigo-700 active:scale-95 transition-all
                               shadow-md shadow-indigo-500/20">
              Iniciar
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

FeedTech.displayName = 'FeedTechPage';
export default FeedTech;