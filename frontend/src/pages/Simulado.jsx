/**
 * 🎯 TEST_SUITE_ENGINE (Simulado Infinito) — Syntax Theme Premium
 * * Geração autônoma de testes via LLM (Gemini 2.5/1.5 Fallback).
 * - Features: PDF Data Extraction, Real-time Feedback, Performance Analytics.
 * - Design: QA Monitoring Interface (Slate-950 / Cyan / Indigo).
 * - v4.5: Fixed JSON Parsing & Multi-Model Ingestion.
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
// pdfjs-dist worker import removido; usar URL
import { salvarSimulado } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const MODEL_CANDIDATES = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

/* ═══════════════════════════════════════════
   PROMPT ENGINEERING (Preservado e Adaptado)
   ═══════════════════════════════════════════ */

const generatePromptByTema = (tema) => `You are a Senior Software Engineering Professor.
Create EXACTLY 5 high-fidelity multiple-choice questions about: "${tema}"

RULES:
1. Level: University/Professional
2. 4 alternatives per question (A, B, C, D)
3. Only 1 correct answer
4. Include a technical explanation for the result

RETURN ONLY VALID JSON:
[
  {
    "pergunta": "Technical question here?",
    "opcoes": ["Option A", "Option B", "Option C", "Option D"],
    "correta": 0,
    "explicacao": "Technical root cause analysis."
  }
]`;

const generatePromptByPDF = (textoExtraido) => `You are a System Architect auditing documentation.
Generate EXACTLY 5 multiple-choice questions based ONLY on this documentation:

--- SOURCE_START ---
${textoExtraido}
--- SOURCE_END ---

RULES:
1. Questions must be 100% based on the text above.
2. 4 alternatives, 1 correct.
3. Include deep technical explanation.

RETURN ONLY VALID JSON.`;

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
  const [historicoSalvo, setHistoricoSalvo] = useState(false);
  const [questoes, setQuestoes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fase, setFase] = useState('setup');
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
     PDF & IA LOGIC (Lógica Intacta)
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
      toast.error('Fail_to_Extract_Buffer.');
      throw err;
    } finally { setIsExtractingPdf(false); }
  };

  const generateWithFallback = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch { continue; }
    }
    throw new Error('All_Models_Unavailable');
  };

  const gerarQuestoes = async () => {
    if (activeTab === 'tema' ? !tema.trim() : !pdfText) return;
    setIsLoading(true);
    setError(null);
    try {
      const prompt = activeTab === 'tema' ? generatePromptByTema(tema) : generatePromptByPDF(pdfText);
      if (activeTab === 'arquivo' && pdfFile) setTema(pdfFile.name.replace('.pdf',''));
      
      const response = await generateWithFallback(prompt);
      let cleaned = response.replace(/```json\s*|```/gi, '').trim();
      const start = cleaned.indexOf('[');
      const end = cleaned.lastIndexOf(']');
      const parsed = JSON.parse(cleaned.substring(start, end + 1));
      
      setQuestoes(parsed);
      setFase('quiz');
      setCurrentIndex(0);
      setRespostas({});
      setHasAnswered(false);
      if (timerDuration > 0) { setTimeLeft(timerDuration * 60); setTimerActive(true); }
    } catch {
      setError('Telemetria_Error: IA retornou formato inválido.');
    } finally { setIsLoading(false); }
  };

  const selecionarResposta = (idx) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);
    setRespostas(prev => ({ ...prev, [currentIndex]: idx }));
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
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm overflow-hidden"
            >
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-10 max-w-sm mx-auto shadow-inner">
                {['tema', 'arquivo'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-xl' : 'text-slate-500'}`}
                  >
                    {tab === 'tema' ? 'By_Topic' : 'By_Document'}
                  </button>
                ))}
              </div>

              <div className="space-y-10">
                {activeTab === 'tema' ? (
                  <div className="space-y-6">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Input_System_Topic</label>
                    <input type="text" placeholder="Ex: Microservices Architecture..." value={tema} onChange={e => setTema(e.target.value)}
                      className="w-full h-16 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[20px] px-6 text-xl font-bold focus:border-indigo-500 outline-none transition-all shadow-inner"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {temasSugeridos.slice(0, 6).map(t => (
                        <button key={t} onClick={() => setTema(t)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 hover:bg-indigo-500 hover:text-white transition-all">#{t}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-[32px] p-16 text-center cursor-pointer transition-all ${isDragOver ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'}`}>
                      <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => handleFileSelect(e.target.files[0])} className="hidden" />
                      {!pdfFile ? (
                        <>
                          <Upload size={40} className="mx-auto text-slate-300 mb-4" />
                          <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Drop_PDF_Or_Click</p>
                        </>
                      ) : (
                        <div className="flex items-center justify-center gap-4">
                           <FileText size={32} className="text-cyan-500" />
                           <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{pdfFile.name}</span>
                           {isExtractingPdf && <Loader2 className="animate-spin text-indigo-500" />}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-4 block">Simulation_Time</label>
                  <div className="grid grid-cols-4 gap-4">
                    {TIMER_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setTimerDuration(opt.value)}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${timerDuration === opt.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500'}`}
                      >
                        <span className="text-lg font-black font-mono">{opt.label}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={gerarQuestoes} disabled={isLoading || isExtractingPdf} className="w-full h-16 bg-indigo-600 !rounded-[20px] font-black uppercase tracking-[0.2em] text-[13px] shadow-2xl shadow-indigo-600/20">
                  {isLoading ? 'Compiling_Suite...' : 'Execute_Deployment'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── QUIZ PHASE (The Probe) ─── */}
        {fase === 'quiz' && questaoAtual && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] shadow-sm">
               <div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">Suite_Progress</span>
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
                  <span className="flex items-center gap-2 text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4"><Zap size={14} /> Probe_Unit_{currentIndex + 1}</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight italic tracking-tighter uppercase">{questaoAtual.pergunta}</h3>
               </div>
               <div className="p-10 space-y-4">
                  {questaoAtual.opcoes.map((opt, idx) => {
                    const showFeedback = hasAnswered;
                    const isCorrect = questaoAtual.correta === idx;
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
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Doc_Resolution</p>
                          <p className="text-[16px] font-medium leading-relaxed">{questaoAtual.explicacao}</p>
                        </div>
                      </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div className="flex justify-between items-center">
               <button onClick={questaoAnterior} disabled={currentIndex === 0} className="h-14 px-8 rounded-2xl bg-white dark:bg-slate-900 text-slate-500 font-black uppercase tracking-widest text-[11px] border-2 disabled:opacity-20 transition-all hover:border-slate-300">Back_Step</button>
               <Button onClick={proximaQuestao} disabled={!hasAnswered} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-16 !rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl">
                 {currentIndex === questoes.length - 1 ? 'Execute_Report' : 'Next_Unit'} <ArrowRight size={18} className="ml-3" />
               </Button>
            </div>
          </motion.div>
        )}

        {/* ─── RESULT PHASE (Deployment Report) ─── */}
        {fase === 'resultado' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-slate-900 border-2 border-white/5 rounded-[42px] p-16 text-center shadow-2xl relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-2 ${percentual >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
              className={`w-32 h-32 rounded-[32px] mx-auto mb-10 flex items-center justify-center shadow-2xl ${percentual >= 80 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
            >
              <Trophy size={64} className="text-white" />
            </motion.div>

            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">Final_Report</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mb-12">Suite Execution Completed</p>

            <div className="grid grid-cols-2 gap-6 mb-12">
               <div className="bg-black/40 p-8 rounded-[28px] border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Success_Index</p>
                  <p className={`text-5xl font-black font-mono tracking-tighter ${percentual >= 80 ? 'text-emerald-500' : 'text-indigo-400'}`}>{percentual}%</p>
               </div>
               <div className="bg-black/40 p-8 rounded-[28px] border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Units_Validated</p>
                  <p className="text-5xl font-black text-white font-mono tracking-tighter">{acertos}<span className="text-2xl text-slate-600">/</span>{questoes.length}</p>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
               <Button onClick={reiniciar} variant="secondary" className="flex-1 h-16 !rounded-[20px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[11px] hover:bg-white/10">Re_Initialize</Button>
               <Button onClick={novoSimulado} className="flex-[1.5] h-16 !rounded-[20px] bg-indigo-600 font-black uppercase tracking-widest text-[11px] shadow-2xl">Run_Again ({tema.slice(0,10)}...)</Button>
            </div>
            
            <button onClick={() => navigate('/historico-simulados')} className="mt-10 flex items-center gap-2 mx-auto text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors">
              <History size={16} /> Audit_History_Logs
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