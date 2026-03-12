/**
 * @file useSyntaxContext.js
 * @description Hook que carrega estatísticas do sistema em tempo real para injetar
 * no system prompt do Syntax (assistente de engenharia de software). Garante que o
 * agente tenha consciência do estado atual do usuário: projetos, snippets,
 * tarefas pendentes, atividade recente etc.
 *
 * @dependencies
 *  - Firebase Firestore (getDocs com queries filtradas por uid)
 *  - streakService.getStreakStats — dados de atividade diária
 *
 * @sideEffects
 *  - Realiza múltiplas leituras no Firestore a cada chamada (projetos, snippets, tarefas)
 *  - Re-executa quando eventos 'syntax:*' são disparados (via CustomEvent)
 *
 * @notes
 *  - Os custom events permitem que o Syntax tenha dados atualizados após executar ações
 *  - Não usa onSnapshot (tempo real do Firestore) para economizar leituras — usa polling por evento
 *  - PERF: limit(500) em cada query — usuários com muito conteúdo podem ter dados truncados
 */

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { getStreakStats } from '../services/streakService';

/**
 * @param {string|null} uid - UID do usuário logado
 * @returns {{ dadosSistema: object, projetosLista: Array, isLoadingContext: boolean }}
 */
const useSyntaxContext = (uid) => {
  const [dadosSistema, setDadosSistema] = useState({
    projetos: [],
    totalSnippets: 0,
    totalTarefas: 0,
    tarefasPendentes: 0,
    ultimoProjeto: null,
    streakAtual: 0,
    longestStreak: 0,
  });
  const [projetosLista, setProjetosLista] = useState([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  useEffect(() => {
    if (!uid) {
      setIsLoadingContext(false);
      return;
    }

    let cancelled = false;

    const fetchContext = async () => {
      try {
        // Buscar tudo em paralelo
        const [projetosSnap, snippetsSnap, tarefasSnap, streakStats] = await Promise.all([
          getDocs(query(collection(db, 'projetos'), where('uid', '==', uid), limit(500))),
          getDocs(query(collection(db, 'snippets'), where('uid', '==', uid), limit(500))),
          getDocs(query(collection(db, 'tarefas'), where('uid', '==', uid), limit(500))),
          getStreakStats(uid).catch(() => ({ currentStreak: 0, longestStreak: 0 })),
        ]);

        if (cancelled) return;

        const projetos = projetosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const tarefas = tarefasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Contar tarefas ainda não concluídas
        const tarefasPendentes = tarefas.filter((t) => !t.concluida).length;

        // Último projeto acessado/atualizado
        const ultimoProjeto = projetos
          .sort((a, b) => new Date(b.ultimaAtualizacao || 0) - new Date(a.ultimaAtualizacao || 0))
          .at(0)?.nome || null;

        setProjetosLista(projetos);
        setDadosSistema({
          projetos,
          totalSnippets: snippetsSnap.size,
          totalTarefas: tarefasSnap.size,
          tarefasPendentes,
          ultimoProjeto,
          streakAtual: streakStats?.currentStreak || 0,
          longestStreak: streakStats?.longestStreak || 0,
        });
      } catch (err) {
        if (err?.message?.includes('INTERNAL ASSERTION FAILED')) {
          console.warn('[useSyntaxContext] Firestore temporariamente indisponível');
        } else {
          console.warn('[useSyntaxContext] Erro ao carregar contexto:', err?.message);
        }
      } finally {
        if (!cancelled) setIsLoadingContext(false);
      }
    };

    fetchContext();

    // Listener para atualizar quando dados mudam
    const handlers = [
      'syntax:projeto:alterado',
      'syntax:snippet:alterado',
      'syntax:tarefa:alterada',
    ];
    const refresh = () => fetchContext();
    handlers.forEach((evt) => window.addEventListener(evt, refresh));

    return () => {
      cancelled = true;
      handlers.forEach((evt) => window.removeEventListener(evt, refresh));
    };
  }, [uid]);

  return { dadosSistema, projetosLista, isLoadingContext };
};

export default useSyntaxContext;