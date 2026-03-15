/**
 * feedService.js
 * Feed de notícias tech via APIs diretas (CORS aberto).
 * Sem proxy, sem API key — cache no localStorage.
 */

const CACHE_KEY = 'syntax:feedCache:v5';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas

function lerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function salvarCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota exceeded */ }
}

// ── Dev.to API (CORS aberto, sem key) ──────────────────────────
async function fetchDevTo(tag, perPage = 15) {
  const res = await fetch(
    `https://dev.to/api/articles?tag=${tag}&per_page=${perPage}&state=rising`,
    { headers: { 'Accept': 'application/json' } }
  );
  if (!res.ok) throw new Error(`Dev.to ${tag}: ${res.status}`);
  const articles = await res.json();
  return articles.map(a => ({
    id:          `devto_${a.id}`,
    title:       a.title,
    link:        a.url,
    description: a.description || a.title,
    pubDate:     a.published_at,
    author:      a.user?.name || 'Dev.to',
    thumbnail:   a.cover_image || a.social_image || null,
    source:      'Dev.to',
    sourceId:    `devto_${tag}`,
    category:    tag === 'javascript' || tag === 'webdev' || tag === 'css' ? 'frontend'
               : tag === 'python'     || tag === 'node'   || tag === 'api'  ? 'backend'
               : tag === 'devops'     || tag === 'docker'                   ? 'devops'
               : tag === 'career'     || tag === 'productivity'             ? 'carreira'
               : 'geral',
    icon: '💛',
    readingTime: a.reading_time_minutes,
    reactions:   a.public_reactions_count,
  }));
}

// ── HackerNews Firebase API (CORS aberto) ──────────────────────
async function fetchHackerNews(limit = 20) {
  // Buscar IDs das top stories
  const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  if (!idsRes.ok) throw new Error(`HN ids: ${idsRes.status}`);
  const ids = await idsRes.json();

  // Buscar os primeiros N items em paralelo
  const items = await Promise.allSettled(
    ids.slice(0, limit).map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(r => r.json())
    )
  );

  return items
    .filter(r => r.status === 'fulfilled' && r.value?.url)
    .map(r => r.value)
    .map(item => ({
      id:          `hn_${item.id}`,
      title:       item.title,
      link:        item.url,
      description: `${item.score} pontos · ${item.descendants || 0} comentários`,
      pubDate:     new Date(item.time * 1000).toISOString(),
      author:      item.by || 'Hacker News',
      thumbnail:   null,
      source:      'Hacker News',
      sourceId:    'hackernews',
      category:    'geral',
      icon:        '📰',
      score:       item.score,
    }));
}

// ── GitHub Trending via Search API (CORS aberto) ───────────────
async function fetchGitHubArticles() {
  const date = new Date();
  date.setDate(date.getDate() - 3);
  const since = date.toISOString().split('T')[0];

  const res = await fetch(
    `https://api.github.com/search/repositories?q=stars:>100+created:>${since}&sort=stars&order=desc&per_page=10`,
    { headers: { Accept: 'application/vnd.github.v3+json' } }
  );
  if (!res.ok) throw new Error(`GitHub search: ${res.status}`);
  const data = await res.json();

  return (data.items || []).map(repo => ({
    id:          `gh_${repo.id}`,
    title:       `⭐ ${repo.full_name} — ${repo.stargazers_count.toLocaleString()} stars`,
    link:        repo.html_url,
    description: repo.description || 'Repositório em alta no GitHub.',
    pubDate:     repo.created_at,
    author:      repo.owner?.login || 'GitHub',
    thumbnail:   repo.owner?.avatar_url || null,
    source:      'GitHub Trending',
    sourceId:    'github_trending',
    category:    'geral',
    icon:        '🐙',
  }));
}

// ── Entry point principal ──────────────────────────────────────
export async function getPersonalizedFeed(userStack = []) {
  const cached = lerCache();
  if (cached && cached.length > 0) return cached;

  // Buscar de todas as fontes em paralelo
  // Todas têm CORS aberto — sem proxy necessário
  const [hn, jsArticles, webdevArticles, pythonArticles,
         careerArticles, cssArticles, devopsArticles, ghArticles] =
    await Promise.allSettled([
      fetchHackerNews(15),
      fetchDevTo('javascript', 10),
      fetchDevTo('webdev', 10),
      fetchDevTo('python', 8),
      fetchDevTo('career', 6),
      fetchDevTo('css', 6),
      fetchDevTo('devops', 5),
      fetchGitHubArticles(),
    ]);

  const allArticles = [
    ...(hn.status           === 'fulfilled' ? hn.value           : []),
    ...(jsArticles.status   === 'fulfilled' ? jsArticles.value   : []),
    ...(webdevArticles.status === 'fulfilled' ? webdevArticles.value : []),
    ...(pythonArticles.status === 'fulfilled' ? pythonArticles.value : []),
    ...(careerArticles.status === 'fulfilled' ? careerArticles.value : []),
    ...(cssArticles.status  === 'fulfilled' ? cssArticles.value  : []),
    ...(devopsArticles.status === 'fulfilled' ? devopsArticles.value : []),
    ...(ghArticles.status   === 'fulfilled' ? ghArticles.value   : []),
  ].filter(a => a.title && a.link);

  // Remover duplicatas por link
  const seen = new Set();
  const unique = allArticles.filter(a => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  // Ordenar por data mais recente
  unique.sort((a, b) => {
    const da = new Date(a.pubDate);
    const db = new Date(b.pubDate);
    if (isNaN(da)) return 1;
    if (isNaN(db)) return -1;
    return db - da;
  });

  if (unique.length > 0) salvarCache(unique);
  return unique;
}

export async function getGitHubTrending(userStack = []) {
  try {
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

    const results = await Promise.allSettled(
      languages.map(lang =>
        fetch(
          `https://api.github.com/search/repositories?q=language:${lang}+created:>${since}&sort=stars&order=desc&per_page=3`,
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
  } catch (err) {
    console.warn('[Feed] GitHub Trending falhou:', err.message);
    return [];
  }
}

export function limparCacheFeed() {
  localStorage.removeItem(CACHE_KEY);
}
