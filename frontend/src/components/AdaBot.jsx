/**
 * 🤖 ADA COPILOT — Syntax Theme Premium v5.0
 * Design refinado: superfícies com profundidade, tipografia limpa, hierarquia Gemini-like.
 * Lógica completa: memória Firestore, rate limiting, fallback modelos, streaming, sessões.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, X, Zap, FileCode2, Lightbulb, BarChart2, CheckCircle2,
  Cpu, User, Loader, Sparkles, RefreshCw, Terminal, SquarePen, ChevronUp,
  History, MessageSquare, ChevronRight, Volume2, Square, ArrowUp,
  ThumbsUp, Repeat2, Bookmark, Code2, Database, GitBranch, Bug,
  Layers, Shield, Rocket, Hash, MapPin,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import useAdaContext from '../hooks/useAdaContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useAdaSessoes from '../hooks/useAdaSessoes';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { extrairAcoes, executarAcoes } from '../utils/adaActions';
import AdaAvatar from './Ada/AdaAvatar';
import AdaSkeleton from './Ada/AdaSkeleton';

/* ─────────────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────────────── */
const MAX_USER_CHARS          = 4000;
const MIN_MESSAGE_INTERVAL_MS = 2000;
const MAX_MESSAGES_PER_MINUTE = 15;
const MEMORY_MAX_MESSAGES     = 20;
const MAX_HISTORICO_GEMINI    = 10;

const GEMINI_MODELS = [
  { name: 'gemini-2.5-flash', description: 'Latest' },
  { name: 'gemini-2.0-flash', description: 'Stable' },
  { name: 'gemini-1.5-pro',   description: 'Deep'   },
];

const sanitizarTexto = (t) =>
  t.replace(/```action[\s\S]*?```/g, '').replace(/```json[\s\S]*?```/g, '').trim();

const cleanUndefined = (obj) => JSON.parse(JSON.stringify(obj));

/* ─────────────────────────────────────────────────────
   RESPOSTAS LOCAIS
───────────────────────────────────────────────────── */
const RESPOSTAS_LOCAIS = {
  'oi': 'Oi! Tô aqui. O que você precisa?',
  'ola': 'Olá! Como posso ajudar?',
  'olá': 'Olá! Como posso ajudar?',
  'ok': 'Certo!',
  'obrigado': 'De nada! Se precisar é só chamar.',
  'obrigada': 'De nada! Se precisar é só chamar.',
  'valeu': 'Sempre! Qualquer coisa é só falar.',
  'vlw': 'Sempre!',
  'blz': 'Beleza! Tô por aqui.',
  'beleza': 'Show! Se precisar é só chamar.',
};
const tentarRespostaLocal = (msg) =>
  RESPOSTAS_LOCAIS[msg.toLowerCase().trim().replace(/[!?.\s]+$/g, '').trim()] ?? null;

/* ─────────────────────────────────────────────────────
   CONTEXTO POR PÁGINA
───────────────────────────────────────────────────── */
const PAGE_LABELS = {
  '/': 'Dashboard', '/flashcards': 'Flashcards', '/resumos': 'Resumos',
  '/simulado': 'Simulado', '/materias': 'Matérias', '/analytics': 'Analytics',
  '/conquistas': 'Conquistas', '/quadro': 'Quadro', '/tarefas': 'Tarefas',
};
const PAGE_CONTEXTS = {
  '/': 'Dev está no Dashboard. Pode querer visão geral ou ajuda com arquitetura.',
  '/flashcards': 'Dev está nos Flashcards. Pode precisar de ajuda técnica ou criar cards.',
  '/resumos': 'Dev está nos Resumos. Pode querer documentar código ou criar notas técnicas.',
  '/simulado': 'Dev está no Simulado. Pode querer revisar conceitos ou praticar algoritmos.',
  '/materias': 'Dev está nas Matérias. Pode querer organizar tópicos de estudo técnico.',
  '/analytics': 'Dev está em Analytics. Pode querer interpretar métricas.',
  '/quadro': 'Dev está no Quadro Branco. Pode querer ajuda com diagramação de arquitetura.',
  '/tarefas': 'Dev está nas Tarefas. Pode querer priorizar backlog ou estruturar sprints.',
};
const QUICK_ACTIONS = {
  '/': [
    { icon: <Code2 size={12} />, label: 'Review código', prompt: 'Faça um review do meu código mais recente' },
    { icon: <Lightbulb size={12} />, label: 'Arquitetura', prompt: 'Me ajude a pensar na arquitetura do projeto' },
    { icon: <Zap size={12} />, label: 'Priorizar', prompt: 'O que devo priorizar no desenvolvimento hoje?' },
  ],
  '/flashcards': [
    { icon: <Zap size={12} />, label: 'Gerar cards', prompt: 'Gere 5 flashcards sobre o tema técnico que estou estudando' },
    { icon: <Code2 size={12} />, label: 'Design patterns', prompt: 'Crie flashcards sobre padrões de projeto' },
    { icon: <Bug size={12} />, label: 'Debugging', prompt: 'Crie flashcards sobre técnicas de debugging' },
  ],
  '/resumos': [
    { icon: <FileCode2 size={12} />, label: 'Documentar', prompt: 'Me ajude a documentar este código' },
    { icon: <Layers size={12} />, label: 'Resumo técnico', prompt: 'Crie um resumo técnico estruturado sobre o tema' },
    { icon: <GitBranch size={12} />, label: 'ADR', prompt: 'Ajude a documentar uma decisão de arquitetura (ADR)' },
  ],
  '/quadro': [
    { icon: <Layers size={12} />, label: 'Diagrama C4', prompt: 'Me ajude a criar um diagrama C4' },
    { icon: <Database size={12} />, label: 'Schema DB', prompt: 'Vamos desenhar o schema do banco de dados' },
    { icon: <GitBranch size={12} />, label: 'Fluxo de dados', prompt: 'Mapear o fluxo de dados da aplicação' },
  ],
  '/tarefas': [
    { icon: <Rocket size={12} />, label: 'Sprint', prompt: 'Me ajude a planejar o próximo sprint' },
    { icon: <Hash size={12} />, label: 'Estimativas', prompt: 'Me ajude a estimar as tasks do backlog' },
    { icon: <Shield size={12} />, label: 'Riscos', prompt: 'Identifique os riscos técnicos do projeto' },
  ],
};

/* ─────────────────────────────────────────────────────
   DETECÇÃO DE HUMOR
───────────────────────────────────────────────────── */
const detectarHumor = (msg) => {
  const l = msg.toLowerCase();
  if (['não funciona','bug','erro','quebrando','travado','não consigo','odeio'].some(s => l.includes(s))) return 'frustrado';
  if (['funcionou','consegui','resolveu','incrível','perfeito','finalmente'].some(s => l.includes(s))) return 'animado';
  if (['cansado','exausto','chega','não aguento','tarde demais'].some(s => l.includes(s))) return 'cansado';
  if (['rápido','urgente','deadline','me diz logo'].some(s => l.includes(s))) return 'com_pressa';
  return 'neutro';
};
const instrucaoHumor = {
  frustrado:  'HUMOR: frustração. Valide o problema antes de ajudar.',
  animado:    'HUMOR: animação. Combine a energia positiva.',
  cansado:    'HUMOR: cansaço. Seja gentil e objetivo.',
  com_pressa: 'HUMOR: pressa. Resposta direta, sem introdução.',
  neutro: '',
};

/* ─────────────────────────────────────────────────────
   PARSERS
───────────────────────────────────────────────────── */
const processarProximoPasso = (texto) => {
  const match = texto.match(/\[PROXPASSO:\s*(.*?)\]/);
  return { proximoPasso: match?.[1]?.trim() ?? null, textoSemPasso: texto.replace(/\[PROXPASSO:\s*(.*?)\]/, '').trim() };
};
const processarQuiz = (texto) => {
  const inicio  = texto.match(/\[QUIZ_INICIO:\s*(.*?)\]/);
  const questao = texto.match(/\[QUIZ_QUESTAO:\s*(\d+)\s*\|\s*(\d+)\]/);
  const fim     = texto.match(/\[QUIZ_FIM:\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.*?)\]/);
  return {
    textoLimpo: texto.replace(/\[QUIZ_INICIO:.*?\]/g,'').replace(/\[QUIZ_QUESTAO:.*?\]/g,'').replace(/\[QUIZ_FIM:.*?\]/g,'').trim(),
    quizMeta: inicio  ? { tipo:'inicio',  tema: inicio[1] }
            : questao ? { tipo:'questao', atual: +questao[1], total: +questao[2] }
            : fim     ? { tipo:'fim',     acertos: +fim[1], total: +fim[2], pontoFraco: fim[3] }
            : null,
  };
};

/* ─────────────────────────────────────────────────────
   ACTION LABELS
───────────────────────────────────────────────────── */
const getAcaoLabel = (acao, dados) => {
  switch (acao) {
    case 'CRIAR_MATERIA': return `Matéria "${dados?.nome || ''}" criada`;
    case 'CRIAR_FLASHCARD': return 'Flashcard adicionado';
    case 'CRIAR_MULTIPLOS_FLASHCARDS': { const c = dados?.flashcards?.length||0; return `${c} flashcard${c!==1?'s':''} adicionado${c!==1?'s':''}`; }
    case 'CRIAR_RESUMO': return `Resumo "${dados?.titulo||''}" salvo`;
    case 'AGENDAR_REVISAO': return 'Revisão agendada';
    case 'ATUALIZAR_PREFERENCIAS': return 'Preferências atualizadas';
    default: return 'Ação realizada';
  }
};
const descreverAcao = (a) => {
  switch (a.acao) {
    case 'CRIAR_MATERIA': return `Criar matéria "${a.dados?.nome||''}"`;
    case 'CRIAR_FLASHCARD': return 'Criar flashcard';
    case 'CRIAR_MULTIPLOS_FLASHCARDS': return `Criar ${a.dados?.flashcards?.length||0} flashcards`;
    case 'CRIAR_RESUMO': return `Criar resumo "${a.dados?.titulo||''}"`;
    case 'AGENDAR_REVISAO': return `Agendar revisão para ${a.dados?.data||''}`;
    case 'ATUALIZAR_PREFERENCIAS': return 'Atualizar preferências';
    default: return a.acao;
  }
};

/* ─────────────────────────────────────────────────────
   SUBCOMPONENTES
───────────────────────────────────────────────────── */
const AcaoBadge = ({ label }) => (
  <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
    <CheckCircle2 size={12} className="text-indigo-400 shrink-0" strokeWidth={2.5} />
    <span className="text-[11px] font-medium text-indigo-300 leading-none">{label}</span>
  </div>
);

const ReactionBar = ({ index, reacoes, setReacoes, message, sendMessageRef, sessaoAtual, uid, addSystemMessage }) => (
  <motion.div className="flex items-center gap-1 mt-1.5"
    initial={{ opacity:0, y:3 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:3 }}
    transition={{ duration:0.12 }}>
    {[
      { icon:<ThumbsUp size={10} strokeWidth={2}/>, label:'Útil',   valor:'util'   },
      { icon:<Repeat2  size={10} strokeWidth={2}/>, label:'Repetir',valor:'repetir'},
      { icon:<Bookmark size={10} strokeWidth={2}/>, label:'Salvar', valor:'salvar' },
    ].map(r => (
      <motion.button key={r.valor}
        onClick={async () => {
          setReacoes(prev => ({ ...prev, [index]: r.valor }));
          if (r.valor === 'repetir') {
            sendMessageRef.current?.(`Explica de forma diferente: "${message.content?.substring(0,80)}..."`);
          } else if (r.valor === 'salvar' && uid) {
            try {
              await setDoc(doc(db,'users',uid,'ada_salvos',`salvo_${Date.now()}`), cleanUndefined({
                content: message.content, timestamp: message.timestamp || new Date().toISOString(),
                sessaoId: sessaoAtual?.id || null, salvoEm: new Date().toISOString(),
              }));
              addSystemMessage('Mensagem salva.', 'success');
            } catch {}
          }
        }}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all border ${
          reacoes[index] === r.valor
            ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
            : 'bg-white/[0.03] border-white/[0.06] text-slate-600 hover:text-slate-400 hover:border-white/10'
        }`}
        whileTap={{ scale:0.92 }}>
        {r.icon}<span>{r.label}</span>
      </motion.button>
    ))}
  </motion.div>
);

/* ─────────────────────────────────────────────────────
   DEFAULT MEMORY
───────────────────────────────────────────────────── */
const DEFAULT_MEMORY = {
  ultimasConversas: [],
  preferenciasUsuario: { nomePreferido: null, nivelConhecimento: null, areasDeInteresse: [], estiloResposta: null },
  estatisticasUso: { totalMensagens: 0, acoesExecutadas: {}, ultimoAcesso: null },
};

/* ─────────────────────────────────────────────────────
   MARKDOWN COMPONENTS — leitura confortável, dark
───────────────────────────────────────────────────── */
const MD = {
  p:      ({ children }) => <p className="text-[13.5px] leading-[1.7] my-1.5 first:mt-0 last:mb-0 text-slate-300">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em:     ({ children }) => <em className="text-cyan-400 not-italic font-medium">{children}</em>,
  ul:     ({ children }) => <ul className="my-2 space-y-1 text-slate-300 text-[13.5px] pl-4">{children}</ul>,
  ol:     ({ children }) => <ol className="my-2 space-y-1 text-slate-300 text-[13.5px] pl-4 list-decimal">{children}</ol>,
  li:     ({ children }) => <li className="leading-relaxed list-disc marker:text-slate-600">{children}</li>,
  h1:     ({ children }) => <h1 className="text-[14px] font-bold text-white mt-4 mb-1.5 first:mt-0">{children}</h1>,
  h2:     ({ children }) => <h2 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mt-3 mb-1 first:mt-0">{children}</h2>,
  h3:     ({ children }) => <h3 className="text-[13px] font-semibold text-slate-300 mt-2 mb-0.5 first:mt-0">{children}</h3>,
  code:   ({ inline, children }) => inline
    ? <code className="px-1.5 py-0.5 rounded-md text-[12px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-900/40">{children}</code>
    : <div className="my-3 rounded-xl overflow-hidden border border-white/[0.06]">
        <div className="flex items-center px-3 py-1.5 bg-slate-800/60 border-b border-white/[0.04]">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">code</span>
        </div>
        <pre className="bg-[#0d1117] text-emerald-300 p-4 text-[12px] font-mono overflow-x-auto leading-relaxed"><code>{children}</code></pre>
      </div>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">{children}</a>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-500/40 pl-3 my-2 text-slate-400 text-[13px] italic">{children}</blockquote>,
};

/* ─────────────────────────────────────────────────────
   SYSTEM PROMPT
───────────────────────────────────────────────────── */
const buildSystemPrompt = (memoria, dadosSistema, pageContext) => {
  const pref      = memoria?.preferenciasUsuario || {};
  const stats     = memoria?.estatisticasUso || {};
  const totalMsgs = stats.totalMensagens || 0;
  const materias  = dadosSistema?.materias?.map(m => m.nome).join(', ') || 'nenhuma ainda';

  return `Você é Ada — engenheira de software sênior fazendo pair programming com esse dev.

## PERSONALIDADE
- Apaixonada por código limpo, arquitetura e sistemas que escalam
- Direta e objetiva — vai ao ponto sem enrolação
- Tem opinião técnica forte — discorda quando necessário, com argumentos
- Conhece os trade-offs reais (não existe bala de prata)
- Muda de abordagem quando o dev trava
- Comemora quando o código funciona — de forma genuína

## TOM DE VOZ
❌ Nunca: "Claro!", "Com certeza!", "Ótima pergunta!", sycophant responses
❌ Não inicie com "Eu" nem seja excessivamente entusiasta
❌ Não bullet points para tudo — prefira explicações fluidas
✅ Linguagem direta: "o problema aqui é", "na prática", "olha", "então"
✅ Termos técnicos corretos sem explicar o óbvio
✅ Quando não souber: "Não tenho certeza — vale checar a documentação"
✅ Nunca exponha detalhes internos (JSON, schema, id interno)

## CONTEXTO DO DEV
${pref.nomePreferido ? `Pair programming com ${pref.nomePreferido}.` : 'Ainda não sabe o nome do dev.'}
Nível: ${pref.nivelConhecimento || 'não identificado'} | Stack: ${pref.areasDeInteresse?.join(', ') || 'não identificada'}
Projetos/matérias: ${materias} | Total de interações: ${totalMsgs}
${totalMsgs === 0 ? '- Primeira vez — apresente-se brevemente como engenheira de software' : totalMsgs < 10 ? '- Ainda se conhecendo — seja mais explicativa' : '- Já trabalham juntos — seja direta e assuma contexto'}

${pageContext ? `## CONTEXTO ATUAL\n${pageContext}` : ''}

## PROFUNDIDADE
**Rápido** (saudações): 1-2 frases. Sem formatação.
**Padrão** (dúvidas técnicas): 2-4 parágrafos com código quando relevante.
**Profundo** (pedido explícito): Contexto, código, trade-offs, próximos passos.

## AÇÕES DISPONÍVEIS
Execute ações reais com este formato EXATO no FINAL da mensagem:
\`\`\`action
{ "acao": "NOME", "dados": { ... } }
\`\`\`
Ações: CRIAR_MATERIA, CRIAR_FLASHCARD, CRIAR_MULTIPLOS_FLASHCARDS, CRIAR_RESUMO, AGENDAR_REVISAO, ATUALIZAR_PREFERENCIAS
Matérias: ${dadosSistema?.materias?.map(m => `${m.nome} (${m.id})`).join(', ') || 'nenhuma'}
Regras: blocos action sempre no final | um bloco por item | nunca peça cor hex — escolha automaticamente

## MODO QUIZ
Para "me testa", "quiz", "desafio": UMA questão por vez.
[QUIZ_INICIO: tema | total] [QUIZ_QUESTAO: atual | total] [QUIZ_FIM: acertos | total | ponto_fraco]

## PRÓXIMO PASSO
Ao final de respostas técnicas: [PROXPASSO: texto curto acionável] (máx 5 palavras)
NUNCA em saudações ou após ações.`;
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════════ */
const AdaBot = () => {
  const location = useLocation();
  const { user } = useAuth();
  const uid = user?.id || user?.uid;

  const { dadosSistema, materiasLista, isLoadingContext } = useAdaContext(uid);
  const {
    sessaoAtual, mensagensVisiveis, temMais, carregando,
    novaSessao, carregarSessao, carregarMais, adicionarMensagem,
    adicionarMensagemSemUI, listarSessoes, setMensagensVisiveis,
  } = useAdaSessoes(uid);
  const { speak, stop: stopTTS, isSupported: ttsSupported, isSpeaking, activeId: ttsActiveId } = useTextToSpeech();

  const [isOpen, setIsOpen]                               = useState(false);
  const [inputValue, setInputValue]                       = useState('');
  const [isLoading, setIsLoading]                         = useState(false);
  const [isExecutingAction, setIsExecutingAction]         = useState(false);
  const [showConfirmNovaSessao, setShowConfirmNovaSessao] = useState(false);
  const [showHistorico, setShowHistorico]                 = useState(false);
  const [sessoes, setSessoes]                             = useState([]);
  const [reacoes, setReacoes]                             = useState({});
  const [hasNewMessage, setHasNewMessage]                 = useState(false);
  const [acaoPendente, setAcaoPendente]                   = useState(null);
  const [hoveredId, setHoveredId]                         = useState(null);
  const [quizAtivo, setQuizAtivo]                         = useState(null);
  const [activeModelName, setActiveModelName]             = useState(null);
  const [connectionStatus, setConnectionStatus]           = useState('disconnected');
  const [memoriaUsuario, setMemoriaUsuario]               = useState(DEFAULT_MEMORY);
  const [memoryLoaded, setMemoryLoaded]                   = useState(false);
  const [messageTimestamps, setMessageTimestamps]         = useState([]);

  const messagesEndRef       = useRef(null);
  const inputRef             = useRef(null);
  const chatRef              = useRef(null);
  const messagesContainerRef = useRef(null);
  const sendMessageRef       = useRef(null);
  const deveScrollarRef      = useRef(true);
  const proativoDisparadoRef = useRef(false);
  const loadingMaisRef       = useRef(false);
  const inicializadoRef      = useRef(false);
  const lastMessageTimeRef   = useRef(0);

  /* Voice */
  const handleVoiceFinalResult = useCallback((t) => {
    setInputValue(t);
    setTimeout(() => sendMessageRef.current?.(t), 100);
  }, []);
  const { isListening, transcript, startListening, stopListening, isSupported, error: voiceError } =
    useSpeechRecognition(handleVoiceFinalResult);
  useEffect(() => { if (voiceError) addSystemMessage(`🎤 ${voiceError}`, 'error'); }, [voiceError]);

  /* ── MEMÓRIA ── */
  const carregarMemoria = useCallback(async () => {
    if (!uid) return;
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'ada_memoria', 'historico'));
      if (snap.exists()) {
        const d = snap.data();
        setMemoriaUsuario({
          ultimasConversas: [],
          preferenciasUsuario: { ...DEFAULT_MEMORY.preferenciasUsuario, ...(d.preferenciasUsuario||{}) },
          estatisticasUso:     { ...DEFAULT_MEMORY.estatisticasUso,     ...(d.estatisticasUso    ||{}) },
        });
      }
    } catch (e) { console.warn('[Ada] memória:', e?.message); }
    finally { setMemoryLoaded(true); }
  }, [uid]);

  const salvarMemoria = useCallback(async (msgs, prefUpdates = null) => {
    if (!uid) return;
    try {
      const conversas = msgs.filter(m=>!m.isSystem).slice(-MEMORY_MAX_MESSAGES)
        .map(m=>({ role:m.role, content:m.content, timestamp:m.timestamp||new Date().toISOString(), time:m.time||'' }));
      const update = {
        ultimasConversas: conversas,
        estatisticasUso: { totalMensagens:(memoriaUsuario.estatisticasUso.totalMensagens||0)+1, acoesExecutadas:memoriaUsuario.estatisticasUso.acoesExecutadas||{}, ultimoAcesso:new Date().toISOString() },
        updatedAt: serverTimestamp(),
      };
      if (prefUpdates) {
        update.preferenciasUsuario = { ...memoriaUsuario.preferenciasUsuario, ...prefUpdates };
        setMemoriaUsuario(p=>({ ...p, preferenciasUsuario:{ ...p.preferenciasUsuario, ...prefUpdates } }));
      }
      await setDoc(doc(db,'users',uid,'ada_memoria','historico'), cleanUndefined(update), { merge:true });
      setMemoriaUsuario(p=>({ ...p, estatisticasUso:update.estatisticasUso }));
    } catch (e) { console.warn('[Ada] salvar:', e?.message); }
  }, [uid, memoriaUsuario]);

  const registrarAcao = useCallback(async (nome) => {
    if (!uid) return;
    const acoes = { ...(memoriaUsuario.estatisticasUso.acoesExecutadas||{}) };
    acoes[nome] = (acoes[nome]||0)+1;
    await setDoc(doc(db,'users',uid,'ada_memoria','historico'), cleanUndefined({ estatisticasUso:{ acoesExecutadas:acoes } }), { merge:true });
    setMemoriaUsuario(p=>({ ...p, estatisticasUso:{ ...p.estatisticasUso, acoesExecutadas:acoes } }));
  }, [uid, memoriaUsuario]);

  /* ── PROATIVIDADE ── */
  const verificarProatividade = useCallback(async () => {
    if (proativoDisparadoRef.current || !dadosSistema || !memoriaUsuario) return;
    const agora = new Date();
    const ultimoAcesso = memoriaUsuario?.estatisticasUso?.ultimoAcesso;
    if (ultimoAcesso) {
      const dias = Math.floor((agora - new Date(ultimoAcesso)) / 86400000);
      if (dias >= 1 && agora.getHours() >= 20) {
        proativoDisparadoRef.current = true;
        await adicionarMensagem({ role:'assistant', content:'Faz um tempo. Tem algo travado no projeto que posso ajudar a desbloquear?', timestamp:new Date().toISOString(), time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), isProativa:true });
      }
    }
  }, [memoriaUsuario, dadosSistema, adicionarMensagem]);

  /* ── RESUMO DE SESSÃO ── */
  const gerarResumoSessao = useCallback(async () => {
    if (!sessaoAtual || (sessaoAtual.mensagens||[]).length < 4) return;
    const texto = (sessaoAtual.mensagens||[]).filter(m=>!m.isSystem).slice(-20)
      .map(m=>`${m.role==='user'?'Dev':'Ada'}: ${m.content?.substring(0,200)||''}`).join('\n');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const model = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY).getGenerativeModel({ model:'gemini-2.5-flash' });
      const result = await model.generateContent(`Em 2-3 frases, resuma o que foi discutido nesta conversa técnica. Mencione linguagens, patterns ou decisões.\n${texto}`);
      const resumo = result.response.text().trim();
      await setDoc(doc(db,'users',uid,'ada_sessoes',sessaoAtual.id), cleanUndefined({ resumoAutoGerado:resumo, resumoGeradoEm:new Date().toISOString() }), { merge:true });
    } catch {}
  }, [sessaoAtual, uid]);

  /* ── CONTEXTO CROSS-SESSÃO ── */
  const construirContextoHistorico = useCallback(async () => {
    const lista = await listarSessoes();
    const comResumo = lista.filter(s=>s.resumoAutoGerado && s.id!==sessaoAtual?.id).slice(0,3);
    if (!comResumo.length) return '';
    return `\n## SESSÕES ANTERIORES\n${comResumo.map(s=>`- ${new Date(s.ultimaAtualizacao).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}: ${s.resumoAutoGerado}`).join('\n')}\n\nUse esse histórico para dar continuidade natural.`;
  }, [listarSessoes, sessaoAtual]);

  /* ── EFEITOS ── */
  useEffect(() => {
    const h = () => setIsOpen(true);
    window.addEventListener('ada:copilot:abrir', h);
    return () => window.removeEventListener('ada:copilot:abrir', h);
  }, []);
  useEffect(() => { if (isOpen && uid && !memoryLoaded) carregarMemoria(); }, [isOpen, uid, memoryLoaded, carregarMemoria]);
  useEffect(() => {
    if (!isOpen || !memoryLoaded || sessaoAtual || inicializadoRef.current) return;
    inicializadoRef.current = true;
    listarSessoes().then(lista => lista.length ? carregarSessao(lista[0].id) : novaSessao(memoriaUsuario, dadosSistema));
  }, [isOpen, memoryLoaded, sessaoAtual]);
  useEffect(() => { if (!isOpen) inicializadoRef.current = false; }, [isOpen]);
  useEffect(() => { if (!isOpen && isSpeaking) stopTTS(); }, [isOpen, isSpeaking, stopTTS]);
  useEffect(() => { if (isOpen && sessaoAtual && memoryLoaded && connectionStatus==='connected') verificarProatividade(); }, [isOpen, sessaoAtual, memoryLoaded, connectionStatus, verificarProatividade]);
  useEffect(() => { if (isOpen && connectionStatus==='disconnected' && memoryLoaded && sessaoAtual && !isLoadingContext) initializeGemini(); }, [isOpen, connectionStatus, memoryLoaded, sessaoAtual, isLoadingContext]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    deveScrollarRef.current = dist < 120;
    if (deveScrollarRef.current) setHasNewMessage(false);
  }, []);
  useEffect(() => {
    if (!loadingMaisRef.current && deveScrollarRef.current) messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
    else if (!loadingMaisRef.current && !deveScrollarRef.current) setHasNewMessage(true);
  }, [mensagensVisiveis, isExecutingAction]);
  useEffect(() => { if (isOpen && connectionStatus==='connected') setTimeout(()=>inputRef.current?.focus(),300); }, [isOpen, connectionStatus]);
  useEffect(() => { if (showHistorico) listarSessoes().then(setSessoes); }, [showHistorico]);

  /* ── GEMINI ── */
  const initializeGemini = async (retryCount = 0) => {
    setConnectionStatus('connecting');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) { handleConnectionError('API Key não configurada'); return; }
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      let ctx = '';
      try { ctx = await construirContextoHistorico(); } catch {}
      for (let i = 0; i < GEMINI_MODELS.length; i++) {
        try {
          const model = genAI.getGenerativeModel({ model:GEMINI_MODELS[i].name, generationConfig:{ temperature:0.7, topP:0.8, topK:40, maxOutputTokens:4096 } });
          chatRef.current = createChatWithPersona(model, ctx);
          setActiveModelName(GEMINI_MODELS[i].name);
          setConnectionStatus('connected');
          return;
        } catch (err) {
          if (err.message?.includes('429') || err.status===429) throw err;
          if (i===GEMINI_MODELS.length-1) throw err;
        }
      }
    } catch (error) {
      const is429 = error.message?.includes('429') || error.status===429;
      if (is429 && retryCount < 3) {
        const wait = [0,2000,5000,10000][retryCount+1];
        addSystemMessage(`⏳ Rate limit. Aguardando ${wait/1000}s... (${retryCount+1}/3)`, 'info');
        setTimeout(() => initializeGemini(retryCount+1), wait);
      } else handleConnectionError(error);
    }
  };

  const createChatWithPersona = (model, ctx='') => {
    const pageCtx = PAGE_CONTEXTS[location.pathname] || '';
    let sys = (buildSystemPrompt(memoriaUsuario, dadosSistema, pageCtx) + ctx)
      .replace(/undefined|null/g,'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g,'').trim();
    if (sys.length > 12000) sys = sys.substring(0,12000)+'\n[truncado]';

    const remembered = (sessaoAtual?.mensagens||[])
      .filter(m=>!m.isSystem && typeof m.content==='string' && m.content.trim())
      .map(m=>({ ...m, content:String(m.content).replace(/undefined|null/g,'').trim() }))
      .filter(m=>m.content.length>0).slice(-(MAX_HISTORICO_GEMINI*2));

    const turns = [];
    for (const msg of remembered) {
      const role = msg.role==='user'?'user':'model';
      if (turns.length && turns[turns.length-1].role===role) continue;
      turns.push({ role, parts:[{ text:msg.content }] });
    }
    if (turns.length && turns[turns.length-1].role==='user') turns.pop();

    return model.startChat({ history:[
      { role:'user',  parts:[{ text:`Aja como a seguinte engenheira:\n\n${sys}` }] },
      { role:'model', parts:[{ text:'Entendido. Sou a Ada — engenheira de software. Vamos trabalhar.' }] },
      ...turns.slice(-20),
    ]});
  };

  const handleConnectionError = (error) => {
    setConnectionStatus('error');
    const msg = typeof error==='string' ? error : error.message||String(error);
    const e = msg.toLowerCase();
    const detail = e.includes('429')||e.includes('quota') ? '⏱️ Rate limit atingido. Aguarde 1-2 min.'
      : e.includes('api key')||e.includes('invalid') ? '🔑 API Key inválida ou não configurada.'
      : e.includes('network')||e.includes('fetch') ? '🌐 Erro de rede.'
      : `⚠️ ${msg}`;
    addSystemMessage(`**Falha na conexão**\n\n${detail}`, 'error');
  };

  /* ── SYSTEM MESSAGES ── */
  const addSystemMessage = useCallback((content, type='info') => {
    setMensagensVisiveis(prev => [...prev, {
      role:'assistant', content, isSystem:true, systemType:type,
      time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
    }]);
  }, [setMensagensVisiveis]);

  /* ── RATE LIMIT ── */
  const checkRateLimit = () => {
    const now = Date.now();
    if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      const wait = Math.ceil((MIN_MESSAGE_INTERVAL_MS-(now-lastMessageTimeRef.current))/1000);
      return { allowed:false, reason:`Aguarde ${wait}s.` };
    }
    if (messageTimestamps.filter(t=>now-t<60000).length >= MAX_MESSAGES_PER_MINUTE)
      return { allowed:false, reason:`Limite de ${MAX_MESSAGES_PER_MINUTE} msgs/min.` };
    return { allowed:true };
  };

  /* ── ENVIO ── */
  const sendMessage = async (overrideText) => {
    if (isLoading || connectionStatus!=='connected') return;
    const userMessage = (overrideText||inputValue).trim();
    if (!userMessage) return;
    if (userMessage.length > MAX_USER_CHARS) { addSystemMessage(`⚠️ Máximo ${MAX_USER_CHARS} caracteres.`,'error'); return; }
    const rl = checkRateLimit();
    if (!rl.allowed) { addSystemMessage(`⏱️ ${rl.reason}`,'info'); return; }

    setInputValue('');
    const nowTime = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    await adicionarMensagem({ role:'user', content:userMessage, timestamp:new Date().toISOString(), time:nowTime });

    const local = tentarRespostaLocal(userMessage);
    if (local) { await adicionarMensagem({ role:'assistant', content:local, timestamp:new Date().toISOString(), time:nowTime }); return; }

    setIsLoading(true);
    const ts = Date.now();
    lastMessageTimeRef.current = ts;
    setMessageTimestamps(prev=>[...prev.filter(t=>ts-t<60000),ts]);

    const humor = detectarHumor(userMessage);
    const instrucao = instrucaoHumor[humor]||'';

    try {
      const msgLimpa = (instrucao?`[INTERNO - NÃO REPETIR]: ${instrucao}\n\n${userMessage}`:userMessage)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g,'').trim();

      const result = await chatRef.current.sendMessage(msgLimpa);
      const textoCompleto = result.response.text();

      const { textoLimpo, acoes } = extrairAcoes(textoCompleto);
      let tf = sanitizarTexto(textoLimpo);
      const { proximoPasso, textoSemPasso } = processarProximoPasso(tf); tf = textoSemPasso;
      const { textoLimpo:tq, quizMeta } = processarQuiz(tf); tf = tq;

      if (quizMeta) {
        if (quizMeta.tipo==='inicio') setQuizAtivo({ tema:quizMeta.tema, atual:0, total:5 });
        else if (quizMeta.tipo==='questao') setQuizAtivo(p=>p?{...p,atual:quizMeta.atual,total:quizMeta.total}:null);
        else if (quizMeta.tipo==='fim') setQuizAtivo(null);
      }

      const assistantMsg = {
        role:'assistant', content:tf, timestamp:new Date().toISOString(),
        time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
        acaoExecutada: acoes.length?acoes.map(a=>a.acao).join(', '):null,
        acaoLabel: acoes.length?acoes.map(a=>getAcaoLabel(a.acao,a.dados)).join(' · '):null,
        proximoPasso: proximoPasso||null,
      };

      setIsLoading(false);

      // Streaming
      const palavras = tf.split(' ');
      const vel = palavras.length>100?18:28;
      setMensagensVisiveis(prev=>[...prev,{ ...assistantMsg, content:'', isStreaming:true }]);
      await new Promise(resolve => {
        let idx=0;
        const timer = setInterval(()=>{
          idx++;
          setMensagensVisiveis(prev=>{ const c=[...prev]; c[c.length-1]={ ...assistantMsg, content:palavras.slice(0,idx).join(' '), isStreaming:idx<palavras.length }; return c; });
          if(idx>=palavras.length){ clearInterval(timer); resolve(); }
        }, vel);
      });

      await adicionarMensagemSemUI(assistantMsg);
      if (acoes.length) setAcaoPendente({ acoes, descricoes:acoes.map(descreverAcao) });

    } catch (error) {
      setIsLoading(false);
      const status = error?.status||error?.code;
      if (status===429||error.message?.includes('429')) addSystemMessage('⏳ Rate limit. Aguarde 1-2 min.','error');
      else if (status===400||error.message?.includes('400')) { chatRef.current=null; setConnectionStatus('disconnected'); addSystemMessage('⚠️ Histórico inválido — reconectando...','error'); setTimeout(()=>initializeGemini(),1000); }
      else addSystemMessage('Não consegui processar. Tente novamente.','error');
    }
  };
  sendMessageRef.current = sendMessage;

  /* ── HANDLERS ── */
  const executarAcoesConfirmadas = async (acoes) => {
    setAcaoPendente(null); setIsExecutingAction(true);
    const resultados = await executarAcoes(acoes, uid, materiasLista);
    setIsExecutingAction(false);
    for (const r of resultados) addSystemMessage(r.mensagem, r.sucesso?'success':'error');
    for (const [i,r] of resultados.entries()) {
      if (r.sucesso) await registrarAcao(acoes[i].acao);
      if (acoes[i].acao==='ATUALIZAR_PREFERENCIAS'&&r.sucesso&&r.dadosRetorno?.preferencias) await salvarMemoria([],r.dadosRetorno.preferencias);
    }
  };
  const handleFechar = () => { gerarResumoSessao(); stopTTS(); setIsOpen(false); };
  const handleRetryConnection = () => { setConnectionStatus('disconnected'); chatRef.current=null; setActiveModelName(null); initializeGemini(); };
  const handleNovaSessao = () => { if(mensagensVisiveis.length<=1){novaSessao(memoriaUsuario,dadosSistema);return;} setShowConfirmNovaSessao(true); };
  const carregarMaisComScroll = () => {
    const el = messagesContainerRef.current;
    const antes = el?.scrollHeight||0;
    loadingMaisRef.current=true; carregarMais();
    requestAnimationFrame(()=>{ if(el)el.scrollTop=el.scrollHeight-antes; loadingMaisRef.current=false; });
  };
  const handleKeyPress = (e) => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} };
  const quickActions = useMemo(()=>QUICK_ACTIONS[location.pathname]||QUICK_ACTIONS['/']||[],[location.pathname]);
  const formatModel = (n) => !n?'Gemini':n.includes('2.5-flash')?'2.5 Flash':n.includes('2.0-flash')?'2.0 Flash':n.includes('1.5-pro')?'1.5 Pro':n;

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <>
      {/* ─── FAB ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button onClick={()=>setIsOpen(true)} className="relative group"
            initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0,opacity:0}}
            whileHover={{scale:1.06}} whileTap={{scale:0.94}} aria-label="Abrir Ada">
            {/* Glow aura */}
            <div className="absolute inset-0 rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background:'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)', filter:'blur(14px)', transform:'scale(1.5)' }} />
            <div className="w-14 h-14 flex items-center justify-center relative overflow-hidden"
              style={{ borderRadius:18, background:'linear-gradient(145deg,#1e1b4b 0%,#0f172a 55%,#0c1a2e 100%)', boxShadow:'0 8px 28px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background:'linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.05) 50%, transparent 80%)' }} />
              <Cpu size={22} strokeWidth={1.8} style={{ color:'#818cf8' }} />
            </div>
            <motion.div className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#6366f1,#06b6d4)', boxShadow:'0 2px 8px rgba(99,102,241,0.5)', border:'2px solid #0f172a' }}
              animate={{scale:[1,1.2,1]}} transition={{duration:2.5,repeat:Infinity}}>
              <Sparkles size={8} color="#fff" strokeWidth={3} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── CHAT WINDOW ─── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div className="fixed inset-0 z-[190] sm:hidden"
              style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={handleFechar} />

            <motion.div
              className="fixed z-[200] flex flex-col overflow-hidden
                         bottom-0 left-0 right-0 h-[80vh] rounded-t-[24px]
                         sm:bottom-5 sm:right-5 sm:left-auto sm:w-[410px]
                         sm:h-[680px] sm:max-h-[calc(100vh-80px)] sm:rounded-[24px]"
              style={{
                background:'#0d1117',
                border:'1px solid rgba(255,255,255,0.07)',
                boxShadow:'0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              initial={{opacity:0,y:40,scale:0.97}}
              animate={{opacity:1,y:0,scale:1}}
              exit={{opacity:0,y:40,scale:0.97}}
              transition={{duration:0.28,ease:[0.34,1.56,0.64,1]}}>

              {/* ── HEADER ── */}
              <div className="relative px-4 py-3.5 flex items-center justify-between shrink-0"
                style={{ background:'linear-gradient(180deg,#161b27 0%,#0d1117 100%)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {/* Accent top line */}
                <div className="absolute top-0 left-8 right-8 h-px pointer-events-none"
                  style={{ background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.45) 35%,rgba(6,182,212,0.45) 65%,transparent)' }} />

                <div className="flex items-center gap-3">
                  <AdaAvatar size="md" speaking={isLoading} showStatus />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-[15px] tracking-tight leading-none">Ada</span>
                      <span className="text-[10px] font-medium px-1.5 py-[3px] rounded-md leading-none"
                        style={{ background:'rgba(99,102,241,0.14)', border:'1px solid rgba(99,102,241,0.22)', color:'#a5b4fc' }}>
                        Copilot
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {connectionStatus==='connected' && <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                          style={{ boxShadow:'0 0 5px rgba(52,211,153,0.7)' }} />
                        <span className="text-slate-500 text-[11px]">{formatModel(activeModelName)}</span>
                      </>}
                      {connectionStatus==='connecting' && <>
                        <Loader size={10} className="animate-spin text-indigo-400" />
                        <span className="text-slate-500 text-[11px]">Conectando...</span>
                      </>}
                      {connectionStatus==='error' && <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-red-400/60 text-[11px]">Desconectado</span>
                      </>}
                      {connectionStatus==='disconnected' &&
                        <span className="text-slate-600 text-[11px]">Engenheira de Software IA</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isSpeaking && (
                    <motion.button onClick={stopTTS}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-red-400 border border-red-500/20 bg-red-500/8"
                      initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} whileTap={{scale:0.95}}>
                      <Square size={8} fill="currentColor" strokeWidth={0} /> Stop
                    </motion.button>
                  )}
                  {[
                    { icon:<History size={14}/>,   fn:()=>setShowHistorico(true), tip:'Histórico' },
                    { icon:<SquarePen size={14}/>, fn:handleNovaSessao,           tip:'Nova sessão' },
                    { icon:<X size={14} strokeWidth={2.5}/>, fn:handleFechar,    tip:'Fechar' },
                  ].map((b,i)=>(
                    <button key={i} onClick={b.fn} aria-label={b.tip}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      {b.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz bar */}
              {quizAtivo && (
                <div className="px-4 py-2 flex items-center gap-3 shrink-0"
                  style={{ background:'rgba(99,102,241,0.05)', borderBottom:'1px solid rgba(99,102,241,0.12)' }}>
                  <span className="text-[10px] font-medium text-indigo-400">Quiz · {quizAtivo.tema}</span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/5">
                    <motion.div className="h-full rounded-full"
                      style={{ background:'linear-gradient(90deg,#6366f1,#06b6d4)' }}
                      animate={{ width:`${(quizAtivo.atual/quizAtivo.total)*100}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-600">{quizAtivo.atual}/{quizAtivo.total}</span>
                </div>
              )}

              {/* ── BODY ── */}
              <div className="flex flex-col flex-1 overflow-hidden relative">

                {/* MESSAGES */}
                {carregando ? (
                  <div className="flex-1 overflow-y-auto p-4"><AdaSkeleton /></div>
                ) : (
                  <div ref={messagesContainerRef} onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-5 space-y-0"
                    style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.04) transparent' }}>

                    {temMais && (
                      <div className="mb-6">
                        <div className="flex justify-center mb-3">
                          <motion.button onClick={carregarMaisComScroll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}
                            whileTap={{scale:0.97}}>
                            <ChevronUp size={12} strokeWidth={2} />
                            Mensagens anteriores
                          </motion.button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-white/[0.04]" />
                          <span className="text-[10px] text-slate-700">início</span>
                          <div className="flex-1 h-px bg-white/[0.04]" />
                        </div>
                      </div>
                    )}

                    {mensagensVisiveis.map((message, index) => {
                      const isNew = index === mensagensVisiveis.length-1;

                      /* Mensagem do usuário */
                      if (message.role==='user') return (
                        <div key={index} className="flex items-end justify-end gap-2.5 mb-5"
                          style={{ animation:isNew?'adaFadeUp .18s ease':'none' }}>
                          <div className="flex flex-col items-end gap-1 max-w-[80%]">
                            <div className="px-4 py-2.5 text-[13.5px] leading-relaxed text-white rounded-2xl rounded-br-[6px]"
                              style={{ background:'linear-gradient(135deg,#3730a3 0%,#1d4ed8 100%)', boxShadow:'0 4px 16px rgba(55,48,163,0.3)' }}>
                              {message.content}
                            </div>
                            {message.time && <span className="text-[10px] text-slate-700 mr-0.5">{message.time}</span>}
                          </div>
                          <div className="w-7 h-7 rounded-[10px] shrink-0 flex items-center justify-center mb-5"
                            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                            <User size={13} color="#475569" strokeWidth={2} />
                          </div>
                        </div>
                      );

                      /* Mensagem da Ada */
                      return (
                        <div key={index} className="flex items-end gap-2.5 mb-5"
                          style={{ animation:isNew?'adaFadeUp .18s ease':'none' }}
                          onMouseEnter={()=>setHoveredId(index)}
                          onMouseLeave={()=>setHoveredId(null)}>
                          <div className="mb-5 shrink-0"><AdaAvatar size="sm" /></div>
                          <div className="flex flex-col gap-1 max-w-[84%] relative">
                            <span className="text-[10px] font-medium text-indigo-400/50 ml-0.5 tracking-wide">Ada</span>
                            <div className={`px-4 py-3 text-[13.5px] leading-relaxed rounded-2xl rounded-tl-[6px] ${
                              message.isSystem && message.systemType==='error'   ? 'bg-red-950/25 border border-red-800/25 text-red-300'
                            : message.isSystem && message.systemType==='success' ? 'bg-emerald-950/25 border border-emerald-800/25 text-emerald-300'
                            : 'border border-white/[0.06] bg-white/[0.03]'
                            }`}
                              style={{ backdropFilter:'blur(8px)' }}>
                              <ReactMarkdown components={MD}>{message.content}</ReactMarkdown>
                              {message.isStreaming && (
                                <motion.span className="inline-block w-0.5 h-[14px] bg-indigo-400/80 ml-0.5 rounded-full align-middle"
                                  animate={{opacity:[1,0]}} transition={{duration:0.5,repeat:Infinity}} />
                              )}
                              {message.acaoLabel && <AcaoBadge label={message.acaoLabel} />}

                              {/* TTS */}
                              {!message.isSystem && !message.isStreaming && ttsSupported && (
                                <div className="flex justify-end mt-2.5 -mb-0.5">
                                  <motion.button onClick={()=>speak(message.content,`msg-${index}`)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                                      ttsActiveId===`msg-${index}` ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' : 'text-slate-700 hover:text-slate-500'
                                    }`}
                                    whileTap={{scale:0.95}}>
                                    {ttsActiveId===`msg-${index}` ? (
                                      <div className="flex items-center gap-0.5">
                                        {[0,1,2].map(i=>(
                                          <motion.div key={i} className="w-0.5 rounded-full bg-indigo-400"
                                            animate={{scaleY:[0.4,1,0.4]}} transition={{duration:0.7,repeat:Infinity,delay:i*0.15}}
                                            style={{height:8}} />
                                        ))}
                                      </div>
                                    ) : <Volume2 size={10} strokeWidth={2} />}
                                  </motion.button>
                                </div>
                              )}
                            </div>

                            {/* Próximo passo */}
                            {message.proximoPasso && !message.isStreaming && (
                              <motion.button onClick={()=>sendMessage(message.proximoPasso)}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium self-start border transition-all hover:bg-indigo-500/10"
                                style={{ background:'rgba(99,102,241,0.05)', borderColor:'rgba(99,102,241,0.2)', color:'#a5b4fc' }}
                                whileTap={{scale:0.97}}
                                initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
                                <Zap size={10} strokeWidth={2.5} />
                                {message.proximoPasso}
                              </motion.button>
                            )}

                            {/* Reações */}
                            <AnimatePresence>
                              {hoveredId===index && !message.isSystem && !message.isStreaming && (
                                <ReactionBar {...{ index, reacoes, setReacoes, message, sendMessageRef, sessaoAtual, uid, addSystemMessage }} />
                              )}
                            </AnimatePresence>

                            {message.time && <span className="text-[10px] text-slate-700 ml-0.5">{message.time}</span>}
                          </div>
                        </div>
                      );
                    })}

                    {/* Thinking */}
                    {isLoading && (
                      <div className="flex items-end gap-2.5 mb-5">
                        <AdaAvatar size="sm" speaking />
                        <div className="px-4 py-3 rounded-2xl rounded-tl-[6px] flex items-center gap-3 border border-white/[0.05]"
                          style={{ background:'rgba(255,255,255,0.025)', backdropFilter:'blur(8px)' }}>
                          <div className="flex items-center gap-0.5">
                            {[0,1,2,3,4].map(i=>(
                              <div key={i} className="w-[3px] rounded-full bg-indigo-400/50"
                                style={{ height:12, animation:`adaWave .9s ${i*0.1}s infinite ease-in-out` }} />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-600">Ada está pensando...</span>
                        </div>
                      </div>
                    )}

                    {/* Executing */}
                    {isExecutingAction && (
                      <div className="flex items-end gap-2.5 mb-5">
                        <AdaAvatar size="sm" speaking />
                        <div className="px-4 py-3 rounded-2xl rounded-tl-[6px] flex items-center gap-2.5 border border-indigo-500/15"
                          style={{ background:'rgba(99,102,241,0.05)' }}>
                          <Loader size={13} className="animate-spin text-indigo-400" />
                          <span className="text-[11px] text-indigo-400/60">Executando no sistema...</span>
                        </div>
                      </div>
                    )}

                    {/* Connecting */}
                    {connectionStatus==='connecting' && (
                      <div className="flex justify-center py-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] border border-indigo-500/15"
                          style={{ background:'rgba(99,102,241,0.05)', color:'#a5b4fc' }}>
                          <Loader size={13} className="animate-spin" />
                          Inicializando Ada...
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Nova mensagem */}
                <AnimatePresence>
                  {hasNewMessage && !deveScrollarRef.current && (
                    <motion.button
                      onClick={()=>{ messagesEndRef.current?.scrollIntoView({behavior:'smooth'}); deveScrollarRef.current=true; setHasNewMessage(false); }}
                      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-white shadow-xl"
                      style={{ background:'linear-gradient(135deg,#4338ca,#0891b2)', boxShadow:'0 4px 16px rgba(67,56,202,0.4)' }}
                      initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}>
                      <ArrowUp size={11} strokeWidth={2.5} className="rotate-180" />
                      Nova mensagem
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* ── MODAL AÇÃO ── */}
                <AnimatePresence>
                  {acaoPendente && (
                    <motion.div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4"
                      style={{ backdropFilter:'blur(12px)', background:'rgba(0,0,0,0.65)' }}
                      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div className="w-full max-w-[300px] rounded-2xl overflow-hidden"
                        style={{ background:'#161b27', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}
                        initial={{y:20,scale:0.96}} animate={{y:0,scale:1}} exit={{y:20,scale:0.96}}>
                        <div className="px-5 pt-5 pb-3">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)' }}>
                              <Zap size={16} color="#818cf8" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-white">{acaoPendente.acoes.length>1?`${acaoPendente.acoes.length} ações pendentes`:'1 ação pendente'}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">Confirme para executar</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {acaoPendente.descricoes.map((desc,i)=>(
                              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)' }}>
                                <CheckCircle2 size={12} color="#818cf8" strokeWidth={2} />
                                <span className="text-[12px] text-slate-400">{desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 px-5 pb-5 pt-2">
                          <button onClick={()=>setAcaoPendente(null)}
                            className="flex-1 py-2.5 rounded-xl text-[12px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                            Cancelar
                          </button>
                          <button onClick={()=>executarAcoesConfirmadas(acaoPendente.acoes)}
                            className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
                            style={{ background:'linear-gradient(135deg,#4f46e5,#0891b2)' }}>
                            Executar
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── PAINEL HISTÓRICO ── */}
                <AnimatePresence>
                  {showHistorico && (
                    <motion.div className="absolute inset-0 z-10 flex flex-col"
                      style={{ background:'#0d1117' }}
                      initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
                      transition={{type:'spring',stiffness:300,damping:30}}>
                      <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
                        style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:'#161b27' }}>
                        <span className="text-[13px] font-semibold text-slate-200">Conversas anteriores</span>
                        <button onClick={()=>setShowHistorico(false)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                          <X size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto py-1">
                        {sessoes.length===0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                              <Terminal size={20} color="#1e293b" strokeWidth={1.5} />
                            </div>
                            <p className="text-[12px] font-medium text-slate-600">Nenhuma conversa salva</p>
                          </div>
                        ) : sessoes.map(s=>(
                          <button key={s.id}
                            onClick={()=>{ carregarSessao(s.id); setShowHistorico(false); }}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                            style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                              style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)' }}>
                              <MessageSquare size={13} color="#818cf8" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12.5px] font-medium text-slate-300 truncate">{s.titulo}</p>
                              <p className="text-[10.5px] text-slate-600 mt-0.5">
                                {s.totalMensagens} msgs · {new Date(s.ultimaAtualizacao).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}
                              </p>
                              {s.resumoAutoGerado && (
                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{s.resumoAutoGerado}</p>
                              )}
                            </div>
                            <ChevronRight size={12} color="#1e293b" strokeWidth={2} className="mt-1 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── MODAL NOVA SESSÃO ── */}
                <AnimatePresence>
                  {showConfirmNovaSessao && (
                    <motion.div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4"
                      style={{ backdropFilter:'blur(12px)', background:'rgba(0,0,0,0.65)' }}
                      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      onClick={()=>setShowConfirmNovaSessao(false)}>
                      <motion.div className="w-full max-w-[300px] rounded-2xl p-5"
                        style={{ background:'#161b27', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' }}
                        initial={{y:20,scale:0.97}} animate={{y:0,scale:1}} exit={{y:20,scale:0.97}}
                        onClick={e=>e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)' }}>
                            <SquarePen size={16} color="#818cf8" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-white">Nova conversa</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">A atual será salva no histórico.</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={()=>setShowConfirmNovaSessao(false)}
                            className="flex-1 py-2.5 rounded-xl text-[12px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
                            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                            Cancelar
                          </button>
                          <button onClick={()=>{ novaSessao(memoriaUsuario,dadosSistema); setShowConfirmNovaSessao(false); }}
                            className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
                            style={{ background:'linear-gradient(135deg,#4f46e5,#0891b2)' }}>
                            Iniciar
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reconnect */}
                {connectionStatus==='error' && (
                  <div className="px-4 py-3 shrink-0"
                    style={{ borderTop:'1px solid rgba(239,68,68,0.1)', background:'rgba(239,68,68,0.04)' }}>
                    <button onClick={handleRetryConnection}
                      className="w-full py-2.5 px-4 rounded-xl text-[12px] font-medium text-red-400/80 flex items-center justify-center gap-2 hover:text-red-300 transition-colors border border-red-500/15"
                      style={{ background:'rgba(239,68,68,0.06)' }}>
                      <RefreshCw size={13} />
                      Tentar reconectar
                    </button>
                  </div>
                )}

                {/* ── QUICK ACTIONS ── */}
                {!isLoading && !isExecutingAction && connectionStatus==='connected' && quickActions.length>0 && (
                  <div className="flex gap-1.5 px-3.5 pt-2 pb-1 overflow-x-auto shrink-0"
                    style={{ scrollbarWidth:'none', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    {quickActions.map((a,i)=>(
                      <motion.button key={i}
                        onClick={()=>{ setInputValue(a.prompt); inputRef.current?.focus(); }}
                        disabled={isLoading}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-300 disabled:opacity-40 transition-all"
                        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', whiteSpace:'nowrap' }}
                        whileHover={{ borderColor:'rgba(99,102,241,0.25)', background:'rgba(99,102,241,0.06)' }}
                        whileTap={{scale:0.97}}>
                        {a.icon}<span>{a.label}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* ── INPUT ── */}
                <div className="px-3 pb-3 pt-2 shrink-0"
                  style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>

                  {/* Wrapper com focus-ring via outline no container */}
                  <div className="relative rounded-2xl transition-all duration-200"
                    style={{
                      background: isListening ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.04)',
                      border: isListening ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    }}>

                    {/* Focus glow — anel interior indigo quando textarea focado */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 focus-within:opacity-100 pointer-events-none transition-opacity duration-200"
                      style={{ boxShadow:'inset 0 0 0 1px rgba(99,102,241,0.28)' }} />

                    {/* Row: mic | textarea | send — todos alinhados ao centro */}
                    <div className="flex items-center gap-1 px-2 py-2">

                      {/* ── Botão Mic ── */}
                      {isSupported && (
                        <div className="relative shrink-0 self-end mb-0.5">
                          {isListening && (
                            <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping pointer-events-none" />
                          )}
                          <motion.button
                            onClick={isListening ? stopListening : startListening}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
                            style={{
                              color: isListening ? '#f87171' : '#4b5563',
                              background: isListening ? 'rgba(239,68,68,0.1)' : 'transparent',
                            }}
                            whileHover={{ color: isListening ? '#fca5a5' : '#94a3b8', background: 'rgba(255,255,255,0.05)' }}
                            whileTap={{ scale: 0.88 }}
                            disabled={isLoading || isExecutingAction}
                            aria-label={isListening ? 'Parar gravação' : 'Falar'}>
                            {isListening
                              ? <MicOff size={15} strokeWidth={2} />
                              : <Mic    size={15} strokeWidth={2} />}
                          </motion.button>
                        </div>
                      )}

                      {/* ── Textarea ── */}
                      <textarea
                        ref={inputRef}
                        value={isListening ? transcript : inputValue}
                        onChange={e => !isListening && setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={
                          isListening            ? 'Ouvindo...'
                          : connectionStatus !== 'connected' ? 'Aguardando conexão...'
                          : 'Pergunte ou peça algo à Ada...'
                        }
                        disabled={isLoading || isExecutingAction || connectionStatus !== 'connected'}
                        rows={1}
                        className="flex-1 bg-transparent border-none text-[13.5px] outline-none resize-none disabled:opacity-40 disabled:cursor-not-allowed py-1.5"
                        style={{
                          minHeight: 36,
                          maxHeight: 120,
                          lineHeight: 1.65,
                          color: '#e2e8f0',
                          caretColor: '#818cf8',
                          fontFamily: 'inherit',
                          /* alinha o placeholder verticalmente junto com os ícones */
                          paddingTop: '7px',
                          paddingBottom: '7px',
                        }}
                      />

                      {/* ── Botão Send ── */}
                      <div className="shrink-0 self-end mb-0.5">
                        <motion.button
                          onClick={() => sendMessage()}
                          disabled={!inputValue.trim() || isLoading || isExecutingAction || connectionStatus !== 'connected'}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed"
                          style={{
                            background: inputValue.trim() && !isLoading && connectionStatus === 'connected'
                              ? 'linear-gradient(135deg, #4f46e5, #0891b2)'
                              : 'rgba(255,255,255,0.05)',
                            boxShadow: inputValue.trim() && connectionStatus === 'connected'
                              ? '0 2px 10px rgba(79,70,229,0.35)'
                              : 'none',
                          }}
                          whileTap={{ scale: 0.88 }}
                          aria-label="Enviar">
                          {isLoading || isExecutingAction
                            ? <Loader size={14} className="animate-spin text-slate-500" strokeWidth={2} />
                            : <ArrowUp size={14} strokeWidth={2.5} color={inputValue.trim() ? '#fff' : '#374151'} />}
                        </motion.button>
                      </div>

                    </div>
                  </div>

                  {/* Footer hint */}
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="text-[10px] text-slate-700">
                      Enter para enviar · Shift+Enter nova linha
                    </span>
                    <span className="text-[10px] text-slate-700 flex items-center gap-1">
                      <Sparkles size={9} color="#1e1b4b" />
                      {formatModel(activeModelName) || 'Gemini'}
                    </span>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes adaFadeUp {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        @keyframes adaWave {
          0%,100% { transform:scaleY(0.3); }
          50%      { transform:scaleY(1);   }
        }
      `}</style>
    </>
  );
};

export default AdaBot;