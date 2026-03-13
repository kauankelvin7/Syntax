/**
 * 🎯 TEST_SUITE_ENGINE (Simulado Infinito) — Syntax Theme Premium
 * * Geração autônoma de testes via LLM (Gemini 2.5/2.0 Fallback).
 * - Features: PDF Data Extraction, Real-time Feedback, Performance Analytics.
 * - Design: QA Monitoring Interface (Slate-950 / Cyan / Indigo).
 * - v4.6: Fixed Gemini Models (2.5-flash + 2.0-flash + 2.0-flash-lite fallback).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  Loader2,
  AlertTriangle,
  Target,
  Zap,
  FileText,
  Upload,
  X,
  File,
  RefreshCw,
  History,
  Clock,
  Sparkles,
  Terminal,
  Cpu,
  Activity,
  Code2
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { salvarSimulado } from '../services/firebaseService';
import { Z } from '../constants/zIndex';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ✅ CORRIGIDO: modelos atualizados — 1.5-flash e 1.5-pro foram descontinuados
const MODEL_CANDIDATES = [
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

/* ═══════════════════════════════════════════
   PROMPT ENGINEERING (Preservado e Adaptado)
   ═══════════════════════════════════════════ */

const generatePrompt = (tema, nivel, qtd) => `Gere ${qtd} questões de engenharia de software sobre "${tema}" nível ${nivel}. 

RESPONDA APENAS JSON. Sem texto, sem markdown. 

{"simulado":{"tema":"${tema}","questoes":[{"id":1,"enunciado":"texto","alternativas":[{"id":"A","texto":"..."},{"id":"B","texto":"..."},{"id":"C","texto":"..."},{"id":"D","texto":"..."}],"resposta_correta":"A","explicacao":"texto"}]}} 

Regras: exatamente ${qtd} questões, 4 alternativas cada, 1 correta, explicação obrigatória.`;

const generatePromptByPDF = (textoExtraido, qtd) => `Você é um Arquiteto de Sistemas auditando documentação.
Gere EXATAMENTE ${qtd} questões de múltipla escolha baseadas APENAS nesta documentação:

--- SOURCE_START ---
${textoExtraido}
--- SOURCE_END ---

RESPONDA APENAS JSON seguindo este formato:
{"simulado":{"tema":"Documentação PDF","questoes":[{"id":1,"enunciado":"texto","alternativas":[{"id":"A","texto":"..."},{"id":"B","texto":"..."},{"id":"C","texto":"..."},{"id":"D","texto":"..."}],"resposta_correta":"A","explicacao":"texto"}]}}

Regras: questões baseadas 100% no texto, 4 alternativas, 1 correta, explicação profunda.`;

const parsearRespostaIA = (resposta) => {
  try { return JSON.parse(resposta); } catch {}
  try { 
    const m = resposta.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) return JSON.parse(m[1].trim());
  } catch {}
  try { 
    const i = resposta.indexOf('{');
    const f = resposta.lastIndexOf('}');
    if (i !== -1) return JSON.parse(resposta.substring(i, f + 1));
  } catch {}
  throw new Error('Formato inválido. Tente novamente.');
};

const temasSugeridos = [
  'Microservices Architecture',
  'Data Structures & Algorithms',
  'RESTful API Design',
  'Clean Code Principles',
  'Database Normalization',
  'GitFlow & Version Control',
  'Cloud Infrastructure (AWS/GCP)',
  'CI/CD Pipelines',
  'React Performance Hooks',
  'Security & JWT Auth'
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

function Simulado() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tema, setTema] = useState('');
  const [nivel, setNivel] = useState('Júnior');
  const [quantidade, setQuantidade] = useState(5);
  const [historicoSalvo, setHistoricoSalvo] = useState(false);
  const [questoes, setQuestoes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fase, setFase] = useState('setup'); // setup | quiz | resultado
  const [showGabarito, setShowGabarito] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [activeTab, setActiveTab] = useState('tema');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [timeLeft, setTimeLeft] = useState(null);
  const [timerDuration, setTimerDuration] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const timerRef = useRef(null);

  const NIVEL_OPTIONS = ['Iniciante', 'Júnior', 'Pleno', 'Sênior'];
  const QTD_OPTIONS = [5, 10, 15, 20];
  const TIMER_OPTIONS = [
    { value: 5,  label: '05m', desc: 'Sprint' },
    { value: 10, label: '10m', desc: 'Standard' },
    { value: 20, label: '20m', desc: 'Deep' },
    { value: 0,  label: 'INF', desc: 'No_Limit' },
  ];

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const encerrarSimulado = useCallback(() => {
    setTimerActive(false);
    setFase('resultado');
    setHistoricoSalvo(false);
  }, []);

  const togglePauseTimer = useCallback(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    setTimerPaused(p => !p);
    setTimerActive(a => !a);
  }, [timeLeft]);

  useEffect(() => {
    if (!timerActive || timeLeft === null) return;
    if (timeLeft <= 0) { encerrarSimulado(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timerActive, timeLeft, encerrarSimulado]);

  useEffect(() => {
    if (fase !== 'resultado' || historicoSalvo || questoes.length === 0) return;
    const userId = user?.uid;
    if (!userId) return;
    const totalAcertos = questoes.reduce((acc, q, idx) => (respostas[idx] === q.correta ? acc + 1 : acc), 0);
    const score = Math.round((totalAcertos / questoes.length) * 100);
    const tempoTotal = timeLeft !== null && timerDuration > 0 ? (timerDuration * 60) - timeLeft : 0;
    
    salvarSimulado({
      tema, score, acertos: totalAcertos, total: questoes.length, tempoSegundos: tempoTotal,
      questoes: questoes.map((q, idx) => ({ ...q, respostaUsuario: respostas[idx], acertou: respostas[idx] === q.correta })),
    }, userId).then(() => setHistoricoSalvo(true));
  }, [fase, historicoSalvo, questoes, respostas, tema, timeLeft, timerDuration, user]);

  /* ═══════════════════════════════════════════
     PDF & IA LOGIC
     ═══════════════════════════════════════════ */

  const extractTextFromPdf = async (file) => {
    setIsExtractingPdf(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
      }
      const cleaned = fullText.replace(/\s+/g, ' ').trim().substring(0, 30000);
      setPdfText(cleaned);
      return cleaned;
    } catch (err) {
      console.error('Erro ao extrair PDF:', err);
      throw err;
    } finally { setIsExtractingPdf(false); }
  };

  // ✅ CORRIGIDO: fallback melhorado com retry em 429 e log de erro por modelo
  const generateWithFallback = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError;

    for (let i = 0; i < MODEL_CANDIDATES.length; i++) {
      const modelName = MODEL_CANDIDATES[i];
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        lastError = err;
        const s = String(err?.status || err?.message || '');
        const is429 = s.includes('429');
        const is404 = s.includes('404');

        console.warn(`[Simulado] Modelo ${modelName} falhou:`, s);

        // 429 no primeiro modelo → aguarda antes de tentar o próximo
        if (is429 && i === 0) {
          await new Promise(r => setTimeout(r, 3000));
        }

        // Continua para o próximo modelo em qualquer erro
        continue;
      }
    }

    throw new Error('All_Models_Unavailable');
  };

  const gerarQuestoes = async () => {
    if (activeTab === 'tema' ? !tema.trim() : !pdfText) return;
    setIsLoading(true);
    setError(null);
    try {
      const prompt = activeTab === 'tema' 
        ? generatePrompt(tema, nivel, quantidade) 
        : generatePromptByPDF(pdfText, quantidade);
        
      if (activeTab === 'arquivo' && pdfFile) setTema(pdfFile.name.replace('.pdf',''));
      
      const response = await generateWithFallback(prompt);
      const parsedData = parsearRespostaIA(response);
      const questoesNormalizadas = (parsedData.simulado?.questoes || parsedData.questoes || parsedData).map(q => ({
        pergunta: q.enunciado || q.pergunta,
        opcoes: q.alternativas?.map(a => a.texto || a) || q.opcoes,
        correta: q.resposta_correta !== undefined ? (typeof q.resposta_correta === 'string' ? q.resposta_correta.charCodeAt(0) - 65 : q.resposta_correta) : q.correta,
        explicacao: q.explicacao
      }));
      
      setQuestoes(questoesNormalizadas);
      setFase('quiz');
      setCurrentIndex(0);
      setRespostas({});
      setHasAnswered(false);
      if (timerDuration > 0) { setTimeLeft(timerDuration * 60); setTimerActive(true); }
    } catch (err) {
      console.error(err);
      setError('Telemetria_Error: IA retornou formato inválido.');
    } finally { setIsLoading(false); }
  };

  const selecionarResposta = (idx) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
    setRespostas(prev => ({ ...prev, [currentIndex]: idx }));
  };

  const proximaQuestao = () => {
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      const nextResp = respostas[currentIndex + 1];
      setSelectedOption(nextResp !== undefined ? nextResp : null);
      setHasAnswered(nextResp !== undefined);
    } else {
      setFase('resultado');
      setTimerActive(false);
    }
  };

  const questaoAnterior = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      const respAnterior = respostas[currentIndex - 1];
      setSelectedOption(respAnterior !== undefined ? respAnterior : null);
      setHasAnswered(respAnterior !== undefined);
    }
  };

  const reiniciar = () => {
    setFase('setup');
    setQuestoes([]);
    setRespostas({});
    setTema('');
    setTimerActive(false);
    setTimeLeft(null);
    setShowGabarito(false);
  };

  const calcularStatus = (pct) => {
    if (pct >= 90) return { label: 'Excelente', color: 'text-emerald-500', icon: Trophy };
    if (pct >= 70) return { label: 'Bom', color: 'text-indigo-400', icon: Target };
    if (pct >= 50) return { label: 'Regular', color: 'text-amber-500', icon: Activity };
    return { label: 'Estudar mais', color: 'text-rose-500', icon: AlertTriangle };
  };

  const novoSimulado = () => {
    gerarQuestoes();
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    setPdfFile(file);
    try {
      await extractTextFromPdf(file);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        
        {/* ─── HEADER ─── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[22px] bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl border-2 border-white/10 shrink-0">
              <Code2 size={32} className="text-white dark:text-slate-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-1">Infinite_Sim</h1>
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Terminal size={14} className="text-cyan-500" /> AI-Powered Test Suite Deployment
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── SETUP PHASE ─── */}
        <AnimatePresence mode="wait">
          {fase === 'setup' && !isLoading && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] p-6 sm:p-10 shadow-sm overflow-hidden"
            >
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-10 max-w-sm mx-auto shadow-inner">
                {['tema', 'arquivo'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 sm:py-3.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-xl' : 'text-slate-500'}`}
                  >
                    {tab === 'tema' ? 'Por Tema' : 'Via PDF'}
                  </button>
                ))}
              </div>

              <div className="space-y-10">
                {activeTab === 'tema' ? (
                  <div className="space-y-6">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Tópico de Estudo</label>
                    <input type="text" placeholder="Ex: Microserviços, Docker, React..." value={tema} onChange={e => setTema(e.target.value)}
                      className="w-full h-14 sm:h-16 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] px-6 text-lg sm:text-xl font-bold focus:border-indigo-500 outline-none transition-all shadow-inner"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {temasSugeridos.slice(0, 6).map(t => (
                        <button key={t} onClick={() => setTema(t)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] sm:text-[11px] font-bold text-slate-500 hover:bg-indigo-500 hover:text-white transition-all">#{t}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[32px] p-8 sm:p-16 text-center cursor-pointer transition-all ${isDragOver ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'}`}>
                      <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => handleFileSelect(e.target.files[0])} className="hidden" />
                      {!pdfFile ? (
                        <>
                          <Upload size={32} className="mx-auto text-slate-300 mb-4" />
                          <p className="text-[12px] sm:text-[14px] font-black text-slate-400 uppercase tracking-widest text-center">Clique ou arraste seu PDF</p>
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-4">
                           <FileText size={32} className="text-cyan-500" />
                           <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-xs">{pdfFile.name}</span>
                           {isExtractingPdf && <Loader2 className="animate-spin text-indigo-500" />}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-4 block text-center sm:text-left">Dificuldade</label>
                    <div className="grid grid-cols-2 gap-2">
                      {NIVEL_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => setNivel(opt)}
                          className={`py-3 rounded-xl border-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${nivel === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-4 block text-center sm:text-left">Questões</label>
                    <div className="grid grid-cols-4 gap-2">
                      {QTD_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => setQuantidade(opt)}
                          className={`py-3 rounded-xl border-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${quantidade === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-4 block text-center sm:text-left">Tempo Limite</label>
                  <div className="grid grid-cols-4 gap-3 sm:gap-4">
                    {TIMER_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setTimerDuration(opt.value)}
                        className={`flex flex-col items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${timerDuration === opt.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                      >
                        <span className="text-base sm:text-lg font-black font-mono">{opt.label}</span>
                        <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest opacity-60 text-center">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[12px] font-bold">
                    <AlertTriangle size={16} className="shrink-0" />
                    {error}
                  </div>
                )}

                <Button onClick={gerarQuestoes} disabled={isLoading || isExtractingPdf || (activeTab === 'tema' ? !tema.trim() : !pdfText)} className="w-full h-16 bg-indigo-600 !rounded-[20px] font-black uppercase tracking-[0.2em] text-[12px] sm:text-[13px] shadow-2xl shadow-indigo-600/20">
                  {isLoading ? 'Gerando questões...' : 'Iniciar Simulado'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ zIndex: Z.modal }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-xs">
                <div className="w-24 h-24 rounded-[32px] bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center mx-auto mb-8 relative">
                  <div className="absolute inset-0 rounded-[32px] border-2 border-indigo-500 animate-ping opacity-20" />
                  <Cpu size={40} className="text-indigo-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-3">Compilando Suite</h3>
                <p className="text-slate-400 font-bold text-sm leading-relaxed uppercase tracking-widest opacity-60">A Ada está preparando {quantidade} questões sobre {tema || 'seu documento'}...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── QUIZ PHASE (The Probe) ─── */}
        {fase === 'quiz' && questoes[currentIndex] && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm">
               <div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">Progresso</span>
                 <span className="text-xl font-black text-indigo-500 font-mono">{currentIndex + 1} <span className="text-slate-400">/</span> {questoes.length}</span>
               </div>
               {timeLeft !== null && (
                 <div className={`px-5 py-2.5 rounded-xl border-2 font-black font-mono flex items-center gap-3 ${timeLeft < 60 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'}`}>
                   <Clock size={16} /> {formatTime(timeLeft)}
                 </div>
               )}
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
               <div className="p-10 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-2 text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4"><Zap size={14} /> Questão {currentIndex + 1}</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight italic tracking-tighter uppercase">{questoes[currentIndex].pergunta}</h3>
               </div>
               <div className="p-10 space-y-4">
                  {questoes[currentIndex].opcoes.map((opt, idx) => {
                    const showFeedback = hasAnswered;
                    const isCorrect = questoes[currentIndex].correta === idx;
                    const isSelected = selectedOption === idx;
                    let cls = "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300";
                    if (showFeedback) {
                      if (isCorrect) cls = "bg-emerald-500/10 border-emerald-500 text-emerald-500";
                      else if (isSelected) cls = "bg-rose-500/10 border-rose-500 text-rose-500";
                      else cls = "opacity-30 border-slate-100";
                    } else if (isSelected) cls = "border-indigo-500 bg-indigo-500/5 text-indigo-500 ring-4 ring-indigo-500/10";

                    return (
                      <motion.button key={idx} onClick={() => selecionarResposta(idx)} disabled={hasAnswered}
                        className={`w-full p-6 rounded-[22px] border-2 text-left flex items-center gap-6 transition-all ${cls}`}
                        whileHover={!hasAnswered ? { x: 8 } : {}}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-[14px] ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="font-bold text-[16px]">{opt}</span>
                      </motion.button>
                    );
                  })}
               </div>
               
               <AnimatePresence>
                 {hasAnswered && (
                   <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-indigo-600 text-white p-10 border-t border-white/10">
                      <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20"><BookOpen size={24} /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Explicação Técnica</p>
                          <p className="text-[16px] font-medium leading-relaxed">{questoes[currentIndex].explicacao}</p>
                        </div>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div className="flex justify-between items-center pb-10">
               <button onClick={questaoAnterior} disabled={currentIndex === 0} className="h-14 px-8 rounded-2xl bg-white dark:bg-slate-900 text-slate-500 font-black uppercase tracking-widest text-[11px] border-2 disabled:opacity-20 transition-all hover:border-slate-300">Anterior</button>
               <Button onClick={proximaQuestao} disabled={!hasAnswered} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-16 !rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl">
                 {currentIndex === questoes.length - 1 ? 'Finalizar Simulado' : 'Próxima Questão'} <ArrowRight size={18} className="ml-3" />
               </Button>
            </div>
          </motion.div>
        )}

        {/* ─── RESULT PHASE (Deployment Report) ─── */}
        {fase === 'resultado' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto space-y-8 pb-20"
          >
            <div className="bg-slate-900 border-2 border-white/5 rounded-[42px] p-10 sm:p-16 text-center shadow-2xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${questoes.reduce((acc, q, idx) => (respostas[idx] === q.correta ? acc + 1 : acc), 0) / questoes.length >= 0.7 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              
              {(() => {
                const totalAcertos = questoes.reduce((acc, q, idx) => (respostas[idx] === q.correta ? acc + 1 : acc), 0);
                const pct = Math.round((totalAcertos / questoes.length) * 100);
                const status = calcularStatus(pct);
                const StatusIcon = status.icon;

                return (
                  <>
                    <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                      className={`w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] mx-auto mb-10 flex items-center justify-center shadow-2xl ${pct >= 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    >
                      <StatusIcon size={48} className="text-white sm:w-16 sm:h-16" />
                    </motion.div>

                    <h2 className={`text-3xl sm:text-5xl font-black tracking-tighter uppercase italic mb-2 ${status.color}`}>{status.label}</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mb-12 text-[10px] sm:text-xs">Simulado concluído com sucesso</p>

                    <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-12">
                      <div className="bg-black/40 p-6 sm:p-8 rounded-[28px] border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Desempenho</p>
                        <p className={`text-3xl sm:text-5xl font-black font-mono tracking-tighter ${status.color}`}>
                          {pct}%
                        </p>
                      </div>
                      <div className="bg-black/40 p-6 sm:p-8 rounded-[28px] border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Acertos</p>
                        <p className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tighter">
                          {totalAcertos}<span className="text-xl sm:text-2xl text-slate-600">/</span>{questoes.length}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button onClick={reiniciar} variant="secondary" className="flex-1 h-14 sm:h-16 !rounded-[20px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[11px] hover:bg-white/10">Início</Button>
                <Button onClick={novoSimulado} className="flex-[1.5] h-14 sm:h-16 !rounded-[20px] bg-indigo-600 font-black uppercase tracking-widest text-[11px] shadow-2xl">Novo Simulado</Button>
              </div>
              
              <button 
                onClick={() => setShowGabarito(!showGabarito)}
                className="flex items-center gap-2 mx-auto text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] hover:text-indigo-300 transition-colors"
              >
                {showGabarito ? 'Ocultar Gabarito' : 'Ver Gabarito Completo'}
              </button>
            </div>

            {/* Gabarito Colapsável */}
            <AnimatePresence>
              {showGabarito && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-4">
                  {questoes.map((q, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 overflow-hidden">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black font-mono ${respostas[idx] === q.correta ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {idx + 1}
                        </div>
                        <h4 className="text-[16px] font-black text-slate-800 dark:text-white uppercase tracking-tight italic pt-2">{q.pergunta}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {q.opcoes.map((opt, oIdx) => (
                          <div key={oIdx} className={`p-4 rounded-xl border text-[13px] font-bold ${oIdx === q.correta ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : (oIdx === respostas[idx] ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500')}`}>
                            <span className="font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Explicação:</span>
                        <p className="text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{q.explicacao}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={() => navigate('/historico-simulados')} className="mt-10 flex items-center gap-2 mx-auto text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors">
              <History size={16} /> Ver Histórico de Testes
            </button>
          </motion.div>
        )}
      </div>

      <style>{`
        input::placeholder { opacity: 0.3; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default Simulado;