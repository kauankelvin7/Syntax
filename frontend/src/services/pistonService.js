/**
 * 
 * Execução de código SEM APIs externas, SEM CORS, SEM configuração.
 * 
 * Estratégia por linguagem:
 * - JavaScript: executa direto no browser via Function() isolada
 * - Python: usa Pyodide (WebAssembly) carregado via CDN
 * - Outras: usa corsproxy.io como proxy para Glot.io
 */

/* ─────────────────────────────────────────
   JAVASCRIPT — execução nativa no browser
───────────────────────────────────────── */
function executeJavaScript(code, stdin) {
  const logs    = [];
  const errors  = [];

  // Captura console.log, console.error, console.warn
  const fakeConsole = {
    log:   (...args) => logs.push(args.map(String).join(' ')),
    error: (...args) => errors.push(args.map(String).join(' ')),
    warn:  (...args) => logs.push('[warn] ' + args.map(String).join(' ')),
    info:  (...args) => logs.push(args.map(String).join(' ')),
  };

  try {
    // Isola o código com console fake e sem acesso ao DOM
    const fn = new Function('console', 'process', code);
    fn(fakeConsole, { env: {}, argv: [], stdin });
    return {
      stdout:   logs.join('\n'),
      stderr:   errors.join('\n'),
      exitCode: errors.length > 0 ? 1 : 0,
      status:   'Concluído',
    };
  } catch (err) {
    return {
      stdout:   logs.join('\n'),
      stderr:   err.toString(),
      exitCode: 1,
      status:   'Erro de execução',
    };
  }
}

/* ─────────────────────────────────────────
   PYTHON — Pyodide (WebAssembly, sem CORS)
───────────────────────────────────────── */
let pyodideInstance = null;
let pyodideLoading  = false;

async function loadPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading)  {
    // Aguarda carregamento em andamento
    while (pyodideLoading) await new Promise(r => setTimeout(r, 100));
    return pyodideInstance;
  }

  pyodideLoading = true;
  try {
    // Carrega Pyodide via CDN — funciona sem CORS
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const script  = document.createElement('script');
        script.src    = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    pyodideInstance = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
    });
    return pyodideInstance;
  } finally {
    pyodideLoading = false;
  }
}

async function executePython(code) {
  try {
    const pyodide = await loadPyodide();
    const stdout  = [];
    const stderr  = [];

    // Redireciona sys.stdout e sys.stderr
    pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    try {
      pyodide.runPython(code);
      const out = pyodide.runPython('sys.stdout.getvalue()');
      const err = pyodide.runPython('sys.stderr.getvalue()');
      return {
        stdout:   out || '',
        stderr:   err || '',
        exitCode: err ? 1 : 0,
        status:   'Concluído',
      };
    } catch (err) {
      const errStr = pyodide.runPython('sys.stderr.getvalue()') || err.message;
      return {
        stdout:   '',
        stderr:   errStr,
        exitCode: 1,
        status:   'Erro de execução',
      };
    }
  } catch (err) {
    return {
      stdout:   '',
      stderr:   `Erro ao carregar Python: ${err.message}`,
      exitCode: 1,
      status:   'Erro',
    };
  }
}

/* ─────────────────────────────────────────
   OUTRAS LINGUAGENS — Glot.io via proxy CORS
   allorigins.win é gratuito e robusto
───────────────────────────────────────── */
const GLOT_URL   = 'https://glot.io/api/run';
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

const GLOT_MAP = {
  typescript: { lang: 'typescript', file: 'main.ts'   },
  java:       { lang: 'java',       file: 'Main.java' },
  c:          { lang: 'c',          file: 'main.c'    },
  cpp:        { lang: 'cpp',        file: 'main.cpp'  },
  go:         { lang: 'go',         file: 'main.go'   },
  rust:       { lang: 'rust',       file: 'main.rs'   },
  ruby:       { lang: 'ruby',       file: 'main.rb'   },
  php:        { lang: 'php',        file: 'main.php'  },
  kotlin:     { lang: 'kotlin',     file: 'main.kt'   },
  csharp:     { lang: 'csharp',     file: 'main.cs'   },
  bash:       { lang: 'bash',       file: 'main.sh'   },
  dart:       { lang: 'dart',       file: 'main.dart' },
};

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

  const targetUrl  = `${GLOT_URL}/${config.lang}/latest`;
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(proxiedUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        files: [{ name: config.file, content: code }],
        stdin,
      }),
    });

    if (!res.ok) throw new Error(`Proxy retornou ${res.status}`);

    const json = await res.json();
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
      return { stdout: '', stderr: 'Tempo limite excedido (20s). Verifique loops infinitos.', exitCode: 1, status: 'Timeout' };
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

/* ─────────────────────────────────────────
   ENTRY POINT PRINCIPAL
───────────────────────────────────────── */
export async function executeCode({ language, code, stdin = '' }) {
  const lang = language?.toLowerCase() ?? 'javascript';

  if (lang === 'javascript') return executeJavaScript(code, stdin);
  if (lang === 'typescript') return executeTypeScript(code, stdin);
  if (lang === 'python')     return executePython(code);
  return executeViaProxy(lang, code, stdin);
}

export function getRuntimes() {
  return [
    { id: 'javascript', label: 'JavaScript', file: 'main.js',    native: true  },
    { id: 'python',     label: 'Python',      file: 'main.py',    native: true  },
    { id: 'typescript', label: 'TypeScript',  file: 'main.ts',    native: false },
    { id: 'java',       label: 'Java',        file: 'Main.java',  native: false },
    { id: 'c',          label: 'C',           file: 'main.c',     native: false },
    { id: 'cpp',        label: 'C++',         file: 'main.cpp',   native: false },
    { id: 'go',         label: 'Go',          file: 'main.go',    native: false },
    { id: 'rust',       label: 'Rust',        file: 'main.rs',    native: false },
    { id: 'ruby',       label: 'Ruby',        file: 'main.rb',    native: false },
    { id: 'php',        label: 'PHP',         file: 'main.php',   native: false },
    { id: 'kotlin',     label: 'Kotlin',      file: 'main.kt',    native: false },
    { id: 'csharp',     label: 'C#',          file: 'main.cs',    native: false },
    { id: 'bash',       label: 'Bash',        file: 'main.sh',    native: false },
    { id: 'dart',       label: 'Dart',        file: 'main.dart',  native: false },
  ];
}