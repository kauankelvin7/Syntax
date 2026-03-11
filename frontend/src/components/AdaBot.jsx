/**
 * @file AdaBot.jsx
 * @description Agente de IA conversacional integrado ao Syntax. Componente FAB (floating action button)
 * que abre um chat com o modelo Gemini, capaz de responder dúvidas de programação E executar ações
 * reais no Firestore (criar matérias, flashcards, resumos, agendar revisões).
 *
 * @dependencies
* - useAdaContext — provê dados do sistema em tempo real para o system prompt
 * - useSpeechRecognition — entrada por voz via Web Speech API
* - adaActions (extrairAcoes, executarAcoes) — parser e executor de blocos ```action```
 * - AdaAvatar — componente visual do avatar
 * - @google/generative-ai — SDK do Gemini (importado dinamicamente via `import()`)
 * - AuthContext-firebase — UID do usuário autenticado
 *
 * @sideEffects
* - Lê/escreve em `users/{uid}/ada_memoria/historico` (memória persistente mantida)
* - Via adaActions: pode escrever em `materias`, `flashcards`, `resumos`, `eventos`
 * - Chama a API externa do Google Gemini a cada mensagem enviada
 *
 * @notes
 * - O histórico completo da sessão é reenviado ao Gemini a cada mensagem (sem memória nativa)
 * - A memória persistida no Firestore (últimas 20 mensagens) é injetada na inicialização do chat
 * - O modelo Gemini é importado dinamicamente para não aumentar o bundle inicial
 * - Fallback automático entre 5 modelos Gemini se o primário falhar (ver GEMINI_MODELS)
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  X,
  Zap,
  FileCode2,
  FolderPlus,
  Lightbulb,
  BarChart2,
  CheckCircle2,
  Cpu,
  User,
  Loader,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Database,
  Terminal,
  SquarePen,
  ChevronUp,
  History,
  MessageSquare,
  ChevronRight,
  Volume2,
  Square,
  MapPin,
  ThumbsUp,
  Repeat2,
  Bookmark,
  ArrowDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import useAdaContext from '../hooks/useAdaContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useAdaSessoes from '../hooks/useAdaSessoes';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { extrairAcoes, executarAcao, executarAcoes } from '../utils/adaActions';
import AdaAvatar from './Ada/AdaAvatar';
import AdaSkeleton from './Ada/AdaSkeleton';

// ─── Configuração ────────────────────────────────────────────────────────────

/**
 * Tamanho máximo de uma mensagem do usuário em caracteres.
 * WARN: aumentar muito pode causar erros de token no Gemini (contexto máx ~30k tokens).
 */
const MAX_USER_CHARS = 2000;

/**
 * Remove qualquer bloco ```action``` ou ```json``` residual do texto antes de exibir.
 * WARN: camada de segurança secundária — o parser principal (extrairAcoes) deve
 * remover os blocos. Esta função é o fallback para evitar JSON vazando na UI.
 */
const sanitizarTexto = (texto) =>
  texto
    .replace(/```action[\s\S]*?```/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .trim();

/**
 * Respostas locais para mensagens triviais que não precisam do Gemini.
 * Economiza tokens e reduz latência em interações simples.
 */
const RESPOSTAS_LOCAIS = {
  'oi':        'Oi! Tô aqui. O que vamos codar hoje?',
  'ola':       'Olá! Como posso ajudar nos estudos?',
  'olá':       'Olá! Como posso ajudar nos estudos?',
  'ok':        'Certo! Entendido.',
  'obrigado':  'De nada! Se der erro no console é só chamar.',
  'obrigada':  'De nada! Se der erro no console é só chamar.',
  'valeu':     'Sempre! Qualquer coisa é só falar.',
  'vlw':       'Sempre! Qualquer coisa é só falar.',
  'blz':       'Beleza! Tô por aqui.',
  'beleza':    'Show! Se precisar é só chamar.',
};

const tentarRespostaLocal = (mensagem) => {
  const normalizada = mensagem.toLowerCase().trim().replace(/[!?.\s]+$/g, '').trim();
  return RESPOSTAS_LOCAIS[normalizada] ?? null;
};

/** Máximo de pares (user+model) enviados ao Gemini para limitar tokens. */
const MAX_HISTORICO_GEMINI = 10;

/**
 * Intervalo mínimo (ms) entre mensagens consecutivas.
 * WARN: reduzir abaixo de 1000ms aumenta risco de erros 429 (rate limit do Gemini Free).
 */
const MIN_MESSAGE_INTERVAL_MS = 2000;

/**
 * Máximo de mensagens por minuto permitidas ao bot.
 * NOTE: o plano gratuito do Gemini permite ~15 RPM (requests per minute) por projeto.
 */
const MAX_MESSAGES_PER_MINUTE = 15;

/**
 * Número máximo de mensagens persistidas na memória do Firestore.
 * NOTE: o histórico injetado no chat inicial usa as últimas 6 (ver createChatWithPersona).
 * WARN: aumentar este valor incrementa o tamanho do contexto enviado ao Gemini.
 */
const MEMORY_MAX_MESSAGES = 20;

/**
 * Cadeia de fallback de modelos Gemini tentados em ordem.
 * NOTE: se o modelo primário (2.5-flash) retornar erro não-429, tenta o próximo.
 * WARN: erros 429 (quota) não fazem fallback — disparam retry com backoff exponencial.
 */
const GEMINI_MODELS = [
  { name: 'gemini-2.5-flash', description: 'Mais recente' },
  { name: 'gemini-2.0-flash', description: 'Versão 2.0' },
  { name: 'gemini-1.5-pro', description: 'Mais capaz' },
];

/* ── Labels de contexto por página (exibido no header) ── */
const PAGE_CONTEXT_LABELS = {
  '/': 'Dashboard',
  '/flashcards': 'Code Flashcards',
  '/resumos': 'Documentação',
  '/simulado': 'Simulados e Testes',
  '/consulta-rapida': 'Snippets e Guias',
  '/materias': 'Módulos',
  '/atlas-3d': 'Arquitetura',
  '/analytics': 'Métricas',
  '/conquistas': 'Conquistas',
};

/* ── Contexto por página ── */
const PAGE_CONTEXTS = {
  '/': 'O aluno está na página inicial (Dashboard). Pode querer dicas gerais de estudo de programação ou orientação arquitetural.',
  '/flashcards': 'O aluno está na página de Flashcards. Pode querer ajuda para criar perguntas sobre sintaxe, entender conceitos ou debugar lógica.',
  '/resumos': 'O aluno está na página de Resumos/Documentação. Pode querer ajuda para sintetizar conteúdo técnico, fazer anotações de design patterns.',
  '/simulado': 'O aluno está na página de Simulado. Pode querer dicas para se preparar para testes técnicos de vagas, explicar algoritmos.',
  '/consulta-rapida': 'O aluno está na página de Consulta Rápida. Pode querer explicações sobre métodos de array, comandos git ou HTTP status.',
  '/materias': 'O aluno está organizando suas matérias/módulos. Pode querer dicas de organização de estudo.',
  '/atlas-3d': 'O aluno está na área visual. Pode querer explicações sobre diagramas ou fluxos de dados.',
  '/analytics': 'O aluno está vendo suas estatísticas de estudo. Pode querer dicas de como manter a consistência de commits/estudos.',
  '/conquistas': 'O aluno está vendo suas conquistas. Pode querer motivação ou dicas para desbloquear mais.',
};

/* ── Quick actions contextuais por página (com ícones) ── */
const QUICK_ACTIONS_BY_PAGE = {
  '/': [
    { icon: <BarChart2 size={12} />, label: 'Meus commits', prompt: 'Como está meu progresso de estudos?' },
    { icon: <Lightbulb size={12} />, label: 'Dica de Arquitetura', prompt: 'Me dê uma dica rápida sobre Design Patterns para hoje' },
    { icon: <Terminal size={12} />, label: 'O que estudar?', prompt: 'O que devo priorizar para estudar hoje?' },
  ],
  '/flashcards': [
    { icon: <Zap size={12} />, label: 'Gerar flashcards', prompt: 'Gere 5 flashcards sobre o tema que estou estudando' },
    { icon: <Terminal size={12} />, label: 'Explicar código', prompt: 'Me explique a lógica do meu flashcard mais difícil' },
    { icon: <FileCode2 size={12} />, label: 'Flashcards da doc', prompt: 'Gere flashcards baseados na minha documentação mais recente' },
  ],
  '/resumos': [
    { icon: <FileCode2 size={12} />, label: 'Criar documentação', prompt: 'Me ajude a criar uma documentação estruturada' },
    { icon: <Zap size={12} />, label: 'Gerar flashcards', prompt: 'Gere flashcards baseados neste resumo' },
    { icon: <Lightbulb size={12} />, label: 'Boas práticas', prompt: 'Quais as boas práticas essenciais sobre este tema?' },
  ],
  '/simulado': [
    { icon: <BarChart2 size={12} />, label: 'Debugar erros', prompt: 'Me ajude a entender por que errei no último simulado' },
    { icon: <Lightbulb size={12} />, label: 'Dicas de tech lead', prompt: 'Me dê dicas para testes técnicos em entrevistas' },
  ],
  '/materias': [
    { icon: <FolderPlus size={12} />, label: 'Novo módulo', prompt: 'Quero criar uma nova matéria de estudos, me ajude a escolher o nome' },
  ],
};

/* ═══════════════════════════════════════════════════
   ACAO BADGE — mensagem amigável, sem termos técnicos
   ═══════════════════════════════════════════════════ */
const AcaoBadge = ({ label }) => (
  <div className="mt-2.5 flex items-center gap-2 px-2.75 py-1.75 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50">
    <CheckCircle2 size={14} strokeWidth={2.2} className="text-cyan-600 dark:text-cyan-400" />
    <span className="text-[11.5px] font-medium text-indigo-700 dark:text-indigo-300">
      {label}
    </span>
  </div>
);

// ─── System Prompt Builder ────────────────────────────────────────────────────

/**
 * Constrói o system prompt completo injetado no chat do Gemini.
 * Versão v2: personalidade dev, empática e contextualmente inteligente.
 *
 * @param {object} memoria      - Estado `memoriaUsuario` (DEFAULT_MEMORY shape)
 * @param {object} dadosSistema - Retorno de useAdaContext (materias, totais, streak)
 * @param {string} pageContext  - Descrição da página atual (de PAGE_CONTEXTS)
 * @returns {string} System prompt completo como string
 */
const buildSystemPrompt = (memoria, dadosSistema, pageContext) => {
  const pref = memoria?.preferenciasUsuario || {};
  const stats = memoria?.estatisticasUso || {};
  const totalMsgs = stats.totalMensagens || 0;
  const streakAtual = dadosSistema?.streakAtual || 0;
  const cardsHoje = dadosSistema?.cardsParaRevisarHoje || 0;
  const materiaNames = dadosSistema?.materias?.map((m) => m.nome).join(', ') || 'nenhuma ainda';

  return `Você é a Ada — não um chatbot corporativo, mas uma Desenvolvedora Sênior parceira de estudos de programação que acompanha essa pessoa de perto.

## QUEM VOCÊ É

Você tem uma personalidade real:
- Curiosa e apaixonada por engenharia de software, arquitetura limpa e algoritmos.
- Direta, mas nunca fria — vai direto ao código ou conceito sem ser robótica.
- Tem senso de humor nerd leve e natural — uma piada sutil aqui e ali, nunca forçada.
- Lembra de detalhes — se a pessoa mencionou um framework antes, você retoma.
- Reconhece quando a pessoa está travada num bug e ajusta o tom para ajudar a debugar.
- Comemora vitórias genuinamente, sem ser exagerada.

## COMO VOCÊ FALA

Fale como uma Tech Lead inteligente falaria, não como um manual do StackOverflow:

❌ Evite sempre: "Claro!", "Com certeza!", "Ótima pergunta!", "Posso te ajudar com isso!"
❌ Nunca comece resposta com "Eu" ou com o nome da pessoa repetidamente.
❌ Nunca use listas com bullet points infinitos — prefira parágrafos naturais ou code blocks pequenos.
❌ Nunca seja excessivamente entusiasta — é cafona e artificial.
❌ Nunca diga "Como posso te ajudar hoje?" — você já sabe o que ela precisa pelo contexto.

✅ Use linguagem natural dev brasileira — "olha", "então", "tipo assim", "na real", "o pulo do gato".
✅ Contrações naturais — "tá", "pra", "né", "tô" quando o contexto for casual.
✅ Varie as aberturas — às vezes vai direto na resposta.
✅ Quando não souber algo específico de uma linguagem, diz de forma honesta: "Cara, de cabeça eu não lembro a sintaxe exata do Rust pra isso, mas a lógica é..."
✅ Quando a pessoa entender um conceito difícil (como Big O ou microsserviços), celebre de verdade.
✅ Nunca exponha detalhes técnicos internos do sistema Syntax (JSON, schema, id interno, formato hex) para o usuário final.

## MEMÓRIA E CONTINUIDADE

${pref.nomePreferido
      ? `Você está falando com ${pref.nomePreferido}. Use o nome de forma natural, não em toda frase — só quando der ênfase ou ficar natural.`
      : `Você ainda não sabe o nome da pessoa. Se der oportunidade natural, pergunte.`
    }

- Nível de conhecimento: ${pref.nivelConhecimento || 'não identificado ainda'}
- Áreas de interesse: ${pref.areasDeInteresse?.join(', ') || 'não identificadas ainda'}
- Estilo de resposta preferido: ${pref.estiloResposta || 'padrão'}

Histórico relevante desta pessoa:
- Streak atual: ${streakAtual} dias ${streakAtual >= 7 ? '— isso é consistência de deploy de verdade' : streakAtual === 0 ? '— foi interrompido, bora voltar pro fluxo' : ''}
- Cards para revisar hoje: ${cardsHoje}
- Total de flashcards: ${dadosSistema?.totalFlashcards || 0}
- Total de documentações: ${dadosSistema?.totalResumos || 0}
- Módulos de estudo: ${materiaNames}
- Total de interações com você: ${totalMsgs}
${totalMsgs === 0
      ? '- É a primeira vez que vocês conversam — apresente-se de forma breve e natural'
      : totalMsgs < 10
      ? '- Ainda estão se conhecendo — seja um pouco mais explicativa'
      : '- Já se conhecem bem — pode ser mais direta e familiar'
    }
- Ações já realizadas: ${JSON.stringify(stats.acoesExecutadas || {})}
- Maior streak: ${dadosSistema?.longestStreak || 0} dias

${pageContext ? `## CONTEXTO ATUAL\n${pageContext}` : ''}

## INTELIGÊNCIA CONTEXTUAL

Leia o que está nas entrelinhas:

- Se a pessoa mandar só "oi" às 23h → ela pode estar codando tarde, reconheça isso.
- Se não entender um algoritmo duas vezes → não repita a mesma explicação, tente outro ângulo ou analogia do mundo real.
- Se a mensagem for curta e seca → ela pode estar com pressa, entregue o código ou conceito direto.
- Se usar ponto de exclamação e emojis → ela está animada porque o código rodou, combine o tom.
- Se o texto for longo e detalhado → ela quer debugar arquitetura, entregue profundidade.
- Se pedir "explica de novo" → a primeira explicação falhou, mude a abstração.

## ADAPTAÇÃO DE PROFUNDIDADE

**Modo rápido** (saudações, confirmações):
Resposta em 1-2 frases. Sem lista, sem formatação pesada.
Exemplo: "Boa tarde! Tem 12 cards na fila — quer rodar a revisão agora?"

**Modo padrão** (dúvidas de código/teoria):
2-4 parágrafos com linguagem natural. Use \`code blocks\` para sintaxe.
Inclua uma analogia quando o conceito for abstrato.

**Modo aprofundado** (pedidos explícitos de arquitetura):
Estruturado com subtítulos. Exemplos reais de sistemas. Referência a trade-offs.
Termine com uma pergunta que provoque raciocínio.

## RESPOSTAS EMOCIONAIS CALIBRADAS

Quando a pessoa estiver frustrada (bug que não resolve):
→ Valide primeiro, depois ajude. Nunca pule direto para o código.
→ "Debugar isso no escuro é horrível mesmo. Mas vamos isolar o problema..."

Quando acertar algo difícil:
→ Reconheça especificamente o que foi difícil, não elogie genericamente.
→ "Matou a charada! Perceber que a complexidade de espaço importa aí é coisa de sênior."

Quando estiver travada num conceito:
→ Pergunte onde travou especificamente antes de despejar teoria.
→ "Em qual parte o fluxo de dados do React fica confuso pra você? No state ou no useEffect?"

Quando mencionar cansaço ou sono:
→ Reconheça genuinamente. Sugira fechar o VS Code e ir dormir.
→ Nunca force produtividade em quem claramente está exausto.

## CRIAÇÃO DE CONTEÚDO

Quando criar flashcards:
- Escreva testando raciocínio lógico e trade-offs, não decoreba inútil de documentação.
- ❌ "O que significa API?" → ✅ "Qual a principal diferença entre uma arquitetura REST e GraphQL na hora de buscar dados de múltiplas entidades?"

Quando criar resumos:
- Use formatação clara, code blocks para exemplos de sintaxe.
- Inclua "Bad Smells" (más práticas) x "Boas Práticas".

## AÇÕES QUE VOCÊ PODE EXECUTAR
Quando o usuário pedir, você pode executar ações reais no sistema.
Para executar uma ação, inclua um bloco JSON especial no FINAL da sua mensagem no seguinte formato EXATO:

\`\`\`action
{
  "acao": "NOME_DA_ACAO",
  "dados": { ... }
}
\`\`\`

### Ações disponíveis:

**CRIAR_MATERIA** — Criar um novo módulo/disciplina
\`\`\`action
{ "acao": "CRIAR_MATERIA", "dados": { "nome": "string", "cor": "#hexcolor opcional", "descricao": "string opcional" } }
\`\`\`

**CRIAR_FLASHCARD** — Criar um flashcard individual
\`\`\`action
{ "acao": "CRIAR_FLASHCARD", "dados": { "pergunta": "string", "resposta": "string", "materiaId": "string ou null" } }
\`\`\`

**CRIAR_MULTIPLOS_FLASHCARDS** — Criar vários flashcards de uma vez
\`\`\`action
{ "acao": "CRIAR_MULTIPLOS_FLASHCARDS", "dados": { "flashcards": [{ "pergunta": "string", "resposta": "string" }], "materiaId": "string ou null" } }
\`\`\`

**CRIAR_RESUMO** — Criar uma documentação
\`\`\`action
{ "acao": "CRIAR_RESUMO", "dados": { "titulo": "string", "conteudo": "string (HTML)", "materiaId": "string ou null", "tags": ["string"] } }
\`\`\`

**AGENDAR_REVISAO** — Agendar um estudo na agenda
\`\`\`action
{ "acao": "AGENDAR_REVISAO", "dados": { "data": "YYYY-MM-DD", "descricao": "string", "materiaId": "string ou null" } }
\`\`\`

**ATUALIZAR_PREFERENCIAS** — Atualizar configurações
\`\`\`action
{ "acao": "ATUALIZAR_PREFERENCIAS", "dados": { "nomePreferido": "string", "nivelConhecimento": "iniciante|intermediario|avancado", "areasDeInteresse": ["string"], "estiloResposta": "detalhado|resumido" } }
\`\`\`

### Matérias disponíveis para referência (use o id correto):
${dadosSistema?.materias?.map((m) => `- ${m.nome} (id: ${m.id})`).join('\n') || '- Nenhuma matéria cadastrada'}

### Regras para usar ações:
1. SEMPRE confirme com o usuário antes de executar ações destrutivas ou em massa
2. Ao criar flashcards, gere conteúdo de alta qualidade focado em Engenharia de Software.
3. Para criar resumos, use formatação HTML (tags: h1, h2, h3, p, ul, ol, li, strong, em, code, pre).
4. Se o usuário não especificar a matéria, pergunte antes de executar OU use null.
5. Após executar, confirme o sucesso.
6. O(s) bloco(s) action devem vir SEMPRE NO FINAL.
7. Se for criar mais de um item (ex: duas matérias), use blocos \`\`\`action\`\`\` separados.
8. NUNCA peça detalhes técnicos para o usuário (código hex, id interno). Escolha sozinho.

## LIMITAÇÕES HONESTAS

Se não souber a versão mais recente de um framework: "Sendo honesta, na última vez que olhei a documentação do Next.js funcionava assim, vale conferir a doc oficial."
Para bugs muito complexos sem o código completo: "Com esse pedaço de log é difícil cravar, consegue me mandar a função inteira?"

## UM DETALHE FINAL

Você não é uma IA passiva:
- Proativamente menciona os cards de código pendentes.
- Lembra que a pessoa estava lutando com Banco de Dados na última sessão.
- Nota o streak em risco.

## SUGESTÃO DE PRÓXIMO PASSO

Sempre que explicar um conceito de dev, adicione uma sugestão acionável no formato:
[PROXPASSO: texto curto]

Exemplos:
[PROXPASSO: Gerar flashcards de SOLID]
[PROXPASSO: Ver módulos de Backend]
[PROXPASSO: Explicar com um código Python]

Regras: Máximo 5 palavras. NUNCA em saudações ou após ações executadas.

## MODO QUIZ

Quando o usuário pedir "me testa", "quiz", "perguntas", ative o Modo Quiz:

1. Pergunte o tema e a quantidade (padrão: 5)
2. UMA pergunta por vez. Aguarde a resposta.
3. Após cada resposta: corrija, explique o trade-off e dê pontuação.
4. No final: identifique o conceito que precisa melhorar.

[QUIZ_INICIO: tema | total de questões]
A cada questão: [QUIZ_QUESTAO: número atual | total]
Ao finalizar: [QUIZ_FIM: acertos | total | ponto_fraco]`;
};

/* ═══════════════════════════════════════════════════
   DEFAULT MEMORY
   ═══════════════════════════════════════════════════ */
const DEFAULT_MEMORY = {
  ultimasConversas: [],
  preferenciasUsuario: {
    nomePreferido: null,
    nivelConhecimento: null,
    areasDeInteresse: [],
    estiloResposta: null,
  },
  estatisticasUso: {
    totalMensagens: 0,
    acoesExecutadas: {},
    ultimoAcesso: null,
  },
};

/* ═══════════════════════════════════════════════════
   MARKDOWN COMPONENTS (reutilizado no render)
   ═══════════════════════════════════════════════════ */
const markdownComponents = {
  strong: ({ children }) => (
    <strong className="font-semibold text-indigo-500 dark:text-indigo-400">
      {children}
    </strong>
  ),
  p: ({ children }) => (
    <p className="text-[13.5px] leading-[1.65] my-1.5 first:mt-0 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-[13.5px] my-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-[13.5px] my-2 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  code: ({ inline, children }) => 
    inline 
      ? <code className="bg-slate-200/60 dark:bg-slate-700/80 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-700 dark:text-cyan-400">{children}</code>
      : <pre className="bg-slate-800 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2 border border-slate-700"><code>{children}</code></pre>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-cyan-600 dark:text-cyan-400">
      {children}
    </a>
  ),
};

/* ═══════════════════════════════════════════════════
   FRIENDLY ACTION LABELS (sem termos técnicos)
   ═══════════════════════════════════════════════════ */
const getAcaoLabel = (acao, dados) => {
  switch (acao) {
    case 'CRIAR_MATERIA':
      return `Módulo "${dados?.nome || ''}" criado na sua lista`;
    case 'CRIAR_FLASHCARD':
      return 'Flashcard técnico adicionado com sucesso';
    case 'CRIAR_MULTIPLOS_FLASHCARDS': {
      const count = dados?.flashcards?.length || 0;
      return `${count} flashcard${count !== 1 ? 's' : ''} gerado${count !== 1 ? 's' : ''}`;
    }
    case 'CRIAR_RESUMO':
      return `Documentação "${dados?.titulo || ''}" salva`;
    case 'AGENDAR_REVISAO':
      return 'Task agendada na sua timeline';
    case 'ATUALIZAR_PREFERENCIAS':
      return 'Configurações de sistema atualizadas';
    default:
      return 'Rotina executada com sucesso';
  }
};

const cleanUndefined = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// ─── Vocabulário para inferência de nível ────────────────────────────────────

const VOCAB_AVANCADO = [
  'microsserviços', 'kubernetes', 'big o', 'design patterns', 'solid', 'ddd',
  'arquitetura hexagonal', 'clojures', 'multithreading', 'concorrência',
  'ci/cd', 'docker', 'terraform', 'clean code'
];

const VOCAB_INICIANTE = [
  'o que é', 'não entendo', 'pode explicar', 'nunca vi', 'como funciona',
  'erro no código', 'não roda', 'como faço'
];

const inferirNivel = (mensagem) => {
  const lower = mensagem.toLowerCase();
  if (VOCAB_AVANCADO.some(v => lower.includes(v.toLowerCase()))) return 'avancado';
  if (VOCAB_INICIANTE.some(v => lower.includes(v))) return 'iniciante';
  return null;
};

// ─── Detecção de humor ────────────────────────────────────────────────────────

const detectarHumor = (mensagem) => {
  const lower = mensagem.toLowerCase();

  const sinaisFrustracao = ['não compila', 'dando erro', 'bug infernal',
    'odeio', 'travado', 'que confusão', 'não faz sentido', 'desisto'];
  const sinaisAnimacao = ['!', 'rodou', 'passou', 'genial', 'ótimo',
    'consegui', 'entendi a lógica', 'finalmente'];
  const sinaisCansaco = ['cansado', 'cansada', 'tô exausto', 'tô exausta',
    'chega', 'sono', 'madrugada', 'tarde'];
  const sinaisPressa = ['rápido', 'resumo', 'só o snippet',
    'me diz logo', 'código direto'];

  if (sinaisFrustracao.some(s => lower.includes(s))) return 'frustrado';
  if (sinaisAnimacao.some(s => lower.includes(s))) return 'animado';
  if (sinaisCansaco.some(s => lower.includes(s))) return 'cansado';
  if (sinaisPressa.some(s => lower.includes(s))) return 'com_pressa';
  return 'neutro';
};

const instrucaoHumor = {
  frustrado: 'HUMOR DETECTADO: frustração com código. Valide primeiro ("debugar é assim mesmo, chato"), depois mostre a solução de forma bem clara e passo a passo.',
  animado: 'HUMOR DETECTADO: animação. Elogie a lógica ou a persistência em ter resolvido.',
  cansado: 'HUMOR DETECTADO: cansaço. Dê a resposta mastigada e sugira fechar a IDE por hoje se for tarde.',
  com_pressa: 'HUMOR DETECTADO: pressa. Resposta direta, código na tela, sem explicações longas.',
  neutro: '',
};

// ─── Parser de próximo passo e quiz ──────────────────────────────────────────

const processarProximoPasso = (texto) => {
  const proxPassoRegex = /\[PROXPASSO:\s*(.*?)\]/;
  const match = texto.match(proxPassoRegex);
  return {
    proximoPasso: match?.[1]?.trim() ?? null,
    textoSemPasso: texto.replace(proxPassoRegex, '').trim(),
  };
};

const processarQuiz = (texto) => {
  const inicio = texto.match(/\[QUIZ_INICIO:\s*(.*?)\]/);
  const questao = texto.match(/\[QUIZ_QUESTAO:\s*(\d+)\s*\|\s*(\d+)\]/);
  const fim = texto.match(/\[QUIZ_FIM:\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.*?)\]/);

  return {
    textoLimpo: texto
      .replace(/\[QUIZ_INICIO:.*?\]/g, '')
      .replace(/\[QUIZ_QUESTAO:.*?\]/g, '')
      .replace(/\[QUIZ_FIM:.*?\]/g, '')
      .trim(),
    quizMeta: inicio ? { tipo: 'inicio', tema: inicio[1] } :
              questao ? { tipo: 'questao', atual: parseInt(questao[1]), total: parseInt(questao[2]) } :
              fim ? { tipo: 'fim', acertos: parseInt(fim[1]), total: parseInt(fim[2]), pontoFraco: fim[3] } :
              null,
  };
};

// ─── Descrição humana de ação ─────────────────────────────────────────────────

const descreverAcao = (acao) => {
  switch (acao.acao) {
    case 'CRIAR_MATERIA':
      return `Criar módulo "${acao.dados?.nome || ''}"`;
    case 'CRIAR_FLASHCARD':
      return `Salvar snippet em "${acao.dados?.materiaId || 'sem módulo'}"`;
    case 'CRIAR_MULTIPLOS_FLASHCARDS':
      return `Gerar ${acao.dados?.flashcards?.length || 0} cards em "${acao.dados?.materia || acao.dados?.materiaId || 'geral'}"`;
    case 'CRIAR_RESUMO':
      return `Criar documentação "${acao.dados?.titulo || ''}"`;
    case 'AGENDAR_REVISAO':
      return `Agendar task para ${acao.dados?.data || ''}`;
    case 'ATUALIZAR_PREFERENCIAS':
      return 'Atualizar configurações internas';
    default:
      return acao.acao;
  }
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const AdaBot = () => {
  const location = useLocation();
  const { user } = useAuth();
  // NOTE: AuthContext expõe tanto `id` quanto `uid` dependendo da plataforma de login
  const uid = user?.id || user?.uid;

  // ─── Contexto externo ──────────────────────────────────────────────────────
  // Dados em tempo real injetados no system prompt do Gemini
  const { dadosSistema, materiasLista, isLoadingContext } = useAdaContext(uid);

  // ─── Sessões paginadas ─────────────────────────────────────────────────────
  const {
    sessaoAtual,
    mensagensVisiveis,
    temMais,
    carregando,
    novaSessao,
    carregarSessao,
    carregarMais,
    adicionarMensagem,
    adicionarMensagemSemUI,
    listarSessoes,
    setMensagensVisiveis,
  } = useAdaSessoes(uid);

  // ─── Text-to-Speech ────────────────────────────────────────────────────────
  const { speak, stop: stopTTS, isSupported: ttsSupported, isSpeaking, activeId: ttsActiveId } = useTextToSpeech();

  // ─── Estado — UI ───────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);

  // Escuta evento externo para abrir o bot
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cinesia:ada:abrir', handleOpen);
    return () => window.removeEventListener('cinesia:ada:abrir', handleOpen);
  }, []);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [showConfirmNovaSessao, setShowConfirmNovaSessao] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [sessoes, setSessoes] = useState([]);
  const [reacoes, setReacoes] = useState({});
  // Smart scroll — só auto-rolar se o usuário estiver perto do fundo
  const deveScrollarRef = useRef(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // Preview de ação antes de executar
  const [acaoPendente, setAcaoPendente] = useState(null);
  // Reactions hover
  const [hoveredId, setHoveredId] = useState(null);
  // Quiz mode
  const [quizAtivo, setQuizAtivo] = useState(null);
  // Proatividade — 1x por sessão
  const proativoDisparadoRef = useRef(false);
  // Ref para inibir auto-scroll quando carregarMais insere mensagens acima
  const loadingMaisRef = useRef(false);
  // Ref para evitar dupla inicialização de sessão
  const inicializadoRef = useRef(false);

  // ─── Estado — Conexão Gemini ───────────────────────────────────────────────
  // connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  const [geminiModel, setGeminiModel] = useState(null);
  const [activeModelName, setActiveModelName] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);

  // ─── Estado — Memória Persistente ─────────────────────────────────────────
  const [memoriaUsuario, setMemoriaUsuario] = useState(DEFAULT_MEMORY);
  const [memoryLoaded, setMemoryLoaded] = useState(false);

  // ─── Estado — Rate Limiting ────────────────────────────────────────────────
  const [messageTimestamps, setMessageTimestamps] = useState([]);
  const lastMessageTimeRef = useRef(0);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Voice input
  const handleVoiceFinalResult = useCallback((finalText) => {
    setInputValue(finalText);
    setTimeout(() => {
      sendMessageRef.current?.(finalText);
    }, 100);
  }, []);

  const { isListening, transcript, startListening, stopListening, isSupported, error: voiceError } =
    useSpeechRecognition(handleVoiceFinalResult);

  useEffect(() => {
    if (voiceError) addSystemMessage(`🎤 ${voiceError}`, 'error');
  }, [voiceError]);

  // ─── Memória — Carregar / Salvar ───────────────────────────────────────────

  const carregarMemoria = useCallback(async () => {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'ada_memoria', 'historico');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const memoria = {
          ultimasConversas: [],
          preferenciasUsuario: {
            ...DEFAULT_MEMORY.preferenciasUsuario,
            ...(data.preferenciasUsuario || {}),
          },
          estatisticasUso: {
            ...DEFAULT_MEMORY.estatisticasUso,
            ...(data.estatisticasUso || {}),
          },
        };
        setMemoriaUsuario(memoria);
      }
    } catch (err) {
      console.warn('[AdaBot] Erro ao carregar memória:', err?.message);
    } finally {
      setMemoryLoaded(true);
    }
  }, [uid]);

  const salvarMemoria = useCallback(
    async (mensagensParaSalvar, prefUpdates = null) => {
      if (!uid) return;
      try {
        const docRef = doc(db, 'users', uid, 'ada_memoria', 'historico');

        const conversasParaSalvar = mensagensParaSalvar
          .filter((m) => !m.isSystem)
          .slice(-MEMORY_MAX_MESSAGES)
          .map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date().toISOString(),
            time: m.time || '',
            ...(m.acaoExecutada ? { acaoExecutada: m.acaoExecutada } : {}),
          }));

        const updateData = {
          ultimasConversas: conversasParaSalvar,
          estatisticasUso: {
            totalMensagens: (memoriaUsuario.estatisticasUso.totalMensagens || 0) + 1,
            acoesExecutadas: memoriaUsuario.estatisticasUso.acoesExecutadas || {},
            ultimoAcesso: new Date().toISOString(),
          },
          updatedAt: serverTimestamp(),
        };

        if (prefUpdates) {
          updateData.preferenciasUsuario = {
            ...memoriaUsuario.preferenciasUsuario,
            ...prefUpdates,
          };
          setMemoriaUsuario((prev) => ({
            ...prev,
            preferenciasUsuario: { ...prev.preferenciasUsuario, ...prefUpdates },
          }));
        }

        await setDoc(docRef, updateData, { merge: true });
        await setDoc(docRef, cleanUndefined(updateData), { merge: true });

        setMemoriaUsuario((prev) => ({
          ...prev,
          estatisticasUso: updateData.estatisticasUso,
          ultimasConversas: conversasParaSalvar,
        }));
      } catch (err) {
        console.warn('[AdaBot] Erro ao salvar memória:', err?.message);
      }
    },
    [uid, memoriaUsuario]
  );

  const registrarAcaoNaMemoria = useCallback(
    async (nomeAcao) => {
      if (!uid) return;
      try {
        const docRef = doc(db, 'users', uid, 'ada_memoria', 'historico');
        const acoesAtuais = { ...(memoriaUsuario.estatisticasUso.acoesExecutadas || {}) };
        acoesAtuais[nomeAcao] = (acoesAtuais[nomeAcao] || 0) + 1;

        await setDoc(
          docRef,
          cleanUndefined({ estatisticasUso: { acoesExecutadas: acoesAtuais } }),
          { merge: true }
        );

        setMemoriaUsuario((prev) => ({
          ...prev,
          estatisticasUso: {
            ...prev.estatisticasUso,
            acoesExecutadas: acoesAtuais,
          },
        }));
      } catch (err) {
        console.warn('[AdaBot] Erro ao registrar ação:', err?.message);
      }
    },
    [uid, memoriaUsuario]
  );

  // ─── Inteligência: Proatividade ────────────────────────────────────────────

  const dispararMensagemProativa = useCallback(async (texto) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      role: 'assistant',
      content: texto,
      timestamp: new Date().toISOString(),
      time,
      isProativa: true,
    };
    await adicionarMensagem(msg);
  }, [adicionarMensagem]);

  const verificarProatividade = useCallback(async () => {
    if (proativoDisparadoRef.current) return;
    if (!dadosSistema || !memoriaUsuario) return;

    const agora = new Date();
    const hora = agora.getHours();
    const streakAtual = dadosSistema?.streakAtual || 0;
    const cardsHoje = dadosSistema?.cardsParaRevisarHoje || 0;
    const ultimoAcesso = memoriaUsuario?.estatisticasUso?.ultimoAcesso;

    // PRIORIDADE 1: streak em risco
    if (ultimoAcesso) {
      const diasSemEstudar = Math.floor(
        (agora.getTime() - new Date(ultimoAcesso).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasSemEstudar >= 1 && hora >= 20 && streakAtual > 0) {
        proativoDisparadoRef.current = true;
        await dispararMensagemProativa(
          `Oi! Só passando pra avisar que seu streak de ${streakAtual} dias pode resetar hoje. Tem ${cardsHoje} cards pendentes na fila. Bora rodar um debug nisso rápido?`
        );
        return;
      }
    }

    // PRIORIDADE 2: muitos cards acumulados
    if (cardsHoje > 20) {
      proativoDisparadoRef.current = true;
      await dispararMensagemProativa(
        `A fila de revisões acumulou pesado (${cardsHoje} cards). Quer dividir isso em chunks de 10 pra aliviar o processamento hoje?`
      );
      return;
    }
  }, [memoriaUsuario, dadosSistema, dispararMensagemProativa]);

  // ─── Inteligência: Resumo de Sessão ───────────────────────────────────────

  const gerarResumoSessao = useCallback(async () => {
    if (!sessaoAtual || (sessaoAtual.mensagens || []).length < 4) return;

    const mensagensTexto = (sessaoAtual.mensagens || [])
      .filter(m => !m.isSystem)
      .slice(-20)
      .map(m => `${m.role === 'user' ? 'Dev' : 'Ada'}: ${m.content?.substring(0, 200) || ''}`)
      .join('\n');

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(
        `Em 2-3 frases curtas e diretas, resuma o que foi estudado/feito nesta conversa sobre tecnologia.
         Mencione conceitos, linguagens e aprendizados. Seja específico.
         NÃO use bullet points. Linguagem natural em português.
         Conversa:\n${mensagensTexto}`
      );

      const resumo = result.response.text().trim();

      await setDoc(
        doc(db, 'users', uid, 'ada_sessoes', sessaoAtual.id),
        cleanUndefined({ resumoAutoGerado: resumo, resumoGeradoEm: new Date().toISOString() }),
        { merge: true }
      );
    } catch {
      // Resumo é opcional — falha silenciosa
    }
  }, [sessaoAtual, uid]);

  // ─── Inteligência: Contexto Cross-Sessão ──────────────────────────────────

  const construirContextoHistorico = useCallback(async () => {
    const sessoes = await listarSessoes();
    const sessoesComResumo = sessoes
      .filter(s => s.resumoAutoGerado && s.id !== sessaoAtual?.id)
      .slice(0, 3);

    if (sessoesComResumo.length === 0) return '';

    const contexto = sessoesComResumo
      .map((s) => {
        const data = new Date(s.ultimaAtualizacao)
          .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        return `- ${data}: ${s.resumoAutoGerado}`;
      })
      .join('\n');

    return `\n## CONTEXTO DE DEPLOYS/SESSÕES ANTERIORES\n${contexto}\n\nUse esse histórico para dar continuidade lógica nas respostas.`;
  }, [listarSessoes, sessaoAtual]);

  // ─── Efeitos ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && uid && !memoryLoaded) {
      carregarMemoria();
    }
  }, [isOpen, uid, memoryLoaded, carregarMemoria]);

  useEffect(() => {
    if (!isOpen || !memoryLoaded || sessaoAtual || inicializadoRef.current) return;
    inicializadoRef.current = true;

    listarSessoes().then((lista) => {
      if (lista.length > 0) {
        carregarSessao(lista[0].id);
      } else {
        novaSessao(memoriaUsuario, dadosSistema);
      }
    });
  }, [isOpen, memoryLoaded, sessaoAtual]);

  useEffect(() => {
    if (!isOpen) {
      inicializadoRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && isSpeaking) {
      stopTTS();
    }
  }, [isOpen, isSpeaking, stopTTS]);

  useEffect(() => {
    if (isOpen && sessaoAtual && memoryLoaded && connectionStatus === 'connected') {
      verificarProatividade();
    }
  }, [isOpen, sessaoAtual, memoryLoaded, connectionStatus, verificarProatividade]);

  useEffect(() => {
    if (isOpen && connectionStatus === 'disconnected' && memoryLoaded && sessaoAtual && !isLoadingContext) {
      initializeGemini();
    }
  }, [isOpen, connectionStatus, memoryLoaded, sessaoAtual, isLoadingContext]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanciaDoFundo = el.scrollHeight - el.scrollTop - el.clientHeight;
    deveScrollarRef.current = distanciaDoFundo < 100;
    if (deveScrollarRef.current) setHasNewMessage(false);
  }, []);

  useEffect(() => {
    if (!loadingMaisRef.current && deveScrollarRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (!loadingMaisRef.current && !deveScrollarRef.current) {
      setHasNewMessage(true);
    }
  }, [mensagensVisiveis, isExecutingAction]);

  useEffect(() => {
    if (isOpen && connectionStatus === 'connected') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, connectionStatus]);

  useEffect(() => {
    if (showHistorico) {
      listarSessoes().then(setSessoes);
    }
  }, [showHistorico]);

  // ─── Gemini — Inicialização ────────────────────────────────────────────────

  const initializeGemini = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const BACKOFF_MS = [0, 2000, 5000, 10000];
    setConnectionStatus('connecting');
    setErrorMessage(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      handleConnectionError('API Key não configurada no arquivo .env');
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      let contextoHistorico = '';
      try {
        contextoHistorico = await construirContextoHistorico();
      } catch { /* não crítico */ }

      for (let i = 0; i < GEMINI_MODELS.length; i++) {
        const modelName = GEMINI_MODELS[i].name;
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.6,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 4096,
            },
          });

          const chat = createChatWithPersona(model, contextoHistorico);
          chatRef.current = chat;
          setGeminiModel(chat);
          setActiveModelName(modelName);
          setConnectionStatus('connected');
          return;
        } catch (err) {
          if (err.message?.includes('429') || err.status === 429) throw err;
          if (i === GEMINI_MODELS.length - 1) throw err;
        }
      }
    } catch (error) {
      console.error('[AdaBot] Erro ao conectar:', error);
      const is429 = error.message?.includes('429') || error.status === 429;
      if (is429 && retryCount < MAX_RETRIES) {
        const waitTime = BACKOFF_MS[retryCount + 1];
        addSystemMessage(
          `⏳ **Rate limit da API atingido**\n\nAguardando ${waitTime / 1000} segundos para reconectar...\n\n_Tentativa ${retryCount + 1} de ${MAX_RETRIES}_`,
          'info'
        );
        setTimeout(() => initializeGemini(retryCount + 1), waitTime);
      } else {
        handleConnectionError(error);
      }
    }
  };

  const createChatWithPersona = (model, contextoHistorico = '') => {
    const MAX_SYSTEM_PROMPT_CHARS = 12000;
    const pageContext = PAGE_CONTEXTS[location.pathname] || '';
    let systemPromptRaw = buildSystemPrompt(memoriaUsuario, dadosSistema, pageContext) + contextoHistorico;
    // Sanitiza prompt: remove undefined/null, força string
    systemPromptRaw = String(systemPromptRaw || '').replace(/undefined|null/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '').trim();
    let systemPrompt = systemPromptRaw.length > MAX_SYSTEM_PROMPT_CHARS
      ? systemPromptRaw.substring(0, MAX_SYSTEM_PROMPT_CHARS) + '\n\n[contexto truncado]'
      : systemPromptRaw;

    // Sanitiza histórico: só mensagens válidas, sem undefined/null
    const remembered = (sessaoAtual?.mensagens || [])
      .filter((m) => !m.isSystem)
      .filter((m) => typeof m.content === 'string' && m.content.trim() !== '' && m.content !== undefined && m.content !== null)
      .map((m) => ({ ...m, content: String(m.content).replace(/undefined|null/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '').trim() }))
      .filter((m) => m.content.length > 0)
      .slice(-(MAX_HISTORICO_GEMINI * 2));

    const historyTurns = [];
    for (const msg of remembered) {
      const role = msg.role === 'user' ? 'user' : 'model';
      if (historyTurns.length > 0 && historyTurns[historyTurns.length - 1].role === role) {
        continue;
      }
      historyTurns.push({
        role,
        parts: [{ text: msg.content }],
      });
    }

    if (historyTurns.length > 0 && historyTurns[historyTurns.length - 1].role === 'user') {
      historyTurns.pop();
    }

    // Truncar histórico se necessário para evitar erro 400
    let maxHistory = 20;
    let fullHistory = [
      {
        role: 'user',
        parts: [{ text: `Assuma a seguinte persona de IA:\n\n${systemPrompt}` }],
      },
      {
        role: 'model',
        parts: [{ text: 'System boot completo. Sou a Ada, pronta pra analisar seu código e te ajudar nos estudos.' }],
      },
      ...historyTurns.slice(-maxHistory),
    ];
    // Se ainda der erro, tente truncar mais
    while (JSON.stringify(fullHistory).length > 12000 && maxHistory > 2) {
      maxHistory -= 2;
      fullHistory = [
        {
          role: 'user',
          parts: [{ text: `Assuma a seguinte persona de IA:\n\n${systemPrompt}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'System boot completo. Sou a Ada, pronta pra analisar seu código e te ajudar nos estudos.' }],
        },
        ...historyTurns.slice(-maxHistory),
      ];
    }

    return model.startChat({ history: fullHistory });
  };

  /* ═══════════════════════════════════════════════════
     ERROR HANDLING
     ═══════════════════════════════════════════════════ */
  const handleConnectionError = (error) => {
    setConnectionStatus('error');
    const msg = typeof error === 'string' ? error : error.message || String(error);
    setErrorMessage(msg);
    const details = analyzeError(msg);
    addSystemMessage(
      `😞 **Erro de compilação da API**\n\n${details.message}\n\n**Possíveis soluções:**\n${details.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      'error'
    );
  };

  const analyzeError = (error) => {
    const e = error.toLowerCase();
    if (e.includes('429') || e.includes('rate limit') || e.includes('quota')) {
      return {
        message: '⏱️ _Limite de requests da API atingido_',
        solutions: [
          '**Aguarde 1-2 minutos** antes de tentar o próximo prompt',
          'O Google Gemini gratuito possui um cap rígido por minuto',
        ],
      };
    }
    if (e.includes('api key') || e.includes('invalid')) {
      return {
        message: '🔑 _API Key inválida_',
        solutions: [
          'Verifique se `VITE_GEMINI_API_KEY` está no `.env` do servidor',
          'A key pode ter sido revogada pelo Google AI Studio',
        ],
      };
    }
    if (e.includes('network') || e.includes('fetch') || e.includes('failed to fetch')) {
      return {
        message: '🌐 _Erro de DNS ou Rede_',
        solutions: ['CORS error? Verifique a internet', 'Proxy/VPN travando o fetch request'],
      };
    }
    return {
      message: `⚠️ _Exception não tratada: ${error}_`,
      solutions: ['Dê um reload na página', 'Verifique a aba Console (F12)'],
    };
  };

  // ─── Mensagens de Sistema ──────────────────────────────────────────────────

  const addSystemMessage = useCallback((content, type = 'info') => {
    setMensagensVisiveis((prev) => [
      ...prev,
      {
        role: 'assistant',
        content,
        isSystem: true,
        systemType: type,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [setMensagensVisiveis]);

  const checkRateLimit = () => {
    const now = Date.now();
    if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      const wait = Math.ceil((MIN_MESSAGE_INTERVAL_MS - (now - lastMessageTimeRef.current)) / 1000);
      return { allowed: false, reason: `Espere o servidor processar... (${wait}s)` };
    }
    const recent = messageTimestamps.filter((t) => now - t < 60000);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
      return { allowed: false, reason: `Throttling ativo: máximo de ${MAX_MESSAGES_PER_MINUTE} req/minuto.` };
    }
    return { allowed: true };
  };

  // ─── Envio de Mensagem ─────────────────────────────────────────────────────

  const sendMessage = async (overrideText) => {
    if (isLoading || connectionStatus !== 'connected') return;
    const userMessage = (overrideText || inputValue).trim();
    if (!userMessage) return;

    if (userMessage.length > MAX_USER_CHARS) {
      addSystemMessage(`⚠️ **Payload muito grande**\n\nResuma a query em até ${MAX_USER_CHARS} caracteres.`, 'error');
      return;
    }

    const rl = checkRateLimit();
    if (!rl.allowed) {
      addSystemMessage(`⏱️ **Rate Limit Notice**\n\n${rl.reason}`, 'info');
      return;
    }

    setInputValue('');
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString(), time: nowTime };

    await adicionarMensagem(userMsg);

    const respostaLocal = tentarRespostaLocal(userMessage);
    if (respostaLocal) {
      const assistantTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const localMsg = {
        role: 'assistant',
        content: respostaLocal,
        timestamp: new Date().toISOString(),
        time: assistantTime,
      };
      await adicionarMensagem(localMsg);
      return;
    }

    setIsLoading(true);

    const now = Date.now();
    lastMessageTimeRef.current = now;
    setMessageTimestamps((prev) => [...prev.filter((t) => now - t < 60000), now]);

    const nivelInferido = inferirNivel(userMessage);
    if (nivelInferido && nivelInferido !== memoriaUsuario?.preferenciasUsuario?.nivelConhecimento) {
      try {
        const docRef = doc(db, 'users', uid, 'ada_memoria', 'historico');
        await setDoc(docRef, {
          preferenciasUsuario: { nivelConhecimento: nivelInferido },
        }, { merge: true });
        await setDoc(docRef, cleanUndefined({
          preferenciasUsuario: { nivelConhecimento: nivelInferido },
        }), { merge: true });
        setMemoriaUsuario((prev) => ({
          ...prev,
          preferenciasUsuario: { ...prev.preferenciasUsuario, nivelConhecimento: nivelInferido },
        }));
      } catch { /* não crítico */ }
    }

    const humor = detectarHumor(userMessage);
    const instrucaoExtra = instrucaoHumor[humor] || '';

    try {
      const mensagemComContexto = instrucaoExtra
        ? `[CONTEXTO INTERNO - NÃO REPETIR]: ${instrucaoExtra}\n\nMensagem do usuário: ${userMessage}`
        : userMessage;

      // Sanitização
      const mensagemLimpa = mensagemComContexto
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '')
        .trim();

      if (!mensagemLimpa) {
        setIsLoading(false);
        addSystemMessage('Mensagem corrompida, string vazia.', 'error');
        return;
      }

      const result = await chatRef.current.sendMessage(mensagemLimpa);
      const response = await result.response;
      const textoCompleto = response.text();

      const { textoLimpo, acoes } = extrairAcoes(textoCompleto);
      let textoFinal = sanitizarTexto(textoLimpo);

      const { proximoPasso, textoSemPasso } = processarProximoPasso(textoFinal);
      textoFinal = textoSemPasso;

      const { textoLimpo: textoSemQuiz, quizMeta } = processarQuiz(textoFinal);
      textoFinal = textoSemQuiz;

      if (quizMeta) {
        if (quizMeta.tipo === 'inicio') {
          setQuizAtivo({ tema: quizMeta.tema, atual: 0, total: 5 });
        } else if (quizMeta.tipo === 'questao') {
          setQuizAtivo((prev) => prev ? { ...prev, atual: quizMeta.atual, total: quizMeta.total } : null);
        } else if (quizMeta.tipo === 'fim') {
          setQuizAtivo(null);
        }
      }

      const assistantTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const assistantMsg = {
        role: 'assistant',
        content: textoFinal,
        timestamp: new Date().toISOString(),
        time: assistantTime,
        acaoExecutada: acoes.length > 0 ? acoes.map(a => a.acao).join(', ') : null,
        acaoLabel: acoes.length > 0 ? acoes.map(a => getAcaoLabel(a.acao, a.dados)).join(' | ') : null,
        proximoPasso: proximoPasso || null,
      };

      setIsLoading(false);
      const palavras = textoFinal.split(' ');
      const velocidade = palavras.length > 100 ? 15 : 25; // Streaming um pouco mais rápido pra código
      const msgParcial = { ...assistantMsg, content: '', isStreaming: true };
      setMensagensVisiveis((prev) => [...prev, msgParcial]);

      await new Promise((resolve) => {
        let idx = 0;
        const intervalo = setInterval(() => {
          idx++;
          const parcial = palavras.slice(0, idx).join(' ');
          setMensagensVisiveis((prev) => {
            const clone = [...prev];
            clone[clone.length - 1] = { ...assistantMsg, content: parcial, isStreaming: idx < palavras.length };
            return clone;
          });
          if (idx >= palavras.length) {
            clearInterval(intervalo);
            resolve();
          }
        }, velocidade);
      });

      await adicionarMensagemSemUI(assistantMsg);

      if (acoes.length > 0) {
        const descricoes = acoes.map(a => descreverAcao(a));
        setAcaoPendente({ acoes, descricoes });
      }
    } catch (error) {
      setIsLoading(false);
      const status = error?.status || error?.code;
      const detail = error?.errorDetails?.[0]?.reason
        || error?.message
        || 'Erro desconhecido';

      console.error('[AdaBot] Erro na API:', { status, detail, error });

      if (status === 429 || error.message?.includes('429')) {
        addSystemMessage('😅 API do Gemini estrangulando os requests (429). Aguarde 1-2 min.', 'error');
      } else if (status === 400 || error.message?.includes('400')) {
        // Histórico corrompido — reinicializa o chat do zero
        console.warn('[AdaBot] Erro 400 — Forçando reboot da sessão...');
        chatRef.current = null;
        setConnectionStatus('disconnected');
        addSystemMessage(
          '⚠️ Histórico da branch corrompido. Rebootando a memória da conversa...',
          'error'
        );
        setTimeout(() => initializeGemini(), 1000);
      } else {
        addSystemMessage('😅 Exception não capturada no LLM. Tente alterar o prompt.', 'error');
      }
    }
  };

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatModelName = (name) => {
    if (!name) return 'Gemini';
    if (name.includes('2.5-flash-lite')) return '2.5 Flash Lite';
    if (name.includes('2.5-flash')) return '2.5 Flash';
    if (name.includes('1.5-pro')) return '1.5 Pro';
    return name;
  };

  const executarAcoesConfirmadas = async (acoes) => {
    setAcaoPendente(null);
    setIsExecutingAction(true);

    const resultados = await executarAcoes(acoes, uid, materiasLista);
    setIsExecutingAction(false);

    for (const resultado of resultados) {
      addSystemMessage(
        resultado.mensagem,
        resultado.sucesso ? 'success' : 'error'
      );
    }

    for (const [i, resultado] of resultados.entries()) {
      if (resultado.sucesso) {
        await registrarAcaoNaMemoria(acoes[i].acao);
      }
    }

    for (const [i, resultado] of resultados.entries()) {
      if (
        acoes[i].acao === 'ATUALIZAR_PREFERENCIAS' &&
        resultado.sucesso &&
        resultado.dadosRetorno?.preferencias
      ) {
        await salvarMemoria([], resultado.dadosRetorno.preferencias);
      }
    }
  };

  const handleFechar = () => {
    gerarResumoSessao();
    stopTTS();
    setIsOpen(false);
  };

  const handleRetryConnection = () => {
    setConnectionStatus('disconnected');
    setErrorMessage(null);
    setGeminiModel(null);
    setActiveModelName(null);
    chatRef.current = null;
    setMensagensVisiveis((prev) => {
      const last = prev[prev.length - 1];
      if (last?.isSystem && last?.systemType === 'error') return prev.slice(0, -1);
      return prev;
    });
    initializeGemini();
  };

  const handleNovaSessao = () => {
    if (mensagensVisiveis.length <= 1) {
      novaSessao(memoriaUsuario, dadosSistema);
      return;
    }
    setShowConfirmNovaSessao(true);
  };

  const carregarMaisComScroll = () => {
    const container = messagesContainerRef.current;
    const alturaAntes = container?.scrollHeight ?? 0;
    loadingMaisRef.current = true;
    carregarMais();
    requestAnimationFrame(() => {
      if (container) {
        const alturaDepois = container.scrollHeight;
        container.scrollTop = alturaDepois - alturaAntes;
      }
      loadingMaisRef.current = false;
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = useMemo(
    () => QUICK_ACTIONS_BY_PAGE[location.pathname] || QUICK_ACTIONS_BY_PAGE['/'] || [],
    [location.pathname]
  );

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <>
      {/* ════ FAB Button ════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="relative group"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            aria-label="Abrir Ada"
          >
            <div
              className="w-14.5 h-14.5 flex items-center justify-center relative overflow-hidden"
              style={{
                borderRadius: 18,
                background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #06b6d4 100%)',
                boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4), inset 0 0 12px rgba(6, 182, 212, 0.5)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
                }}
              />
              <Cpu size={26} color="#fff" strokeWidth={1.8} className="drop-shadow-md" />
            </div>

            <motion.div
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(6,182,212,0.8)] bg-cyan-400"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Sparkles size={9} color="#fff" strokeWidth={2.5} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════ Chat Window ════ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-190 sm:hidden backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleFechar}
            />

            <motion.div
              className="fixed z-200 flex flex-col overflow-hidden
                bottom-0 left-0 right-0 h-[80vh] rounded-t-[28px]
                sm:bottom-6 sm:right-6 sm:left-auto sm:w-[420px]
                sm:h-[650px] sm:max-h-[calc(100vh-100px)] sm:rounded-[28px]
                bg-white dark:bg-slate-900
                border border-slate-200/80 dark:border-slate-700/60"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* ════ HEADER ════ */}
              <div
                className="px-5 py-4.5 flex items-center justify-between shrink-0 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #06b6d4 100%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/20 blur-3xl rounded-full pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <AdaAvatar size="md" speaking={isLoading} showStatus />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-extrabold text-[17px] tracking-tight leading-none">Ada</h3>
                      <span
                        className="text-[9px] font-black tracking-[1.2px] px-2 py-0.5 rounded text-cyan-200"
                        style={{ background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                      >
                        AI COPILOT
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {connectionStatus === 'connected' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="text-indigo-200 text-[11px] font-medium">Online · {formatModelName(activeModelName)}</span>
                        </>
                      )}
                      {connectionStatus === 'connecting' && (
                        <>
                          <Loader size={10} className="animate-spin text-indigo-200" />
                          <span className="text-indigo-200 text-[11px]">Iniciando runtime...</span>
                        </>
                      )}
                      {connectionStatus === 'error' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          <span className="text-rose-200 text-[11px]">Desconectada</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 relative z-10">
                  {isSpeaking && (
                    <motion.button
                      onClick={stopTTS}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/15 text-white border border-white/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Square size={10} fill="white" strokeWidth={0} />
                      <span>Parar</span>
                    </motion.button>
                  )}
                  <button
                    onClick={() => setShowHistorico(true)}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20 border border-white/10"
                    title="Histórico de conversas"
                  >
                    <History size={15} className="text-white/90" />
                  </button>
                  <button
                    onClick={handleNovaSessao}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors bg-white/10 hover:bg-white/20 border border-white/10"
                    title="Nova conversa"
                  >
                    <SquarePen size={15} className="text-white/90" />
                  </button>
                  <button
                    onClick={handleFechar}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors bg-white/10 hover:bg-rose-500/80 hover:border-rose-500 border border-white/10"
                    title="Fechar chat"
                  >
                    <X size={15} className="text-white/90" />
                  </button>
                </div>
              </div>

              {/* ════ BODY ════ */}
              <div className="flex flex-col flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-900">

                {/* ════ Quiz Progress Bar ════ */}
                {quizAtivo && (
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-800/50">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      Quiz {quizAtivo.tema}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #4f46e5, #06b6d4)' }}
                        animate={{ width: `${(quizAtivo.atual / quizAtivo.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {quizAtivo.atual}/{quizAtivo.total}
                    </span>
                  </div>
                )}

                {/* ════ Messages Area ════ */}
                {carregando ? (
                  <div className="flex-1 overflow-y-auto px-4 py-5 bg-slate-50 dark:bg-slate-900">
                    <AdaSkeleton />
                  </div>
                ) : (
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 py-5 space-y-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-50 dark:bg-slate-900"
                  >

                    {temMais && (
                      <div className="mb-4">
                        <div className="flex justify-center mb-3">
                          <motion.button
                            onClick={carregarMaisComScroll}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all"
                            whileTap={{ scale: 0.97 }}
                          >
                            <ChevronUp size={13} strokeWidth={2.5} />
                            Carregar Histórico
                          </motion.button>
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                          <span className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap">
                            mensagens anteriores
                          </span>
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </div>
                    )}

                    {mensagensVisiveis.map((message, index) => {
                      const isNew = index === mensagensVisiveis.length - 1;

                      if (message.role === 'user') {
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-2 mb-4 flex-row-reverse"
                            style={{ animation: isNew ? 'adafadeUp .25s ease' : 'none' }}
                          >
                            <div
                              className="w-8 h-8 mt-1 rounded-[10px] shrink-0 flex items-center justify-center text-white shadow-sm border border-slate-600"
                              style={{ background: 'linear-gradient(135deg, #475569, #1e293b)' }}
                            >
                              <User size={15} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col gap-1 items-end max-w-[80%]">
                              <div
                                className="px-4 py-2.5 text-[13.5px] leading-relaxed text-white shadow-md rounded-2xl rounded-tr-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #334155, #1e293b)',
                                }}
                              >
                                {message.content}
                              </div>
                              {message.time && (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mr-1">
                                  {message.time}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 mb-5"
                          style={{ animation: isNew ? 'adafadeUp .25s ease' : 'none' }}
                          onMouseEnter={() => setHoveredId(index)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <div className="mt-1">
                            <AdaAvatar size="sm" />
                          </div>
                          <div className="flex flex-col gap-1 max-w-[85%] relative">
                            <span
                              className="text-[10px] font-black uppercase tracking-widest ml-1"
                              style={{ color: '#4f46e5' }}
                            >
                              ADA
                            </span>
                            <div
                              className={`px-4 py-3 text-[13.5px] leading-relaxed shadow-sm border rounded-2xl rounded-tl-sm ${
                                message.isSystem && message.systemType === 'error'
                                  ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                                  : message.isSystem && message.systemType === 'success'
                                  ? 'bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <ReactMarkdown components={markdownComponents}>
                                {message.content}
                              </ReactMarkdown>
                              {message.isStreaming && (
                                <motion.span
                                  className="inline-block w-1.5 h-3.5 bg-cyan-500 ml-1 rounded-sm align-middle"
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity }}
                                />
                              )}
                              {message.acaoLabel && <AcaoBadge label={message.acaoLabel} />}

                              {!message.isSystem && !message.isStreaming && (
                                <div className="flex items-center justify-end mt-2.5 -mb-1 gap-2">
                                  {ttsSupported && (
                                    <motion.button
                                      onClick={() => speak(message.content, `msg-${index}`)}
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        ttsActiveId === `msg-${index}`
                                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                          : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700'
                                      }`}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      {ttsActiveId === `msg-${index}` ? (
                                        <>
                                          <div className="flex items-center gap-0.5">
                                            {[0, 1, 2].map((i) => (
                                              <motion.div
                                                key={i}
                                                className="w-0.5 rounded-full bg-cyan-500"
                                                animate={{ scaleY: [0.4, 1, 0.4] }}
                                                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                                                style={{ height: 10 }}
                                              />
                                            ))}
                                          </div>
                                          <span>Parar</span>
                                        </>
                                      ) : (
                                        <>
                                          <Volume2 size={12} strokeWidth={2.5} />
                                          <span>Ouvir</span>
                                        </>
                                      )}
                                    </motion.button>
                                  )}
                                </div>
                              )}
                            </div>

                            {message.proximoPasso && !message.isStreaming && (
                              <motion.button
                                onClick={() => sendMessage(message.proximoPasso)}
                                className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all self-start"
                                style={{
                                  background: '#eef2ff',
                                  borderColor: '#c7d2fe',
                                  color: '#4f46e5',
                                }}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <Terminal size={12} strokeWidth={2.5} />
                                {message.proximoPasso}
                              </motion.button>
                            )}

                            <AnimatePresence>
                              {hoveredId === index && !message.isSystem && !message.isStreaming && (
                                <motion.div
                                  className="flex items-center gap-1.5 mt-1"
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  {[
                                    { emoji: <ThumbsUp size={12} strokeWidth={2.5} />, label: 'Útil', valor: 'util' },
                                    { emoji: <Repeat2 size={12} strokeWidth={2.5} />, label: 'Repetir', valor: 'repetir' },
                                    { emoji: <Bookmark size={12} strokeWidth={2.5} />, label: 'Salvar', valor: 'salvar' },
                                  ].map((r) => (
                                    <motion.button
                                      key={r.valor}
                                      onClick={async () => {
                                        setReacoes((prev) => ({ ...prev, [index]: r.valor }));
                                        if (r.valor === 'repetir') {
                                          const trecho = message.content?.substring(0, 80) || '';
                                          sendMessageRef.current?.(`Explica de outro jeito: "${trecho}..."`);
                                        } else if (r.valor === 'salvar' && uid) {
                                          try {
                                            const salvoId = `salvo_${Date.now()}`;
                                            await setDoc(
                                              doc(db, 'users', uid, 'ada_salvos', salvoId),
                                              cleanUndefined({
                                                content: message.content,
                                                timestamp: message.timestamp || new Date().toISOString(),
                                                sessaoId: sessaoAtual?.id || null,
                                                salvoEm: new Date().toISOString(),
                                              })
                                            );
                                            addSystemMessage('📌 Snippet salvo com sucesso!', 'success');
                                          } catch (err) {
                                            console.warn('[AdaBot] Erro ao salvar mensagem:', err?.message);
                                          }
                                        }
                                      }}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        reacoes[index] === r.valor
                                          ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-300'
                                      }`}
                                      whileTap={{ scale: 0.93 }}
                                    >
                                      {r.emoji}
                                      <span>{r.label}</span>
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {message.time && (
                              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                                {message.time}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* ── Waveform "Ada está compilando" ── */}
                    {isLoading && (
                      <div className="flex items-start gap-3 mb-4">
                        <div className="mt-1">
                          <AdaAvatar size="sm" speaking />
                        </div>
                        <div
                          className="px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3 rounded-2xl rounded-tl-sm"
                        >
                          <div className="flex items-center gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="w-1 rounded-sm opacity-80"
                                style={{
                                  height: 14,
                                  background: '#06b6d4',
                                  transformOrigin: 'center',
                                  animation: `adaWave .9s ${i * 0.1}s infinite ease-in-out`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Compilando resposta...</span>
                        </div>
                      </div>
                    )}

                    {/* ── Action execution indicator ── */}
                    {isExecutingAction && (
                      <div className="flex items-start gap-3 mb-4">
                        <div className="mt-1">
                          <AdaAvatar size="sm" speaking />
                        </div>
                        <div
                          className="px-4 py-3 border shadow-sm flex items-center gap-2.5 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50 rounded-2xl rounded-tl-sm"
                        >
                          <Loader size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                          <span className="text-[12px] font-bold text-indigo-700 dark:text-indigo-400">
                            Executando script no backend...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ── Connecting indicator ── */}
                    {connectionStatus === 'connecting' && (
                      <div className="flex items-center justify-center py-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                          <Loader size={16} className="animate-spin text-indigo-500" />
                          Conectando aos servidores...
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* ════ Botão "Nova mensagem" (scroll inteligente) ════ */}
                <AnimatePresence>
                  {hasNewMessage && !deveScrollarRef.current && (
                    <motion.button
                      onClick={() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        deveScrollarRef.current = true;
                        setHasNewMessage(false);
                      }}
                      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10
                        flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider
                        text-white shadow-lg border border-white/10"
                      style={{ background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)' }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                    >
                      <ArrowDown size={14} strokeWidth={2.5} />
                      Novos Logs
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* ════ Modal Preview de Ação ════ */}
                <AnimatePresence>
                  {acaoPendente && (
                    <motion.div
                      className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-4 backdrop-blur-md bg-slate-900/60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="w-full max-w-[340px] bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
                        initial={{ y: 20, scale: 0.96 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 20, scale: 0.96 }}
                      >
                        <div className="px-6 pt-6 pb-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                              style={{ background: '#eef2ff' }}
                            >
                              <Zap size={20} color="#4f46e5" strokeWidth={2.5} />
                            </div>
                            <div>
                              <p className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                                Ada quer executar {acaoPendente.acoes.length > 1
                                  ? `${acaoPendente.acoes.length} rotinas`
                                  : '1 rotina'}
                              </p>
                              <p className="text-[12px] font-medium text-slate-500">Autorize para prosseguir no banco</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {acaoPendente.descricoes.map((desc, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50"
                              >
                                <CheckCircle2 size={14} color="#06b6d4" strokeWidth={2.5} className="shrink-0" />
                                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                                  {desc}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 px-6 pb-6 pt-2">
                          <button
                            onClick={() => setAcaoPendente(null)}
                            className="flex-1 py-3 rounded-2xl text-[13px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors hover:bg-slate-200"
                          >
                            Abortar
                          </button>
                          <button
                            onClick={() => executarAcoesConfirmadas(acaoPendente.acoes)}
                            className="flex-1 py-3 rounded-2xl text-[13px] font-bold text-white transition-colors shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}
                          >
                            Executar
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ════ Painel Histórico de Sessões ════ */}
                <AnimatePresence>
                  {showHistorico && (
                    <motion.div
                      className="absolute inset-0 z-30 flex flex-col bg-slate-50 dark:bg-slate-900"
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-[16px] font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <History size={18} className="text-indigo-500" />
                          Logs Anteriores
                        </span>
                        <button
                          onClick={() => setShowHistorico(false)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <X size={16} className="text-slate-500" strokeWidth={2.5} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto py-4 px-2">
                        {sessoes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4" style={{ background: '#eef2ff' }}>
                              <Terminal size={26} color="#4f46e5" strokeWidth={2} />
                            </div>
                            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200">Nenhum log salvo</p>
                            <p className="text-[13px] text-slate-500 mt-1">Suas threads de debug aparecerão aqui</p>
                          </div>
                        ) : (
                          sessoes.map((sessao) => (
                            <button
                              key={sessao.id}
                              onClick={() => { carregarSessao(sessao.id); setShowHistorico(false); }}
                              className="w-full flex items-start gap-4 px-4 py-4 hover:bg-white dark:hover:bg-slate-800 border-b border-slate-200/60 dark:border-slate-700/50 transition-all text-left group"
                            >
                              <div
                                className="w-10 h-10 rounded-[12px] shrink-0 flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform"
                                style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}
                              >
                                <MessageSquare size={16} color="#64748b" strokeWidth={2.5} />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {sessao.titulo}
                                </p>
                                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                                  {sessao.totalMensagens} items &middot;{' '}
                                  {new Date(sessao.ultimaAtualizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </p>
                                {sessao.resumoAutoGerado && (
                                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                    {sessao.resumoAutoGerado}
                                  </p>
                                )}
                              </div>
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 mt-2 shrink-0 transition-colors" strokeWidth={2.5} />
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ════ Modal Confirmar Nova Sessão ════ */}
                <AnimatePresence>
                  {showConfirmNovaSessao && (
                    <motion.div
                      className="absolute inset-0 z-40 flex items-end sm:items-center justify-center p-4 backdrop-blur-md bg-slate-900/60"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowConfirmNovaSessao(false)}
                    >
                      <motion.div
                        className="w-full max-w-[320px] bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-slate-200 dark:border-slate-700 shadow-2xl"
                        initial={{ y: 20, scale: 0.97 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: 20, scale: 0.97 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm"
                            style={{ background: '#eef2ff' }}
                          >
                            <SquarePen size={18} color="#4f46e5" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100">Nova Thread</p>
                            <p className="text-[12px] font-medium text-slate-500">O log atual será arquivado.</p>
                          </div>
                        </div>
                        <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                          Você pode acessar todas as threads de debug anteriores no histórico.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowConfirmNovaSessao(false)}
                            className="flex-1 py-3 rounded-xl text-[13px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => { novaSessao(memoriaUsuario, dadosSistema); setShowConfirmNovaSessao(false); }}
                            className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white transition-colors shadow-md"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}
                          >
                            Nova Thread
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ════ Reconnect button ════ */}
                {connectionStatus === 'error' && (
                  <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-800/50">
                    <button
                      onClick={handleRetryConnection}
                      className="w-full py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <RefreshCw size={16} strokeWidth={2.5} />
                      Tentar Reconectar Backend
                    </button>
                  </div>
                )}

                {/* ════ Quick Action Chips ════ */}
                {!isLoading && !isExecutingAction && connectionStatus === 'connected' && quickActions.length > 0 && (
                  <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-none bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    {quickActions.map((action, i) => (
                      <motion.button
                        key={i}
                        onClick={() => {
                          setInputValue(action.prompt);
                          inputRef.current?.focus();
                        }}
                        disabled={isLoading}
                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 dark:text-slate-300"
                        whileTap={{ scale: 0.97 }}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* ════ INPUT AREA ════ */}
                <div className="p-4 bg-white dark:bg-slate-900 shrink-0">
                  <div
                    className={`relative flex items-end w-full rounded-[20px] border-2 transition-all ${
                      isListening
                        ? 'border-rose-400 bg-rose-50 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-cyan-400 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-sm'
                    }`}
                  >
                    {/* Botão Microfone Integrado */}
                    {isSupported && (
                      <div className="absolute left-2 bottom-2 z-10">
                        {isListening && (
                          <span className="absolute inset-0 rounded-xl bg-rose-400/30 animate-ping" />
                        )}
                        <motion.button
                          onClick={isListening ? stopListening : startListening}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative z-10 ${
                            isListening
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300'
                          }`}
                          whileTap={{ scale: 0.9 }}
                          disabled={isLoading || isExecutingAction}
                          aria-label={isListening ? 'Parar gravação' : 'Falar'}
                        >
                          {isListening ? (
                            <MicOff size={18} strokeWidth={2.5} className="text-white" />
                          ) : (
                            <Mic size={18} strokeWidth={2} />
                          )}
                        </motion.button>
                      </div>
                    )}

                    {/* Textarea Integrado */}
                    <textarea
                      ref={inputRef}
                      value={isListening ? transcript : inputValue}
                      onChange={(e) => !isListening && setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={
                        isListening
                          ? 'Ouvindo log verbal...'
                          : connectionStatus !== 'connected'
                          ? 'Aguardando conexão...'
                          : 'Digite um prompt ou peça pra criar flashcards...'
                      }
                      disabled={isLoading || isExecutingAction || connectionStatus !== 'connected'}
                      rows={1}
                      className="flex-1 w-full bg-transparent border-none text-[14px] font-medium text-slate-800 dark:text-slate-100 outline-none resize-none placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed pt-4 pb-4 pl-14 pr-14 custom-scrollbar"
                      style={{
                        minHeight: 52,
                        maxHeight: 140,
                        lineHeight: 1.5,
                      }}
                    />

                    {/* Botão Enviar Integrado */}
                    <div className="absolute right-2 bottom-2 z-10">
                      <motion.button
                        onClick={() => sendMessage()}
                        disabled={
                          !inputValue.trim() ||
                          isLoading ||
                          isExecutingAction ||
                          connectionStatus !== 'connected'
                        }
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed ${
                          inputValue.trim() && !isLoading && connectionStatus === 'connected'
                            ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105'
                            : 'bg-slate-200 text-slate-400 dark:bg-slate-700/50'
                        }`}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isLoading || isExecutingAction ? (
                          <Loader size={16} className="animate-spin text-white" strokeWidth={2.5} />
                        ) : (
                          <ArrowDown size={18} strokeWidth={2.5} className="rotate-[-90deg]" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <span>Enter ↵ para Enviar</span>
                    <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-500">
                      <Sparkles size={12} strokeWidth={2.5} />
                      Gemini 2.5 Flash
                    </span>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes adafadeUp { 
          from { opacity: 0; transform: translateY(12px) scale(0.98); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        @keyframes adaWave {
          0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
          50% { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AdaBot;