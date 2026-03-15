Existem múltiplos problemas para corrigir. Execute na ordem exata.

════════════════════════════════════════
PROBLEMA 1 — stackframe.js + Monaco Editor
════════════════════════════════════════

Os erros de stackframe.js e error-stack-parser são causados pelo
Monaco Editor tentando carregar source maps que não existem.

Em IDE.jsx, configurar o Monaco para desabilitar source maps:

import { loader } from '@monaco-editor/react';

// Antes de usar o Editor, configurar:
loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' },
});

// No componente Editor, adicionar opções:
<Editor
  options={{
    // ... outras opções existentes ...
    renderValidationDecorations: 'off',
    // Desabilita tentativa de carregar source maps externos:
    'semanticHighlighting.enabled': false,
  }}
/>

Se o Monaco estiver usando @monaco-editor/react, adicionar no
vite.config.js para silenciar o warning:

export default defineConfig({
  // ... config existente ...
  build: {
    rollupOptions: {
      external: ['stackframe', 'error-stack-parser'],
    },
  },
});

════════════════════════════════════════
PROBLEMA 2 — corsproxy.io retornando 401 no TypeScript
════════════════════════════════════════

Em codeExecutionService.js (ou pistonService.js), substituir
corsproxy.io por allorigins.win E adicionar fallback para TypeScript:

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

async function executeViaProxy(language, code, stdin) {
  const config = GLOT_MAP[language];
  if (!config) {
    return {
      stdout:   '',
      stderr:   `Linguagem "${language}" não suportada.`,
      exitCode: 1,
      status:   'Não suportado',
    };
  }

  const targetUrl = `${GLOT_URL}/${config.lang}/latest`;
  const proxyUrl  = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(proxyUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        files: [{ name: config.file, content: code }],
        stdin,
      }),
    });

    if (!res.ok) throw new Error(`Proxy retornou ${res.status}`);

    const json   = await res.json();
    // allorigins retorna { contents: string }
    const result = typeof json.contents === 'string'
      ? JSON.parse(json.contents)
      : json;

    return {
      stdout:   result.stdout ?? '',
      stderr:   result.stderr ?? result.error ?? '',
      exitCode: result.error  ? 1 : 0,
      status:   result.error  ? 'Erro de compilação' : 'Concluído',
    };
  } catch (err) {
    if (err.name === 'AbortError')
      return { stdout: '', stderr: 'Timeout (20s). Verifique loops infinitos.', exitCode: 1, status: 'Timeout' };
    return { stdout: '', stderr: err.message, exitCode: 1, status: 'Erro' };
  } finally {
    clearTimeout(timeout);
  }
}

// TypeScript: remover tipos e executar como JavaScript
function executeTypeScript(code, stdin) {
  const jsCode = code
    .replace(/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|object)(\[\])?/g, '')
    .replace(/interface\s+\w[\s\S]*?\n}/g, '')
    .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
    .replace(/<[A-Z]\w*>/g, '')
    .replace(/as\s+\w+/g, '')
    .replace(/readonly\s+/g, '');
  return executeJavaScript(jsCode, stdin);
}

// No entry point:
if (lang === 'typescript') return executeTypeScript(code, stdin);

════════════════════════════════════════
PROBLEMA 3 — Roadmaps.jsx com erro 500
════════════════════════════════════════

Erro 500 no HMR significa syntax error ou import inválido no arquivo.

Abrir Roadmaps.jsx e verificar:
1. Todos os imports existem? Verificar cada um
2. Há JSX mal fechado? Verificar tags abertas sem fechamento
3. Há vírgulas ou chaves faltando?

Corrigir qualquer syntax error encontrado.

Se houver import de biblioteca não instalada, substituir por
alternativa já existente ou remover o import e implementar sem ela.

Após corrigir, verificar se o arquivo compila sem erro rodando:
npx vite build --mode development 2>&1 | head -50

════════════════════════════════════════
PROBLEMA 4 — Analytics.jsx com erro 500 + Recharts warning
════════════════════════════════════════

A) Erro 500: mesmo que Roadmaps — verificar syntax errors e imports.

B) Warning do Recharts "width(-1) and height(-1)":
Todos os gráficos Recharts precisam estar dentro de um container
com dimensões definidas. Envolver cada gráfico em:

<div style={{ width: '100%', minHeight: 200 }}>
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>
      ...
    </LineChart>
  </ResponsiveContainer>
</div>

Verificar TODOS os gráficos em Analytics.jsx e garantir que
cada um está dentro de ResponsiveContainer com height numérico
(não percentual) e dentro de um div com width definido.

C) THREE.Clock deprecated warning:
Se Analytics.jsx ou KnowledgeMap.jsx usar Three.js, substituir:
  new THREE.Clock() → new THREE.Timer()
Ou remover o uso de Three.js se não for essencial para a página.

D) FirebaseError Missing permissions em "recursos":
Verificar qual coleção está sendo acessada como "recursos".
Garantir que o path usado é users/{uid}/recursos/{id}
e que o uid vem de user?.uid (não user?.id).

════════════════════════════════════════
PROBLEMA 5 — Feed Tech não retorna notícias
════════════════════════════════════════

Reescrever feedService.js completamente:

const PROXY     = 'https://api.allorigins.win/get?url=';
const CACHE_KEY = 'syntax:feedCache:v3';
const CACHE_TTL = 4 * 60 * 60 * 1000;

function lerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function salvarCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data, ts: Date.now()
    }));
  } catch {}
}

const RSS_SOURCES = [
  { id: 'hn',           name: 'Hacker News',       url: 'https://news.ycombinator.com/rss',       category: 'geral',       icon: '📰' },
  { id: 'devto_js',     name: 'Dev.to JavaScript',  url: 'https://dev.to/feed/tag/javascript',      category: 'frontend',    icon: '💛' },
  { id: 'devto_web',    name: 'Dev.to Webdev',      url: 'https://dev.to/feed/tag/webdev',          category: 'frontend',    icon: '🌐' },
  { id: 'devto_python', name: 'Dev.to Python',      url: 'https://dev.to/feed/tag/python',          category: 'backend',     icon: '🐍' },
  { id: 'devto_career', name: 'Dev.to Carreira',    url: 'https://dev.to/feed/tag/career',          category: 'carreira',    icon: '🚀' },
  { id: 'github',       name: 'GitHub Blog',        url: 'https://github.blog/feed/',               category: 'geral',       icon: '🐙' },
  { id: 'css_tricks',   name: 'CSS-Tricks',         url: 'https://css-tricks.com/feed/',            category: 'frontend',    icon: '🎨' },
  { id: 'fowler',       name: 'Martin Fowler',      url: 'https://martinfowler.com/feed.atom',      category: 'arquitetura', icon: '🏗️' },
];

async function fetchRSSSource(source) {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 10000);

  try {
    const proxyUrl = `${PROXY}${encodeURIComponent(source.url)}`;
    const res      = await fetch(proxyUrl, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json.contents) throw new Error('Sem conteúdo');

    const parser     = new DOMParser();
    const xml        = parser.parseFromString(json.contents, 'text/xml');
    const parseError = xml.querySelector('parsererror');
    if (parseError) throw new Error('XML inválido');

    const items = Array.from(xml.querySelectorAll('item, entry'));
    if (items.length === 0) throw new Error('Sem itens');

    return items.slice(0, 12).map((item, idx) => {
      const linkEl    = item.querySelector('link');
      const link      = linkEl?.textContent?.trim() ||
                        linkEl?.getAttribute('href') || '#';
      const pubDate   = item.querySelector('pubDate')?.textContent?.trim() ||
                        item.querySelector('published')?.textContent?.trim() ||
                        item.querySelector('updated')?.textContent?.trim() ||
                        new Date().toISOString();
      const descRaw   = item.querySelector('description, summary, content')
                          ?.textContent ?? '';
      const desc      = descRaw.replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ').trim().slice(0, 200);
      const thumbnail = item.querySelector('media\\:thumbnail')?.getAttribute('url') ||
                        item.querySelector('enclosure[type^="image"]')?.getAttribute('url') ||
                        descRaw.match(/<img[^>]+src=["']([^"']+)["']/)?.[1] ||
                        null;
      return {
        id:          `${source.id}_${idx}_${Date.now()}`,
        title:       item.querySelector('title')?.textContent?.trim() || 'Sem título',
        link:        link.startsWith('http') ? link : `https://${link}`,
        description: desc || 'Sem descrição.',
        pubDate,
        author:      item.querySelector('author name, dc\\:creator, creator')
                       ?.textContent?.trim() || source.name,
        thumbnail,
        source:      source.name,
        sourceId:    source.id,
        category:    source.category,
        icon:        source.icon,
      };
    });
  } catch (err) {
    console.warn(`[Feed] ${source.name}: ${err.message}`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPersonalizedFeed(userStack = []) {
  const cached = lerCache();
  if (cached && cached.length > 0) return cached;

  const results = await Promise.allSettled(
    RSS_SOURCES.map(s => fetchRSSSource(s))
  );

  const all = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(a => a.title !== 'Sem título' && a.link !== '#')
    .sort((a, b) => {
      const da = new Date(a.pubDate);
      const db = new Date(b.pubDate);
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return db - da;
    });

  if (all.length > 0) salvarCache(all);
  return all;
}

export function limparCacheFeed() {
  localStorage.removeItem(CACHE_KEY);
}

Em FeedTech.jsx:
- Skeleton loading durante fetch (não spinner)
- Empty state com botão "Tentar novamente" se array vazio
- Botão "Atualizar" que chama limparCacheFeed() e refetch

════════════════════════════════════════
PROBLEMA 6 — Capas dos livros com 404
════════════════════════════════════════

A) Em techBooks.js:
Setar cover: null em TODOS os livros sem exceção.
Não usar URLs de Amazon, Google, ou qualquer domínio externo.

B) Em BookCard.jsx, substituir <img> por BookCover:

function BookCover({ book }) {
  const [imgError, setImgError] = useState(false);

  const palette = {
    'Algoritmos':     { bg: '#1e1b4b', accent: '#818cf8', emoji: '⚡' },
    'Arquitetura':    { bg: '#0c1a2e', accent: '#06b6d4', emoji: '🏗️' },
    'Frontend':       { bg: '#1a0e2e', accent: '#a78bfa', emoji: '🎨' },
    'Backend':        { bg: '#0a1f1a', accent: '#34d399', emoji: '⚙️' },
    'Carreira':       { bg: '#1f1505', accent: '#fbbf24', emoji: '🚀' },
    'Soft Skills':    { bg: '#1f0a1a', accent: '#f472b6', emoji: '🧠' },
    'DevOps':         { bg: '#0a1a0a', accent: '#4ade80', emoji: '🔧' },
    'Banco de Dados': { bg: '#0f1729', accent: '#60a5fa', emoji: '🗄️' },
  };

  const colors = palette[book.category] ??
    { bg: '#0f172a', accent: '#6366f1', emoji: '📚' };

  if (book.cover && !imgError) {
    return (
      <img src={book.cover} alt={book.title} loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover" />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center
                    justify-center p-4 text-center select-none"
      style={{ backgroundColor: colors.bg }}>
      <span className="text-4xl mb-3">{colors.emoji}</span>
      <p className="text-[11px] font-bold leading-tight mb-1.5 line-clamp-3"
        style={{ color: colors.accent }}>{book.title}</p>
      <p className="text-[9px] opacity-60 line-clamp-2"
        style={{ color: colors.accent }}>{book.author}</p>
      {book.year && (
        <p className="text-[9px] mt-2 opacity-40 font-mono"
          style={{ color: colors.accent }}>{book.year}</p>
      )}
    </div>
  );
}
BookCover.displayName = 'BookCover';

════════════════════════════════════════
PROBLEMA 7 — TEMA CLARO INCOMPLETO
Verificar e corrigir TODOS os arquivos do sistema
════════════════════════════════════════

REGRA GERAL DE CONVERSÃO — aplicar em TODOS os arquivos:

Fundos:
  bg-slate-950  →  bg-slate-50   dark:bg-slate-950
  bg-slate-900  →  bg-white      dark:bg-slate-900
  bg-slate-800  →  bg-slate-100  dark:bg-slate-800
  bg-[#0d1117]  →  bg-white      dark:bg-[#0d1117]
  bg-[#161b27]  →  bg-slate-50   dark:bg-[#161b27]
  bg-[#0B1120]  →  bg-white      dark:bg-[#0B1120]

Textos:
  text-white     →  text-slate-900  dark:text-white
  text-slate-200 →  text-slate-700  dark:text-slate-200
  text-slate-300 →  text-slate-600  dark:text-slate-300
  text-slate-400 →  text-slate-500  dark:text-slate-400

Bordas:
  border-white/5   →  border-slate-200  dark:border-white/5
  border-white/10  →  border-slate-200  dark:border-white/10
  border-slate-800 →  border-slate-200  dark:border-slate-800
  border-slate-700 →  border-slate-300  dark:border-slate-700

Inputs:
  bg-slate-950 →  bg-white      dark:bg-slate-950
  bg-slate-900 →  bg-slate-50   dark:bg-slate-900

Botões secundários:
  bg-white/5   →  bg-slate-100  dark:bg-white/5
  bg-white/10  →  bg-slate-200  dark:bg-white/10

── NAVBAR (Layout.jsx) ──────────────────

A navbar está com bg-[#0B1120]/85 fixo causando fundo escuro no claro.
Corrigir em Layout.jsx:

// ANTES:
className="... bg-[#0B1120]/85 ..."

// DEPOIS:
className="... bg-white/90 dark:bg-[#0B1120]/85 ..."

Textos da navbar também precisam de dark:
  text-white → text-slate-900 dark:text-white
  text-slate-400 → text-slate-600 dark:text-slate-400
  text-slate-200 → text-slate-800 dark:text-slate-200
  border-slate-800/80 → border-slate-200 dark:border-slate-800/80

O input de busca se existir na navbar:
  bg-slate-800/40 → bg-slate-100 dark:bg-slate-800/40
  text-slate-400 → text-slate-500 dark:text-slate-400

── SIDEBAR (Sidebar.jsx) ────────────────

  bg-slate-900/90 → bg-white/90 dark:bg-slate-900/90
  text-slate-400  → text-slate-600 dark:text-slate-400
  text-slate-500  → text-slate-500 dark:text-slate-500
  border-white/5  → border-slate-200 dark:border-white/5
  bg-white/[0.03] → bg-slate-100 dark:bg-white/[0.03]
  bg-slate-50 dark:bg-slate-900 para o fundo do wrapper

Active state dos links:
  bg-indigo-50/80 dark:bg-indigo-900/30 — já correto
  text-indigo-700 dark:text-cyan-400 — já correto

── HOME.JSX ─────────────────────────────

Verificar TODOS os cards KPI, seções e textos.
Cards devem ter:
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-800
  text-slate-900 dark:text-white (títulos)
  text-slate-500 dark:text-slate-400 (subtítulos)

Gráficos/charts na home:
  Verificar cores dos eixos e labels — devem ser legíveis no claro
  stroke="rgba(255,255,255,0.1)" → stroke="rgba(0,0,0,0.1)" no claro

── ADABOT.JSX ───────────────────────────

O painel da Ada está com fundo #0d1117 fixo.
Corrigir:
  background: '#0d1117' → usar classe: bg-white dark:bg-[#0d1117]
  background: '#161b27' → bg-slate-50 dark:bg-[#161b27]
  border: '1px solid rgba(255,255,255,0.07)' →
    className="border border-slate-200 dark:border-white/[0.07]"

Mensagens do usuário:
  background azul gradiente — manter em ambos os modos (já tem contraste)

Mensagens da Ada:
  bg-white/[0.03] → bg-slate-50 dark:bg-white/[0.03]
  border-white/[0.06] → border-slate-200 dark:border-white/[0.06]
  text-slate-300 → text-slate-600 dark:text-slate-300

Input da Ada:
  background rgba(255,255,255,0.04) →
    className="bg-slate-50 dark:bg-white/[0.04]"
  border rgba(255,255,255,0.08) →
    className="border-slate-200 dark:border-white/[0.08]"
  color '#e2e8f0' → className="text-slate-900 dark:text-slate-200"

Quick actions:
  bg rgba(255,255,255,0.03) → bg-slate-100 dark:bg-white/[0.03]
  border rgba(255,255,255,0.05) → border-slate-200 dark:border-white/[0.05]
  text-slate-500 → text-slate-500 dark:text-slate-500

── POMODORO (PomodoroTimer.jsx) ─────────

Botão minimizado:
  background linear-gradient escuro → manter no dark
  No light: usar fundo branco com sombra e borda
  Detectar isDarkMode e aplicar background diferente:

  const { isDarkMode } = useTheme();
  style={{
    background: isRunning
      ? (modo já tem gradiente colorido — manter em ambos)
      : isDarkMode
        ? 'linear-gradient(135deg, #020617 0%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    border: isDarkMode ? '2px solid rgba(255,255,255,0.1)' : '2px solid #e2e8f0',
  }}

Painel expandido (bg-slate-900, bg-slate-950):
  bg-slate-900 → bg-white dark:bg-slate-900
  bg-slate-950 → bg-slate-50 dark:bg-slate-950
  text-white → text-slate-900 dark:text-white
  text-slate-500 → text-slate-500 dark:text-slate-500
  border-white/5 → border-slate-200 dark:border-white/5
  bg-white/5 → bg-slate-100 dark:bg-white/5

Lofi Buffer no pomodoro:
  bg-slate-900 → bg-slate-50 dark:bg-slate-900
  text-slate-500 → text-slate-500 dark:text-slate-500
  bg-slate-800 → bg-slate-200 dark:bg-slate-800 (barra de volume)

── BOTTOM NAVIGATION ────────────────────

  bg-slate-900 → bg-white dark:bg-slate-900
  border-white/10 → border-slate-200 dark:border-white/10
  text-slate-400 → text-slate-500 dark:text-slate-400
  text-white (ativo) → text-indigo-600 dark:text-white

── PÁGINAS DAS FASES 1, 2 e 3 ───────────

Corrigir na ordem:
1.  src/pages/IDE.jsx + componentes ide/
2.  src/pages/FeedTech.jsx + componentes feed/
3.  src/pages/MockInterview.jsx
4.  src/pages/StudyRooms.jsx + componentes rooms/
5.  src/pages/Community.jsx + componentes community/
6.  src/pages/PeerReview.jsx + componentes peer/
7.  src/pages/GitHubIntegration.jsx + componentes github/
8.  src/pages/KnowledgeMap.jsx + componentes knowledge/
9.  src/pages/Roadmaps.jsx + componentes roadmap/
10. src/pages/Analytics.jsx + componentes analytics/

── TOASTER (App.jsx ou main.jsx) ────────

Localizar onde o Toaster está declarado e corrigir:

// ANTES (tema fixo):
<Toaster theme="dark" />

// DEPOIS (tema dinâmico):
// Mover para dentro do componente com acesso ao ThemeContext:
const { isDarkMode } = useTheme();
<Toaster
  theme={isDarkMode ? 'dark' : 'light'}
  position="top-right"
  richColors
  toastOptions={{ style: { fontFamily: 'inherit' } }}
/>

════════════════════════════════════════
CHECKLIST DE QA — verificar tudo no modo claro
════════════════════════════════════════

Após todas as correções, alternar para modo claro e verificar:

LAYOUT GERAL:
[ ] Navbar: fundo branco/transparente, textos escuros, bordas visíveis
[ ] Sidebar: fundo branco, ícones e textos escuros, active state indigo
[ ] Bottom Navigation: fundo branco, ícone ativo indigo
[ ] Fundo das páginas: branco/slate-50, não escuro

HOME:
[ ] Cards KPI com fundo branco e texto escuro
[ ] Gráficos com eixos e labels legíveis
[ ] Seção de boas-vindas com texto escuro

ADA (Chatbot):
[ ] Painel com fundo branco
[ ] Mensagens da Ada com fundo claro e texto escuro
[ ] Input com fundo branco e texto escuro
[ ] Quick actions legíveis

POMODORO:
[ ] Botão minimizado visível no claro
[ ] Painel expandido com fundo branco
[ ] Textos e controles legíveis
[ ] Lofi Buffer visível

PÁGINAS FASES 1-3:
[ ] IDE: toolbar e painéis com tema claro
[ ] Feed: cards brancos, textos escuros
[ ] Mock Interview: sala legível no claro
[ ] Study Rooms: cards legíveis
[ ] Community: biblioteca com tema claro
[ ] Peer Review: editor e comentários legíveis
[ ] GitHub: repos e análises legíveis
[ ] Knowledge Map: nós legíveis no claro
[ ] Roadmaps: sem erro 500, tema claro aplicado
[ ] Analytics: gráficos sem warning, tema claro aplicado

TOASTS:
[ ] Aparecem com fundo branco no modo claro
[ ] Texto escuro e legível
[ ] success/error/info com cores corretas

Se qualquer item falhar, corrigir antes de finalizar.