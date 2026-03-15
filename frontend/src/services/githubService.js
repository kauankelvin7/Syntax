import {
  doc, setDoc, getDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import {
  GithubAuthProvider, GoogleAuthProvider,
  signInWithPopup, fetchSignInMethodsForEmail,
  linkWithCredential, getAuth,
} from 'firebase/auth';
import { db } from '../config/firebase-config';

const GITHUB_BASE = 'https://api.github.com';

/* ─────────────────────────────────────────────────────────────
   CONEXÃO — conectar, recuperar, desconectar
───────────────────────────────────────────────────────────── */

/**
 * Conecta o GitHub via OAuth do Firebase e persiste no Firestore.
 * Trata automaticamente o caso de email já existir com Google.
 */
export async function connectGitHub(uid) {
  const auth     = getAuth();
  const provider = new GithubAuthProvider();
  provider.addScope('read:user');
  provider.addScope('repo');

  try {
    const result     = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token      = credential?.accessToken;
    const username   =
      result.additionalUserInfo?.username ||
      result.user?.reloadUserInfo?.screenName ||
      result.user?.displayName;

    if (!token) throw new Error('Token não obtido — tente novamente.');

    await _persistConnection(uid, token, username);

    // Verificar conquistas em background (não bloqueia o retorno)
    verificarConquistasGitHub(uid, token, username).catch(() => {});

    return { token, username };

  } catch (err) {
    // ── Conta duplicada: email já existe com outro provider ──
    if (err.code === 'auth/account-exists-with-different-credential') {
      const email      = err.customData?.email;
      const githubCred = GithubAuthProvider.credentialFromError(err);

      if (!email || !githubCred) {
        throw new Error(
          'Seu email já está cadastrado com outro método de login. ' +
          'Faça login com Google primeiro e depois conecte o GitHub.'
        );
      }

      const methods = await fetchSignInMethodsForEmail(auth, email).catch(() => []);

      if (methods.includes('google.com')) {
        // Re-autenticar com Google e vincular o GitHub automaticamente
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ login_hint: email });

        const googleResult = await signInWithPopup(auth, googleProvider);
        const linkResult   = await linkWithCredential(googleResult.user, githubCred);

        const token    = githubCred.accessToken;
        const username =
          linkResult.user?.providerData
            ?.find(p => p.providerId === 'github.com')?.displayName ||
          linkResult.user?.displayName;

        await _persistConnection(uid, token, username);
        verificarConquistasGitHub(uid, token, username).catch(() => {});
        return { token, username };
      }

      // Outro provider (email/senha, etc.)
      throw new Error(
        `Seu email já está cadastrado com: ${methods.join(', ')}. ` +
        'Faça login com esse método primeiro e tente conectar o GitHub novamente.'
      );
    }

    if (err.code === 'auth/popup-closed-by-user') return null;

    if (err.code === 'auth/popup-blocked') {
      throw new Error(
        'Popup bloqueado pelo navegador. ' +
        'Permita popups para este site e tente novamente.'
      );
    }

    throw err;
  }
}

/**
 * Salva token e username no Firestore + localStorage.
 * Uso interno — não exportar.
 */
async function _persistConnection(uid, token, username) {
  await setDoc(
    doc(db, 'users', uid, 'integrations', 'github'),
    {
      accessToken: token,
      username:    username ?? null,
      connectedAt: serverTimestamp(),
      lastSyncAt:  serverTimestamp(),
    },
    { merge: true }
  );
  localStorage.setItem('syntax:github:username', username ?? '');
}

/**
 * Recupera conexão existente do Firestore.
 * Retorna null se não estiver conectado.
 */
export async function getGitHubConnection(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'integrations', 'github'));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data?.accessToken) return null;
    return { token: data.accessToken, username: data.username ?? null };
  } catch {
    return null;
  }
}

/**
 * Desconecta o GitHub e remove do Firestore + localStorage.
 */
export async function disconnectGitHub(uid) {
  if (!uid) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'integrations', 'github'));
    localStorage.removeItem('syntax:github:username');
  } catch (err) {
    console.error('[GitHub] Erro ao desconectar:', err);
  }
}

/* ─────────────────────────────────────────────────────────────
   REPOSITÓRIOS
───────────────────────────────────────────────────────────── */

/**
 * Busca os repositórios do usuário autenticado (até 50, ordenados por update).
 */
export async function getUserRepos(token) {
  if (!token) return [];
  try {
    const res = await fetch(
      `${GITHUB_BASE}/user/repos?sort=updated&per_page=50&affiliation=owner`,
      { headers: _headers(token) }
    );
    if (!res.ok) throw new Error(`GitHub repos: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[GitHub] getUserRepos:', err.message);
    return [];
  }
}

/**
 * Busca detalhes de um repositório específico.
 */
export async function getRepoDetails(owner, repo, token) {
  try {
    const res = await fetch(
      `${GITHUB_BASE}/repos/${owner}/${repo}`,
      { headers: _headers(token) }
    );
    if (!res.ok) throw new Error(`GitHub repo details: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[GitHub] getRepoDetails:', err.message);
    return null;
  }
}

/**
 * Busca as linguagens de um repositório com percentual calculado.
 * Retorna: [{ name, bytes, percentage }]
 */
export async function getRepoLanguages(owner, repo, token) {
  try {
    const res = await fetch(
      `${GITHUB_BASE}/repos/${owner}/${repo}/languages`,
      { headers: _headers(token) }
    );
    if (!res.ok) throw new Error(`GitHub languages: ${res.status}`);
    const data  = await res.json();
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    return Object.entries(data)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: total > 0 ? Math.round((bytes / total) * 100) : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);
  } catch (err) {
    console.error('[GitHub] getRepoLanguages:', err.message);
    return [];
  }
}

/**
 * Busca commits recentes de um repositório com arquivos alterados.
 * Retorna até 5 commits com diffs (primeiros 3 arquivos cada).
 */
export async function getRecentCommitsWithFiles(owner, repo, token) {
  try {
    const res = await fetch(
      `${GITHUB_BASE}/repos/${owner}/${repo}/commits?per_page=5`,
      { headers: _headers(token) }
    );
    if (!res.ok) throw new Error(`GitHub commits: ${res.status}`);
    const commits = await res.json();

    const detailed = await Promise.allSettled(
      commits.slice(0, 3).map(async (c) => {
        const detailRes = await fetch(
          `${GITHUB_BASE}/repos/${owner}/${repo}/commits/${c.sha}`,
          { headers: _headers(token) }
        );
        if (!detailRes.ok) return { ...c, files: [] };
        const detail = await detailRes.json();
        return {
          sha:     c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0],
          date:    c.commit.author.date,
          author:  c.commit.author.name,
          files:   (detail.files ?? []).slice(0, 3).map(f => ({
            filename: f.filename,
            status:   f.status,
            patch:    f.patch?.slice(0, 600) ?? '',
          })),
        };
      })
    );

    return detailed
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
  } catch (err) {
    console.error('[GitHub] getRecentCommitsWithFiles:', err.message);
    return [];
  }
}

/**
 * Versão simples de commits (sem diffs) — mais rápida.
 */
export async function getRecentCommits(owner, repo, token) {
  try {
    const res = await fetch(
      `${GITHUB_BASE}/repos/${owner}/${repo}/commits?per_page=10`,
      { headers: _headers(token) }
    );
    if (!res.ok) throw new Error(`GitHub commits: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[GitHub] getRecentCommits:', err.message);
    return [];
  }
}

/**
 * Busca conteúdo de um arquivo específico (decodifica base64).
 */
export async function getFileContent(owner, repo, path, token) {
  try {
    const res = await fetch(
      `${GITHUB_BASE}/repos/${owner}/${repo}/contents/${path}`,
      { headers: _headers(token) }
    );
    if (!res.ok) throw new Error(`GitHub file: ${res.status}`);
    const data = await res.json();
    return atob(data.content.replace(/\n/g, ''));
  } catch (err) {
    console.error('[GitHub] getFileContent:', err.message);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   ANÁLISE COM GEMINI
───────────────────────────────────────────────────────────── */

/**
 * Analisa um repositório com Ada/Gemini e retorna:
 * { quality, patterns, strengths, improvements, flashcards, languages, repoName }
 *
 * Resultado é cacheado por 24h no localStorage.
 */
export async function analyzeRepoWithAda(token, owner, repo) {
  // Cache de 24h por repo
  const cacheKey = `syntax:github:analysis:${owner}:${repo}`;
  const cached   = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < 24 * 60 * 60 * 1000) return data;
  }

  const [languages, commits] = await Promise.all([
    getRepoLanguages(token, owner, repo),
    getRecentCommitsWithFiles(owner, repo, token),
  ]);

  const mainLang    = languages[0]?.name ?? 'JavaScript';
  const langSummary = languages.map(l => `${l.name} ${l.percentage}%`).join(', ');
  const codeContext = commits
    .flatMap(c => c.files.map(f => `// ${f.filename} (${f.status})\n${f.patch}`))
    .join('\n\n')
    .slice(0, 2500);

  const prompt = `Analise este repositório ${mainLang} com base nos dados reais abaixo.

Linguagens: ${langSummary}

Diffs dos últimos commits:
${codeContext || 'Sem diffs disponíveis — analise apenas pelas linguagens.'}

Retorne APENAS JSON válido (sem markdown, sem \`\`\`):
{
  "quality": { "score": 7, "observations": ["observação real"] },
  "patterns": ["padrão detectado"],
  "strengths": ["ponto forte real"],
  "improvements": ["melhoria concreta"],
  "flashcards": [
    { "pergunta": "pergunta técnica real", "resposta": "resposta clara", "concept": "conceito" },
    { "pergunta": "pergunta técnica real", "resposta": "resposta clara", "concept": "conceito" },
    { "pergunta": "pergunta técnica real", "resposta": "resposta clara", "concept": "conceito" }
  ]
}`;

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const model = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
      .getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    let   text   = result.response.text().trim()
      .replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = {
        quality:      { score: 0, observations: ['Análise indisponível no momento.'] },
        patterns:     [],
        strengths:    [],
        improvements: [],
        flashcards:   [],
      };
    }

    const finalData = {
      ...analysis,
      languages,
      repoName:   repo,
      analyzedAt: new Date().toISOString(),
    };

    localStorage.setItem(cacheKey, JSON.stringify({ data: finalData, ts: Date.now() }));
    return finalData;

  } catch (err) {
    console.error('[GitHub] analyzeRepoWithAda:', err.message);
    return {
      quality:      { score: 0, observations: ['Erro ao analisar com Ada.'] },
      patterns:     [],
      strengths:    [],
      improvements: [],
      flashcards:   [],
      languages,
      repoName:     repo,
      analyzedAt:   new Date().toISOString(),
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   STREAK UNIFICADO
───────────────────────────────────────────────────────────── */

/**
 * Verifica se o usuário fez commits no GitHub em uma data específica.
 * Usado pelo streakService para unificar streak de estudo + código.
 */
export async function verificarCommitNoDia(uid, data) {
  const conn = await getGitHubConnection(uid);
  if (!conn?.token || !conn?.username) return false;

  try {
    const dateStr  = data instanceof Date
      ? data.toISOString().split('T')[0]
      : data;
    const nextDate = new Date(dateStr);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextStr  = nextDate.toISOString().split('T')[0];

    const res = await fetch(
      `${GITHUB_BASE}/search/commits?q=author:${conn.username}+committer-date:${dateStr}..${nextStr}`,
      {
        headers: {
          ...(_headers(conn.token)),
          Accept: 'application/vnd.github.cloak-preview+json',
        },
      }
    );
    if (!res.ok) return false;
    const data2 = await res.json();
    return (data2.total_count ?? 0) > 0;
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────
   SKILLS PARA O ANALYTICS
───────────────────────────────────────────────────────────── */

/**
 * Agrega linguagens de todos os repos do usuário.
 * Retorna mapa normalizado para 0–100 (usado no SkillRadar).
 * Ex: { javascript: 95, typescript: 80, python: 40 }
 */
export async function getGitHubSkills(uid) {
  const conn = await getGitHubConnection(uid);
  if (!conn?.token) return {};

  try {
    const repos = await getUserRepos(conn.token);
    const totals = {};

    for (const repo of repos.slice(0, 15)) {
      if (!repo.language) continue;
      totals[repo.language] = (totals[repo.language] || 0) + (repo.size || 1);
    }

    const maxVal = Math.max(...Object.values(totals), 1);
    const result = {};
    Object.entries(totals).forEach(([lang, val]) => {
      result[lang.toLowerCase()] = Math.round((val / maxVal) * 100);
    });

    return result;
  } catch {
    return {};
  }
}

/* ─────────────────────────────────────────────────────────────
   CONQUISTAS
───────────────────────────────────────────────────────────── */

/**
 * Verifica e concede conquistas baseadas no histórico do GitHub.
 * Chamado automaticamente após connectGitHub.
 */
export async function verificarConquistasGitHub(uid, token, username) {
  if (!uid || !token) return [];

  try {
    const res = await fetch(
      `${GITHUB_BASE}/user/repos?per_page=100&affiliation=owner`,
      { headers: _headers(token) }
    );
    if (!res.ok) return [];
    const repos = await res.json();
    if (!Array.isArray(repos)) return [];

    const totalStars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
    const langs      = [...new Set(repos.map(r => r.language).filter(Boolean))];

    const candidatas = [
      repos.length >= 1  && { id: 'github-connected',  title: 'GitHub Sync',     desc: 'Conectou sua conta GitHub ao Syntax',        icon: '🐙', xp: 80  },
      repos.length >= 1  && { id: 'github-first-repo',  title: 'Primeiro Repo',   desc: 'Tem pelo menos 1 repositório no GitHub',     icon: '📁', xp: 30  },
      repos.length >= 10 && { id: 'github-10-repos',    title: 'Builder',         desc: '10+ repositórios no GitHub',                 icon: '🏗️', xp: 60  },
      repos.length >= 30 && { id: 'github-30-repos',    title: 'Prolífico',       desc: '30+ repositórios no GitHub',                 icon: '🚀', xp: 100 },
      totalStars >= 10   && { id: 'github-10-stars',    title: 'Reconhecido',     desc: '10+ stars nos seus repositórios',            icon: '⭐', xp: 80  },
      totalStars >= 100  && { id: 'github-100-stars',   title: 'Popular',         desc: '100+ stars nos seus repositórios',           icon: '🌟', xp: 150 },
      langs.length >= 3  && { id: 'github-polyglot',    title: 'Polyglot',        desc: '3+ linguagens nos seus repositórios',        icon: '🌐', xp: 70  },
      langs.length >= 5  && { id: 'github-multilang',   title: 'Multi-Stack',     desc: '5+ linguagens nos seus repositórios',        icon: '💻', xp: 120 },
    ].filter(Boolean);

    const novas = [];
    for (const c of candidatas) {
      const ref  = doc(db, 'users', uid, 'conquistas', c.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { ...c, conquistadoEm: serverTimestamp() });
        novas.push(c);
      }
    }

    return novas;
  } catch (err) {
    console.error('[GitHub] verificarConquistasGitHub:', err.message);
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
   TRENDING (para o Feed)
───────────────────────────────────────────────────────────── */

/**
 * Repos em alta no GitHub por linguagem.
 * Cacheado por 2h no localStorage.
 */
export async function getGitHubTrending(userStack = []) {
  const cacheKey = 'syntax:githubTrending:v3';
  const cached   = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < 2 * 60 * 60 * 1000) return data;
  }

  const languages = userStack?.length > 0
    ? userStack.slice(0, 3)
    : ['javascript', 'typescript', 'python'];

  const date = new Date();
  date.setDate(date.getDate() - 7);
  const since = date.toISOString().split('T')[0];

  try {
    const results = await Promise.allSettled(
      languages.map(lang =>
        fetch(
          `${GITHUB_BASE}/search/repositories?q=language:${lang}+created:>${since}&sort=stars&order=desc&per_page=3`,
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        )
        .then(r => r.ok ? r.json() : { items: [] })
        .then(d => (d.items ?? []).map(repo => ({
          id:          repo.id,
          name:        repo.full_name,
          description: repo.description?.slice(0, 100) ?? '',
          url:         repo.html_url,
          stars:       repo.stargazers_count,
          language:    repo.language ?? lang,
          topics:      repo.topics?.slice(0, 3) ?? [],
          ownerAvatar: repo.owner?.avatar_url ?? '',
        })))
      )
    );

    const repos = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 6);

    localStorage.setItem(cacheKey, JSON.stringify({ data: repos, ts: Date.now() }));
    return repos;
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
   UTILIDADE INTERNA
───────────────────────────────────────────────────────────── */

function _headers(token) {
  return token
    ? { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
    : { Accept: 'application/vnd.github.v3+json' };
}