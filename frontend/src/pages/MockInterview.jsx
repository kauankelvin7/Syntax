import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MessageSquare, Zap, Clock, Shield, Target, Globe, Play, History, ChevronRight, Award, Trophy, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { db } from '../config/firebase-config';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

import DifficultySelector from '../components/interview/DifficultySelector';
import InterviewSession from '../components/interview/InterviewSession';
import InterviewFeedback from '../components/interview/InterviewFeedback';

const MockInterview = () => {
  const { user } = useAuth();
  const [stage, setStage] = useState('config'); // config, session, feedback, history
  const [config, setConfig] = useState({
    type: 'tecnica',
    level: 'junior',
    company: '',
    duration: '30min',
    focus: 'algoritmos',
    language: 'portugues'
  });
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [pastInterviews, setPastInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, `users/${user.uid}/interviewHistory`), orderBy('completedAt', 'desc'));
      const snapshot = await getDocs(q);
      setPastInterviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (stage === 'history') loadHistory();
  }, [stage, loadHistory]);

  const handleStart = async () => {
    setIsLoading(true);
    toast.loading('Ada está gerando sua entrevista personalizada...', { id: 'generating' });
    
    // Mocking Gemini API response for questions
    setTimeout(() => {
      const mockQuestions = [
        {
          id: 1,
          question: 'Explique a diferença entre let, const e var no JavaScript moderno.',
          type: 'conceptual',
          difficulty: config.level,
          expectedKeyPoints: ['Escopo de bloco', 'Hoisting', 'Reatribuição'],
          timeRecommended: 300
        },
        {
          id: 2,
          question: 'Como funciona o Virtual DOM no React e por que ele melhora a performance?',
          type: 'conceptual',
          difficulty: config.level,
          expectedKeyPoints: ['Reconciliação', 'Diffing algorithm', 'Batch updates'],
          timeRecommended: 450
        },
        {
          id: 3,
          question: 'Escreva uma função que inverta uma string sem usar o método reverse().',
          type: 'coding',
          difficulty: config.level,
          expectedKeyPoints: ['Loops', 'Recursão', 'Complexidade O(n)'],
          timeRecommended: 600
        }
      ];
      setQuestions(mockQuestions);
      setStage('session');
      setIsLoading(false);
      toast.success('Entrevista pronta! Boa sorte.', { id: 'generating' });
    }, 2000);
  };

  const handleComplete = (answers) => {
    toast.loading('Ada está avaliando seu desempenho...', { id: 'evaluating' });
    
    // Mocking Gemini API evaluation
    setTimeout(() => {
      const mockResults = {
        score: 87,
        categoryScores: {
          'Conceitos': 9,
          'Comunicação': 8,
          'Profundidade': 7,
          'Codificação': 9
        },
        strengths: [
          'Domínio sólido dos fundamentos de JavaScript.',
          'Explicação clara sobre o ciclo de vida do React.',
          'Lógica de programação eficiente no desafio de código.'
        ],
        improvements: [
          'Poderia detalhar mais sobre o processo de reconciliação.',
          'Faltou mencionar hoisting na explicação sobre var.',
          'Considere o uso de reduce() para soluções mais funcionais.'
        ],
        answers
      };
      setResults(mockResults);
      setStage('feedback');
      toast.success('Avaliação concluída!', { id: 'evaluating' });
    }, 2500);
  };

  const saveToHistory = async () => {
    if (!user?.uid) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/interviewHistory`), {
        ...config,
        score: results.score,
        completedAt: serverTimestamp(),
        strengths: results.strengths,
        improvements: results.improvements
      });
      toast.success('Resultado salvo no seu histórico!');
      setStage('history');
    } catch (error) {
      toast.error('Erro ao salvar resultado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto">
      <AnimatePresence mode="wait">
        {stage === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mock Interview</h1>
                <p className="text-slate-600 dark:text-slate-400 font-semibold max-w-xl">
                  Simule entrevistas reais com a Ada. Receba feedback instantâneo e melhore sua performance técnica.
                </p>
              </div>
              <button 
                onClick={() => setStage('history')}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-white/5 transition-all border border-slate-200 dark:border-white/5"
              >
                <History size={16} /> Ver Histórico
              </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Config */}
              <div className="lg:col-span-2 space-y-8">
                {/* Difficulty Selector */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tighter px-2">
                    <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Nível da Entrevista</span>
                  </div>
                  <DifficultySelector 
                    selected={config.level} 
                    onSelect={(val) => setConfig({ ...config, level: val })} 
                  />
                </section>

                {/* Grid Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tighter px-2">
                      <Target size={20} className="text-cyan-600 dark:text-cyan-400" />
                      <span>Tipo de Foco</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['técnica', 'comportamental', 'system design', 'misto'].map(type => (
                        <button
                          key={type}
                          onClick={() => setConfig({ ...config, type })}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            config.type === type 
                              ? 'bg-indigo-600 border-indigo-500 text-white' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Empresa */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-tighter px-2">
                      <Globe size={20} className="text-purple-600 dark:text-purple-400" />
                      <span>Empresa Alvo</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: Google, Meta, Nubank..."
                      value={config.company}
                      onChange={(e) => setConfig({ ...config, company: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Additional Options */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2">
                        <Clock size={16} className="text-slate-400 dark:text-slate-500" />
                        <select 
                            value={config.duration}
                            onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                            className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                        >
                            <option value="15min">15 Minutos</option>
                            <option value="30min">30 Minutos</option>
                            <option value="45min">45 Minutos</option>
                            <option value="60min">60 Minutos</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2">
                        <Globe size={16} className="text-slate-400 dark:text-slate-500" />
                        <select 
                            value={config.language}
                            onChange={(e) => setConfig({ ...config, language: e.target.value })}
                            className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none"
                        >
                            <option value="portugues">Português</option>
                            <option value="english">English (Praticar)</option>
                        </select>
                    </div>
                </div>
              </div>

              {/* Summary & Start */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-[38px] p-8 shadow-2xl shadow-indigo-600/20 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                    <Zap size={100} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Pronto para começar?</h3>
                        <p className="text-white/70 text-sm font-medium mt-2">
                            A Ada irá atuar como sua entrevistadora sênior. Prepare seu microfone ou teclado.
                        </p>
                    </div>
                    <button
                      onClick={handleStart}
                      disabled={isLoading}
                      className="w-full py-4 rounded-2xl bg-white text-indigo-600 font-black uppercase tracking-tighter shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Gerando...' : 'Iniciar Entrevista'}
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-[28px] bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 flex items-start gap-4">
                    <Info size={20} className="text-amber-500 dark:text-amber-400 shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        Dica: Tente explicar seu raciocínio em voz alta enquanto escreve sua resposta. 
                        A Ada avalia não apenas a resposta correta, mas sua capacidade de comunicação técnica.
                    </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'session' && (
          <InterviewSession 
            questions={questions}
            onComplete={handleComplete}
            onCancel={() => setStage('config')}
          />
        )}

        {stage === 'feedback' && results && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
             <div className="flex items-center justify-between">
                <button 
                    onClick={() => setStage('config')}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest flex items-center gap-2"
                >
                    <ChevronRight size={14} className="rotate-180" /> Voltar ao Início
                </button>
                <div className="flex items-center gap-3">
                    <Award size={20} className="text-amber-400" />
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Avaliação Técnica Completa</span>
                </div>
             </div>

             <InterviewFeedback 
                score={results.score}
                categoryScores={results.categoryScores}
                strengths={results.strengths}
                improvements={results.improvements}
                onSave={saveToHistory}
             />
          </motion.div>
        )}

        {stage === 'history' && (
            <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
            >
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Seu Histórico</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Acompanhe sua evolução em entrevistas técnicas.</p>
                    </div>
                    <button 
                        onClick={() => setStage('config')}
                        className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                        Nova Entrevista
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {pastInterviews.length > 0 ? (
                        pastInterviews.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-6 flex flex-col md:flex-row items-center gap-6 hover:border-slate-300 dark:hover:border-white/10 transition-colors group">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center border border-slate-200 dark:border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{item.score}</span>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Score</span>
                                </div>
                                
                                <div className="flex-1 space-y-2 text-center md:text-left">
                                    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.type}</h4>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/5">{item.level}</span>
                                        {item.company && <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-500/20">{item.company}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium italic">
                                        Realizada em {item.completedAt?.toDate().toLocaleDateString('pt-BR')} • Duração: {item.duration}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                <Trophy size={12} className="text-amber-500" />
                                            </div>
                                        ))}
                                    </div>
                                    <button className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-4">
                            <Trophy size={64} className="opacity-10" />
                            <p className="text-sm font-medium">Você ainda não realizou nenhuma entrevista simulada.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

MockInterview.displayName = 'MockInterviewPage';

export default MockInterview;
