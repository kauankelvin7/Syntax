import { db } from '../config/firebase-config';
import { collection, query, getDocs, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { getGitHubConnection } from './githubService';

/**
 * Busca linguagens do GitHub para compor o radar de skills.
 */
async function getGitHubSkills(uid) {
  const conn = await getGitHubConnection(uid);
  if (!conn?.token) return {};

  try {
    const res = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
      headers: { Authorization: `token ${conn.token}` }
    });
    if (!res.ok) return {};
    const repos = await res.json();

    // Agregar bytes por linguagem
    const langTotals = {};
    for (const repo of repos.slice(0, 10)) {
      if (!repo.language) continue;
      langTotals[repo.language] = (langTotals[repo.language] || 0) + (repo.size || 1);
    }

    // Normalizar para 0-100
    const maxVal = Math.max(...Object.values(langTotals), 1);
    const normalized = {};
    Object.entries(langTotals).forEach(([lang, val]) => {
      normalized[lang.toLowerCase()] = Math.round((val / maxVal) * 100);
    });

    return normalized; // { javascript: 95, typescript: 80, python: 40 }
  } catch { return {}; }
}

/**
 * Calcula o Readiness Score do usuário (0-100).
 * Pesos:
 * 30% - SM-2 ease factor médio dos flashcards
 * 25% - Performance nos simulados (últimos 30 dias)
 * 25% - Progresso no roadmap da trilha selecionada
 * 20% - Consistência de estudo (streak + heatmap)
 */
export async function calculateReadinessScore(uid, returnFullObject = false) {
  try {
    // 1. SM-2 Ease Factor (30%)
    const flashcardsSnap = await getDocs(collection(db, `users/${uid}/flashcards`));
    let avgEase = 0;
    if (!flashcardsSnap.empty) {
      const eases = flashcardsSnap.docs.map(d => d.data().easeFactor || 2.5);
      avgEase = eases.reduce((a, b) => a + b, 0) / eases.length;
    }
    const sm2Score = (avgEase / 5) * 100 * 0.3; // Normalizando 5 como max ease

    // 2. Simulados (25%)
    const simuladosSnap = await getDocs(query(collection(db, `users/${uid}/simulados`), where('timestamp', '>', Date.now() - 30 * 24 * 60 * 60 * 1000)));
    let avgSimulado = 0;
    if (!simuladosSnap.empty) {
      const scores = simuladosSnap.docs.map(d => d.data().score || 0);
      avgSimulado = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    const simuladoScore = avgSimulado * 0.25;

    // 3. Roadmap Progress (25%)
    const roadmapSnap = await getDocs(collection(db, `users/${uid}/roadmapProgress`));
    let maxProgress = 0;
    roadmapSnap.forEach(d => {
      maxProgress = Math.max(maxProgress, d.data().overallProgress || 0);
    });
    const roadmapScore = maxProgress * 0.25;

    // 4. Consistência (20%)
    const dashSnap = await getDoc(doc(db, 'users', uid));
    const streak = dashSnap.data()?.offensiveStreak || 0;
    const streakScore = Math.min(streak * 2, 100) * 0.2; // 50 dias = 100% streak score

    const totalScore = Math.round(sm2Score + simuladoScore + roadmapScore + streakScore);
    
    const result = {
      score: totalScore,
      updatedAt: Date.now(),
      breakdown: { sm2Score, simuladoScore, roadmapScore, streakScore }
    };

    await setDoc(doc(db, `users/${uid}/analytics`, 'readiness'), result);

    return returnFullObject ? result : totalScore;
  } catch (error) {
    console.error('Erro ao calcular readiness score:', error);
    return returnFullObject ? { score: 0, breakdown: null } : 0;
  }
}

/**
 * Calcula scores de habilidade por área.
 */
export async function calculateSkillScores(uid) {
  try {
    const flashcardsSnap = await getDocs(collection(db, `users/${uid}/flashcards`));
    const skills = {};

    flashcardsSnap.forEach(doc => {
      const data = doc.data();
      const area = data.materiaNome || 'Geral';
      if (!skills[area]) skills[area] = { totalEase: 0, count: 0 };
      skills[area].totalEase += data.easeFactor || 2.5;
      skills[area].count += 1;
    });

    const skillResults = Object.entries(skills).map(([subject, data]) => ({
      subject,
      score: Math.round((data.totalEase / (data.count * 5)) * 100),
      fullMark: 100
    }));

    // Integrar Skills do GitHub
    try {
      const githubSkills = await getGitHubSkills(uid);
      Object.entries(githubSkills).forEach(([lang, score]) => {
        // Se já existe a skill via flashcards, fazemos uma média ou pegamos o maior?
        // Vamos adicionar como novas entradas se não existirem, ou atualizar se o GitHub for maior.
        const existingIdx = skillResults.findIndex(s => s.subject.toLowerCase() === lang.toLowerCase());
        if (existingIdx >= 0) {
          skillResults[existingIdx].score = Math.max(skillResults[existingIdx].score, score);
        } else {
          skillResults.push({
            subject: lang.charAt(0).toUpperCase() + lang.slice(1),
            score,
            fullMark: 100
          });
        }
      });
    } catch (err) {
      console.error('[Analytics] Erro ao integrar skills do GitHub:', err);
    }

    await setDoc(doc(db, `users/${uid}/analytics`, 'skills'), {
      skills: skillResults,
      updatedAt: Date.now()
    });

    return skillResults;
  } catch (error) {
    console.error('Erro ao calcular skill scores:', error);
    return [];
  }
}

/**
 * Constrói dados para o heatmap de estudos.
 */
export async function buildHeatmapData(uid, days = 365) {
  try {
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const historySnap = await getDocs(query(collection(db, `users/${uid}/pomodoroHistory`), where('timestamp', '>', startTime)));
    
    const heatmap = {};
    historySnap.forEach(doc => {
      const data = doc.data();
      const dateStr = new Date(data.timestamp).toISOString().split('T')[0];
      if (!heatmap[dateStr]) heatmap[dateStr] = { minutes: 0, sessions: 0 };
      heatmap[dateStr].minutes += data.duration || 25;
      heatmap[dateStr].sessions += 1;
    });

    return heatmap;
  } catch (error) {
    console.error('Erro ao buscar dados do heatmap:', error);
    return {};
  }
}
