/**
 * @file useSyntaxContext.js
 * @description Hook que carrega estatísticas do sistema em tempo real para injetar
 * no system prompt do AdaBot. Garante que o agente tenha consciência do estado atual
 * do usuário: matérias, resumos, flashcards, streak etc.
 *
 * @dependencies
 *  - Firebase Firestore (getDocs com queries filtradas por uid)
 *  - streakService.getStreakStats — dados de atividade diária
 *
 * @sideEffects
 *  - Realiza múltiplas leituras no Firestore a cada chamada
 *  - Re-executa quando eventos 'syntax:*' são disparados (via CustomEvent)
 *
 * @notes
 *  - Debounce de 600ms nos eventos para evitar flood de leituras quando o AdaBot
 *    cria múltiplos itens em sequência
 *  - Cache simples por uid: não re-busca se os dados foram carregados há menos de
 *    CACHE_TTL_MS e nenhum evento de refresh foi disparado
 *  - Timeout de 8s em cada query para não bloquear o contexto indefinidamente
 *  - Avisa no console se limit(500) foi atingido (dados truncados)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { getStreakStats } from '../services/streakService';

// ─── CONSTANTES ────────────────────────────────────────────────────────────────

/** TTL do cache em memória (ms) — evita re-fetch ao navegar entre páginas */
const CACHE_TTL_MS = 60_000; // 1 minuto

/** Debounce dos eventos de refresh (ms) — evita flood ao criar múltiplos itens */
const DEBOUNCE_MS = 600;

/** Timeout por operação Firestore (ms) */
const QUERY_TIMEOUT_MS = 8_000;

/** Limite de documentos por query */
const QUERY_LIMIT = 500;

/** Eventos que disparam re-fetch do contexto */
const REFRESH_EVENTS = [
  'syntax:materia:alterada',
  'syntax:flashcard:alterado',
  'syntax:resumo:alterado',
  'syntax:simulado:alterado',
  'syntax:evento:alterado',
];

/** Estado inicial padrão */
const INITIAL_STATE = {
  materias:        [],
  totalFlashcards: 0,
  resumosSalvos:   0,
  totalSimulados:  0,
  totalEventos:    0,
  diasSeguidos:    0,
  maiorSequencia:  0,
  projetoRecente:  null,
};

// ─── UTILITÁRIOS ───────────────────────────────────────────────────────────────

/**
 * Envolve uma Promise com timeout.
 * @param {Promise} promise
 * @param {number}  ms
 * @param {string}  label - usado no log de warning se expirar
 * @returns {Promise}
 */
const withTimeout = (promise, ms = QUERY_TIMEOUT_MS, label = 'query') =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`[useSyntaxContext] Timeout em "${label}" após ${ms / 1000}s`)),
        ms
      )
    ),
  ]);

/**
 * Avisa se o limit foi atingido (dados possivelmente truncados).
 * @param {import('firebase/firestore').QuerySnapshot} snap
 * @param {string} colecao
 */
const warnIfTruncated = (snap, colecao) => {
  if (snap.size >= QUERY_LIMIT) {
    console.warn(
      `[useSyntaxContext] Coleção "${colecao}" atingiu o limit(${QUERY_LIMIT}) — dados podem estar truncados.`
    );
  }
};

// ─── CACHE EM MEMÓRIA ──────────────────────────────────────────────────────────
// Simples objeto fora do hook para persistir entre re-mounts do componente.
const cache = {
  uid:       null,
  dados:     null,
  materias:  [],
  timestamp: 0,
};

const isCacheValid = (uid) =>
  cache.uid === uid &&
  cache.dados !== null &&
  Date.now() - cache.timestamp < CACHE_TTL_MS;

const invalidateCache = () => {
  cache.timestamp = 0;
};

// ─── HOOK ──────────────────────────────────────────────────────────────────────

/**
 * @param {string|null} uid - UID do usuário logado
 * @returns {{
 *   dadosSistema:     object,
 *   materiasLista:    Array,
 *   isLoadingContext: boolean,
 * }}
 */
const useSyntaxContext = (uid) => {
  const [dadosSistema, setDadosSistema]       = useState(INITIAL_STATE);
  const [materiasLista, setMateriasLista]     = useState([]);
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  // Ref para cancelar fetch em voo se o componente desmontar ou uid mudar
  const cancelledRef = useRef(false);

  // Ref para o timer do debounce
  const debounceRef = useRef(null);

  // ── Fetch principal ──────────────────────────────────────────────────────────
  const fetchContext = useCallback(async ({ forceRefresh = false } = {}) => {
    if (!uid) {
      setIsLoadingContext(false);
      return;
    }

    // Serve do cache se ainda válido e não for refresh forçado
    if (!forceRefresh && isCacheValid(uid)) {
      setDadosSistema(cache.dados);
      setMateriasLista(cache.materias);
      setIsLoadingContext(false);
      return;
    }

    try {
      // Monta todas as queries
      const qMaterias   = query(collection(db, 'materias'),   where('uid', '==', uid), limit(QUERY_LIMIT));
      const qFlashcards = query(collection(db, 'flashcards'), where('uid', '==', uid), limit(QUERY_LIMIT));
      const qResumos    = query(collection(db, 'resumos'),    where('uid', '==', uid), limit(QUERY_LIMIT));
      const qSimulados  = query(collection(db, 'simulados'),  where('uid', '==', uid), limit(QUERY_LIMIT));
      const qEventos    = query(collection(db, 'eventos'),    where('uid', '==', uid), limit(QUERY_LIMIT));

      // Executa em paralelo com timeout individual por query
      const [
        materiasSnap,
        flashcardsSnap,
        resumosSnap,
        simuladosSnap,
        eventosSnap,
        streakStats,
      ] = await Promise.all([
        withTimeout(getDocs(qMaterias),   QUERY_TIMEOUT_MS, 'materias'),
        withTimeout(getDocs(qFlashcards), QUERY_TIMEOUT_MS, 'flashcards'),
        withTimeout(getDocs(qResumos),    QUERY_TIMEOUT_MS, 'resumos'),
        withTimeout(getDocs(qSimulados),  QUERY_TIMEOUT_MS, 'simulados'),
        withTimeout(getDocs(qEventos),    QUERY_TIMEOUT_MS, 'eventos'),
        withTimeout(
          getStreakStats(uid).catch(() => ({ currentStreak: 0, longestStreak: 0 })),
          QUERY_TIMEOUT_MS,
          'streakStats'
        ).catch(() => ({ currentStreak: 0, longestStreak: 0 })),
      ]);

      if (cancelledRef.current) return;

      // Avisa se alguma coleção foi truncada
      warnIfTruncated(materiasSnap,   'materias');
      warnIfTruncated(flashcardsSnap, 'flashcards');
      warnIfTruncated(resumosSnap,    'resumos');

      const materias = materiasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const resumos  = resumosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Determina o projeto recente (última matéria ou resumo atualizado)
      const projetoRecente = materias.length > 0 
        ? materias.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))[0]?.nome
        : resumos.length > 0 
        ? resumos.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))[0]?.titulo
        : null;

      const novoDado = {
        materias,
        totalFlashcards: flashcardsSnap.size,
        resumosSalvos:   resumosSnap.size,
        totalSimulados:  simuladosSnap.size,
        totalEventos:    eventosSnap.size,
        diasSeguidos:    streakStats?.currentStreak  ?? 0,
        maiorSequencia:  streakStats?.longestStreak  ?? 0,
        projetoRecente,
      };

      // Atualiza cache
      cache.uid       = uid;
      cache.dados     = novoDado;
      cache.materias  = materias;
      cache.timestamp = Date.now();

      setDadosSistema(novoDado);
      setMateriasLista(materias);

    } catch (err) {
      if (cancelledRef.current) return;

      // Distingue erros conhecidos para não poluir o log
      const msg = err?.message || String(err);
      if (msg.includes('INTERNAL ASSERTION FAILED')) {
        console.warn('[useSyntaxContext] Firestore temporariamente indisponível');
      } else if (msg.includes('Missing or insufficient permissions')) {
        console.warn('[useSyntaxContext] Sem permissão — verifique as Security Rules');
      } else {
        console.warn('[useSyntaxContext] Erro ao carregar contexto:', msg);
      }

      // Mantém dados anteriores em caso de erro (não reseta para estado vazio)
    } finally {
      if (!cancelledRef.current) setIsLoadingContext(false);
    }
  }, [uid]);

  // ── Efeito principal ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setIsLoadingContext(false);
      return;
    }

    cancelledRef.current = false;
    fetchContext();

    // Refresh com debounce ao receber eventos de alteração
    const handleRefresh = () => {
      // Invalida cache para garantir dados frescos
      invalidateCache();

      // Debounce: cancela timer anterior e agenda novo fetch
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!cancelledRef.current) fetchContext({ forceRefresh: true });
      }, DEBOUNCE_MS);
    };

    REFRESH_EVENTS.forEach((evt) => window.addEventListener(evt, handleRefresh));

    return () => {
      cancelledRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      REFRESH_EVENTS.forEach((evt) => window.removeEventListener(evt, handleRefresh));
    };
  }, [uid, fetchContext]);

  return { dadosSistema, materiasLista, isLoadingContext };
};

export default useSyntaxContext;