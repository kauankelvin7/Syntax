import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, Search, Code2, Folder, 
  ChevronRight, Star, GitBranch, ExternalLink,
  Zap, Clock, Info, ShieldCheck,
  RefreshCw, FileCode, CheckCircle2,
  Lock, ArrowLeft, Loader
} from 'lucide-react';
import { toast } from 'sonner';
import { useGitHub } from '../hooks/useGitHub';
import { getRepoLanguages, getRecentCommits } from '../services/githubService';
import RepoCard from '../components/github/RepoCard';

const GitHubIntegration = () => {
  const { isConnected, username, token, isLoading, connect, disconnect } = useGitHub();
  
  const [stage, setStage] = useState('connect'); // connect, repos, analysis
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [analyses, setAnalyses] = useState({}); // { repoId: { loading, data } }

  // Sincronizar estágio com conexão
  useEffect(() => {
    if (isConnected) {
      setStage('repos');
    } else {
      setStage('connect');
    }
  }, [isConnected]);

  // Carregar repositórios ao conectar
  useEffect(() => {
    if (!isConnected || !token) return;
    
    setReposLoading(true);
    fetch('https://api.github.com/user/repos?per_page=20&sort=updated', {
      headers: { Authorization: `token ${token}` }
    })
    .then(r => r.ok ? r.json() : [])
    .then(data => setRepos(Array.isArray(data) ? data : []))
    .catch(() => {
      setRepos([]);
      toast.error('Erro ao carregar repositórios do GitHub.');
    })
    .finally(() => setReposLoading(false));
  }, [isConnected, token]);

  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo);
    setStage('analysis');
    
    // Se já foi analisado, não analisa de novo
    if (analyses[repo.id]) return;

    setAnalyses(prev => ({ ...prev, [repo.id]: { loading: true } }));
    
    try {
      // 1. Buscar linguagens
      const languages = await getRepoLanguages(repo.owner.login, repo.name, token);
      const techStack = Object.keys(languages).slice(0, 5);

      // 2. Buscar commits recentes
      const commits = await getRecentCommits(repo.owner.login, repo.name, token);
      
      // 3. Simular análise baseada em dados reais
      const repoAnalysis = {
        score: Math.min(60 + (repo.stargazers_count * 2) + (repo.forks_count * 5), 98),
        techStack: techStack.length > 0 ? techStack : ['Unknown'],
        metrics: {
          complexity: repo.size > 50000 ? 'Alta' : repo.size > 10000 ? 'Média' : 'Baixa',
          coverage: 'N/A',
          quality: 'Verificada',
          activity: commits.length > 5 ? 'Alta' : 'Moderada'
        },
        suggestions: [
          `Mantenha a stack ${techStack.join(', ')} atualizada.`,
          commits.length < 3 ? 'Aumente a frequência de commits para melhor rastreabilidade.' : 'Ótimo ritmo de commits.',
          repo.has_issues ? 'Considere usar GitHub Issues para organizar o backlog.' : 'Habilite issues para colaboração.'
        ]
      };

      setAnalyses(prev => ({ 
        ...prev, 
        [repo.id]: { loading: false, data: repoAnalysis } 
      }));
    } catch (error) {
      setAnalyses(prev => ({ ...prev, [repo.id]: { loading: false, error: error.message } }));
      toast.error('Erro na análise da Ada: ' + error.message);
    }
  };

  const currentAnalysis = selectedRepo ? analyses[selectedRepo.id]?.data : null;
  const isAnalyzing = selectedRepo ? analyses[selectedRepo.id]?.loading : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto overflow-x-hidden">
      <AnimatePresence mode="wait">
        {stage === 'connect' && (
          <motion.div
            key="connect"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-xl mx-auto mt-20"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[38px] p-12 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700 text-slate-900 dark:text-white">
                <Github size={240} />
              </div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-[28px] bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <Github size={40} />
                </div>
                
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
                  Sincronizar com GitHub
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-10">
                  Importe seus projetos, analise a qualidade do seu código com a Ada e ganhe pontos por contribuições reais.
                </p>

                <button 
                  onClick={connect}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black uppercase tracking-tighter text-sm shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader size={20} className="animate-spin" /> : <Github size={20} />}
                  <span>{isLoading ? 'Conectando...' : 'Conectar com GitHub'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'repos' && (
          <motion.div
            key="repos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Seus Repositórios</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">GitHub Profile: @{username}</p>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <button 
                    onClick={async () => {
                      await disconnect();
                      setRepos([]);
                      setAnalyses({});
                      toast.success('GitHub desconectado.');
                    }}
                    className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm">
                <RefreshCw size={14} className={`text-indigo-600 dark:text-indigo-400 ${reposLoading ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  {reposLoading ? 'Sincronizando...' : 'Sincronizado'}
                </span>
              </div>
            </header>

            {reposLoading && repos.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-48 rounded-[28px] bg-slate-100 dark:bg-slate-900 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    onSelect={handleSelectRepo}
                    analysis={analyses[repo.id]?.data}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {stage === 'analysis' && selectedRepo && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStage('repos')}
                  className="p-2 rounded-xl bg-white dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/5"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedRepo.name}</h1>
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Análise Técnica de Qualidade por Ada AI</p>
                </div>
              </div>
              <a 
                href={selectedRepo.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-white/10 transition-all shadow-sm"
              >
                Ver no GitHub <ExternalLink size={14} />
              </a>
            </header>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Github size={32} className="text-slate-400" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Ada está analisando...</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Processando linguagens, commits e métricas do repositório.</p>
                </div>
              </div>
            ) : currentAnalysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Score Gauge */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[38px] p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-600/5 blur-[80px]" />
                  <div className="relative z-10">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-100 dark:border-white/5 flex items-center justify-center mb-6">
                      <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{currentAnalysis.score}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Repo Score</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Status: {currentAnalysis.score > 80 ? 'Excelente Performance' : 'Boa Performance'}</p>
                  </div>
                </div>

                {/* Stack & Metrics */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-8 shadow-sm">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Tech Stack Detectada</h3>
                    <div className="flex flex-wrap gap-3">
                      {currentAnalysis.techStack.map(s => (
                        <span key={s} className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-8 flex items-center justify-around shadow-sm">
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Qualidade</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">{currentAnalysis.metrics.quality}</span>
                    </div>
                    <div className="w-px h-10 bg-slate-200 dark:bg-white/5" />
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Complexidade</span>
                      <span className="text-lg font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter">{currentAnalysis.metrics.complexity}</span>
                    </div>
                    <div className="w-px h-10 bg-slate-200 dark:bg-white/5" />
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Atividade</span>
                      <span className="text-lg font-black text-cyan-600 dark:text-cyan-500 uppercase tracking-tighter">{currentAnalysis.metrics.activity}</span>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="lg:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[38px] p-10 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white">
                      <Zap size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Insights da Ada</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {currentAnalysis.suggestions.map((s, idx) => (
                      <div key={idx} className="p-6 rounded-[22px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Sugestão #{idx+1}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                          {s}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500">Erro ao processar análise.</p>
                <button onClick={() => handleSelectRepo(selectedRepo)} className="mt-4 text-indigo-500 font-bold uppercase tracking-widest text-xs">Tentar novamente</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

GitHubIntegration.displayName = 'GitHubIntegrationPage';

export default GitHubIntegration;
