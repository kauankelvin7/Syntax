import { 
  doc, setDoc, getDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

const GITHUB_BASE = 'https://api.github.com';

/**
 * Conecta o GitHub via OAuth do Firebase e persiste no Firestore.
 */
export async function connectGitHub(uid) {
  try {
    const { GithubAuthProvider, signInWithPopup, getAuth } = await import('firebase/auth');
    const auth     = getAuth();
    const provider = new GithubAuthProvider();
    provider.addScope('read:user');
    provider.addScope('repo');

    const result = await signInWithPopup(auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token    = credential?.accessToken;
    const username = result.user?.reloadUserInfo?.screenName || 
                     result.additionalUserInfo?.username || 
                     result.user?.displayName;

    if (!token) throw new Error('Token não obtido');

    // Salvar no Firestore — persiste entre sessões
    await setDoc(
      doc(db, 'users', uid, 'integrations', 'github'),
      {
        accessToken:  token,
        username,
        connectedAt:  serverTimestamp(),
        lastSyncAt:   serverTimestamp(),
      },
      { merge: true }
    );

    // Salvar também no localStorage para acesso rápido sem Firestore
    localStorage.setItem('syntax:github:username', username || '');

    // Verificar conquistas automaticamente após conectar
    await verificarConquistasGitHub(uid, token, username);

    return { token, username };
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return null;
    throw err;
  }
}

/**
 * Recupera conexão existente do Firestore.
 */
export async function getGitHubConnection(uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'integrations', 'github'));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data?.accessToken) return null;
    return { token: data.accessToken, username: data.username };
  } catch { return null; }
}

/**
 * Desconecta o GitHub e remove do Firestore.
 */
export async function disconnectGitHub(uid) {
  try {
    await deleteDoc(doc(db, 'users', uid, 'integrations', 'github'));
    localStorage.removeItem('syntax:github:username');
  } catch (err) {
    console.error('[GitHub] Erro ao desconectar:', err);
  }
}

/**
 * Concede conquistas baseadas nos dados do GitHub.
 */
export async function verificarConquistasGitHub(uid, token, username) {
  try {
    const res   = await fetch(`${GITHUB_BASE}/user/repos?per_page=100`, {
      headers: { Authorization: `token ${token}` }
    });
    if (!res.ok) return [];
    const repos = await res.json();

    const conquistas = [];
    if (repos.length >= 1)  conquistas.push({ id: 'github-first-repo',   title: 'Primeiro Repo',    desc: 'Tem pelo menos 1 repositório no GitHub' });
    if (repos.length >= 10) conquistas.push({ id: 'github-10-repos',     title: 'Builder',          desc: '10+ repositórios no GitHub' });

    const totalStars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
    if (totalStars >= 10)   conquistas.push({ id: 'github-10-stars',     title: 'Reconhecido',      desc: '10+ stars nos seus repositórios' });

    const langs = [...new Set(repos.map(r => r.language).filter(Boolean))];
    if (langs.length >= 3)  conquistas.push({ id: 'github-polyglot',     title: 'Polyglot',         desc: '3+ linguagens nos seus repositórios' });

    // Salvar conquistas que o usuário ainda não tem
    for (const c of conquistas) {
      const docRef = doc(db, 'users', uid, 'conquistas', c.id);
      const snap   = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, { ...c, conquistadoEm: serverTimestamp() });
      }
    }

    return conquistas;
  } catch (err) {
    console.error('[GitHub] Erro ao verificar conquistas:', err);
    return [];
  }
}

/**
 * Busca repositórios de um usuário no GitHub.
 */
export async function getUserRepos(username, token = null) {
  if (!username) return [];
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};
    const response = await fetch(`${GITHUB_BASE}/users/${username}/repos?sort=updated&per_page=100`, { headers });
    if (!response.ok) throw new Error('Falha ao buscar repositórios');
    return await response.json();
  } catch (error) {
    console.error('[githubService] Erro:', error);
    throw error;
  }
}

/**
 * Busca detalhes de um repositório específico.
 */
export async function getRepoDetails(owner, repo, token = null) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};
    const response = await fetch(`${GITHUB_BASE}/repos/${owner}/${repo}`, { headers });
    if (!response.ok) throw new Error('Falha ao buscar repositório');
    return await response.json();
  } catch (error) {
    console.error('[githubService] Erro ao buscar detalhes:', error);
    throw error;
  }
}

/**
 * Busca o conteúdo de um arquivo específico em um repositório.
 */
export async function getFileContent(owner, repo, path, token = null) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};
    const response = await fetch(`${GITHUB_BASE}/repos/${owner}/${repo}/contents/${path}`, { headers });
    if (!response.ok) throw new Error('Falha ao buscar arquivo');
    const data = await response.json();
    return atob(data.content);
  } catch (error) {
    console.error('[githubService] Erro ao ler arquivo:', error);
    throw error;
  }
}

/**
 * Busca commits recentes para análise de atividade.
 */
export async function getRecentCommits(owner, repo, token = null) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};
    const response = await fetch(`${GITHUB_BASE}/repos/${owner}/${repo}/commits?per_page=10`, { headers });
    if (!response.ok) throw new Error('Falha ao buscar commits');
    return await response.json();
  } catch (error) {
    console.error('[githubService] Erro ao buscar atividade:', error);
    return [];
  }
}

/**
 * Busca as linguagens usadas no repositório.
 */
export async function getRepoLanguages(owner, repo, token = null) {
  try {
    const headers = token ? { Authorization: `token ${token}` } : {};
    const response = await fetch(`${GITHUB_BASE}/repos/${owner}/${repo}/languages`, { headers });
    if (!response.ok) throw new Error('Falha ao buscar linguagens');
    return await response.json();
  } catch (error) {
    console.error('[githubService] Erro ao buscar linguagens:', error);
    return {};
  }
}
