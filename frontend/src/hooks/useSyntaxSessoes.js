/**
 * @file useSyntaxSessoes.js
 * @description Gerencia criação, carregamento e persistência de sessões do AdaBot.
 * Cada sessão é um documento em users/{uid}/adabot_sessoes/{sessaoId}.
 * Suporta carregamento paginado (MENSAGENS_INICIAIS + "carregar mais") para não
 * sobrecarregar o chat com histórico extenso.
 *
 * @dependencies
 *  - Firebase Firestore (collection, doc, setDoc, getDoc, getDocs, orderBy, query, limit)
 *  - firebase-config.js — instância db
 *
 * @sideEffects
 *  - Lê e escreve em users/{uid}/adabot_sessoes/{sessaoId}
 *  - Nenhum efeito externo além do Firestore
 *
 * @notes
 *  - System messages (isSystem: true) NÃO são persistidas — apenas feedback de UI
 *  - O título da sessão é gerado automaticamente na primeira mensagem do usuário
 *  - Sessões são protegidas por mutex para evitar race conditions em writes simultâneos
 *  - Documentos com mensagens > MAX_MENSAGENS_SESSAO são truncados automaticamente
 *    (as mais antigas são removidas, preservando as recentes)
 *  - WARN: documentos Firestore têm limite de 1MB — truncamento evita estouros silenciosos
 */

import { useState, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

// ─── CONSTANTES ────────────────────────────────────────────────────────────────

/** Mensagens exibidas ao abrir uma sessão */
const MENSAGENS_INICIAIS = 15;

/** Mensagens carregadas por clique em "Carregar mais" */
const MENSAGENS_POR_PAGINA = 10;

/** Limite máximo de mensagens por sessão (evita estouro do 1MB do Firestore) */
const MAX_MENSAGENS_SESSAO = 200;

/** Timeout para operações Firestore (ms) */
const FIRESTORE_TIMEOUT_MS = 10_000;

/** Sessões listadas no histórico */
const LIMITE_HISTORICO = 15;

/** Mensagem de boas-vindas padrão (fallback sem contexto) */
const MENSAGEM_BOAS_VINDAS_PADRAO =
  '👋 Olá! Sou a **Ada**, sua assistente de engenharia de software.\n\nPosso te ajudar com revisão de código, debugging, arquitetura de sistemas, boas práticas, documentação e muito mais. Por onde quer começar?';

// ─── UTILITÁRIOS ───────────────────────────────────────────────────────────────

/**
 * Envolve uma Promise com timeout para evitar espera infinita.
 */
const withTimeout = (promise, ms = FIRESTORE_TIMEOUT_MS, label = 'op') =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`[useSyntaxSessoes] Timeout em "${label}" após ${ms / 1000}s`)),
        ms
      )
    ),
  ]);

/**
 * Gera um título automático com base na primeira mensagem do usuário.
 * Remove markdown e limita a 40 caracteres.
 */
const gerarTitulo = (primeiraMensagem) => {
  const msg = (primeiraMensagem || '').trim().toLowerCase();

  const categorias = [
    { prefixo: '🐛 Debug',     tags: ['erro', 'bug', 'falha', 'exception', 'error', 'não funciona'] },
    { prefixo: '👀 Review',    tags: ['revisa', 'review', 'analisa', 'melhora', 'refatora'] },
    { prefixo: '📐 Arch',      tags: ['arquitetura', 'design', 'estrutura', 'pattern', 'sistema'] },
    { prefixo: '📚 Conceito',  tags: ['explica', 'o que é', 'como funciona', 'diferença entre'] },
    { prefixo: '⚙️ Algo',      tags: ['algoritmo', 'complexidade', 'ordenação', 'busca', 'árvore'] },
    { prefixo: '🎯 Interview', tags: ['entrevista', 'interview', 'pergunta técnica'] },
  ];

  const categoria = categorias.find(c => c.tags.some(tag => msg.includes(tag)));
  const prefixo = categoria?.prefixo ?? '💬';
  const limpo = (primeiraMensagem || '').trim().replace(/[*_`#>]/g, '');
  const corpo = limpo.length > 30 ? limpo.substring(0, 27) + '...' : limpo;

  return `${prefixo} — ${corpo || 'Nova conversa'}`;
};

/**
 * Trunca o array de mensagens se ultrapassar MAX_MENSAGENS_SESSAO,
 * preservando sempre a mensagem de boas-vindas (índice 0) e as mais recentes.
 */
const truncarMensagens = (mensagens) => {
  if (mensagens.length <= MAX_MENSAGENS_SESSAO) return mensagens;

  console.warn(
    `[useSyntaxSessoes] Sessão atingiu ${mensagens.length} mensagens — truncando para ${MAX_MENSAGENS_SESSAO}.`
  );

  // Mantém a primeira mensagem (boas-vindas) + as mais recentes
  const boasVindas = mensagens[0];
  const recentes   = mensagens.slice(-(MAX_MENSAGENS_SESSAO - 1));
  return [boasVindas, ...recentes];
};

// ─── HOOK ──────────────────────────────────────────────────────────────────────

/**
 * @param {string|null} uid - UID do usuário autenticado
 */
const useSyntaxSessoes = (uid) => {
  const [sessaoAtual, setSessaoAtual]           = useState(null);
  const [mensagensVisiveis, setMensagensVisiveis] = useState([]);
  const [totalMensagens, setTotalMensagens]     = useState(0);
  const [offset, setOffset]                     = useState(MENSAGENS_INICIAIS);
  const [carregando, setCarregando]             = useState(false);
  const [temMais, setTemMais]                   = useState(false);

  /**
   * Mutex para evitar writes simultâneos na mesma sessão.
   * Se dois saves chegarem ao mesmo tempo, o segundo aguarda o primeiro terminar.
   */
  const writeLockRef  = useRef(false);
  const writQueueRef  = useRef([]);

  // Cache curto para listarSessoes (evita re-query em aberturas rápidas do histórico)
  const sessoesCache  = useRef({ data: null, ts: 0 });

  // ── Mutex helper ─────────────────────────────────────────────────────────────
  const acquireLock = () =>
    new Promise((resolve) => {
      const tryAcquire = () => {
        if (!writeLockRef.current) {
          writeLockRef.current = true;
          resolve();
        } else {
          writQueueRef.current.push(tryAcquire);
        }
      };
      tryAcquire();
    });

  const releaseLock = () => {
    writeLockRef.current = false;
    const next = writQueueRef.current.shift();
    if (next) next();
  };

  // ── Persistência protegida ───────────────────────────────────────────────────
  /**
   * Persiste a sessão no Firestore de forma serializada (mutex).
   * Previne race conditions quando duas mensagens chegam quase simultaneamente.
   *
   * @param {object} sessaoParaSalvar - Objeto completo da sessão atualizada
   */
  const persistirSessao = useCallback(async (sessaoParaSalvar) => {
    if (!uid || !sessaoParaSalvar?.id) return;

    await acquireLock();
    try {
      await withTimeout(
        setDoc(
          doc(db, 'users', uid, 'adabot_sessoes', sessaoParaSalvar.id),
          sessaoParaSalvar,
          { merge: true }
        ),
        FIRESTORE_TIMEOUT_MS,
        'persistirSessao'
      );
    } catch (err) {
      console.error('[Syntax] Erro ao salvar sessão:', err?.message || err);
      throw err; // re-lança para o caller tratar
    } finally {
      releaseLock();
    }
  }, [uid]);

  // ── Nova sessão ──────────────────────────────────────────────────────────────
  /**
   * Cria uma nova sessão limpa no Firestore com mensagem de boas-vindas.
   * O estado local SÓ é atualizado após o save confirmar — evita sessão fantasma.
   *
   * @param {object} [memoria]      - Estado memoriaUsuario (para mensagem contextual)
   * @param {object} [dadosSistema] - Dados do useSyntaxContext (para mensagem contextual)
   * @returns {Promise<object|null>}
   */
  const novaSessao = useCallback(async (memoria, dadosSistema) => {
    if (!uid) return null;

    const sessaoId = `sessao_${Date.now()}`;
    const agora    = new Date();

    // Gera mensagem de boas-vindas contextual
    let conteudoBoasVindas = MENSAGEM_BOAS_VINDAS_PADRAO;

    if (memoria && dadosSistema) {
      try {
        const hora      = agora.getHours();
        const saudacao  = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
        const pref      = memoria?.preferenciasUsuario || {};
        const stats     = memoria?.estatisticasUso     || {};
        const nome      = pref.nomePreferido ? `, ${pref.nomePreferido}` : '';
        const totalMsgs = stats.totalMensagens || 0;
        const projetoRecente     = dadosSistema?.projetoRecente     || null;
        const resumosSalvos      = dadosSistema?.resumosSalvos      || 0;
        const diasSeguidos       = dadosSistema?.diasSeguidos       || 0;

        // Índice determinístico baseado na hora — evita comportamento diferente
        // no double-mount do StrictMode
        const aberturas = [
          `${saudacao}${nome}. O que vamos estudar hoje?`,
          `${saudacao}${nome}. Tem código pra revisar ou alguma dúvida?`,
          `${saudacao}${nome}. Me manda o que está trabalhando.`,
          `${saudacao}${nome}. Pronto para mais engenharia?`,
          `${saudacao}${nome}. Por onde começamos hoje?`,
        ];
        const aberturaRandom = aberturas[agora.getMinutes() % aberturas.length];

        if (totalMsgs === 0) {
          conteudoBoasVindas = `Olá! Sou a Ada, sua assistente de estudos em engenharia de software. O que você está estudando agora ou em qual área quer se aprofundar?`;
        } else if (projetoRecente) {
          conteudoBoasVindas = `${saudacao}${nome}. Continuando o projeto **${projetoRecente}**? Me manda o que tem ou me conta onde travou.`;
        } else if (resumosSalvos > 0) {
          conteudoBoasVindas = `${saudacao}${nome}. Você já tem ${resumosSalvos} ${resumosSalvos === 1 ? 'resumo salvo' : 'resumos salvos'}. Vamos criar um novo ou quer revisar algum conceito?`;
        } else {
          conteudoBoasVindas = aberturaRandom;
        }
      } catch (err) {
        console.warn('[useSyntaxSessoes] Erro ao gerar mensagem contextual:', err?.message);
      }
    }

    const mensagemBoasVindas = {
      role:      'assistant',
      content:   conteudoBoasVindas,
      time:      agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: agora.toISOString(),
    };

    const novaSessaoData = {
      id:                sessaoId,
      titulo:            'Nova conversa',
      criadaEm:          agora.toISOString(),
      ultimaAtualizacao: agora.toISOString(),
      totalMensagens:    1,
      mensagens:         [mensagemBoasVindas],
    };

    // Salva PRIMEIRO — estado local só é atualizado após confirmação
    try {
      await withTimeout(
        setDoc(doc(db, 'users', uid, 'adabot_sessoes', sessaoId), novaSessaoData),
        FIRESTORE_TIMEOUT_MS,
        'novaSessao'
      );
    } catch (err) {
      console.error('[useSyntaxSessoes] Erro ao criar sessão:', err?.message);
      return null; // não atualiza estado se o save falhou
    }

    // Invalida cache do histórico
    sessoesCache.current = { data: null, ts: 0 };

    setSessaoAtual(novaSessaoData);
    setMensagensVisiveis([mensagemBoasVindas]);
    setTotalMensagens(1);
    setOffset(MENSAGENS_INICIAIS);
    setTemMais(false);

    return novaSessaoData;
  }, [uid]);

  // ── Carregar sessão ──────────────────────────────────────────────────────────
  /**
   * Carrega uma sessão existente pelo ID, exibindo apenas as últimas
   * MENSAGENS_INICIAIS mensagens.
   */
  const carregarSessao = useCallback(async (sessaoId) => {
    if (!uid) return;
    setCarregando(true);
    try {
      const snap = await withTimeout(
        getDoc(doc(db, 'users', uid, 'adabot_sessoes', sessaoId)),
        FIRESTORE_TIMEOUT_MS,
        'carregarSessao'
      );
      if (!snap.exists()) {
        console.warn('[useSyntaxSessoes] Sessão não encontrada:', sessaoId);
        return;
      }

      const sessao    = snap.data();
      const total     = sessao.mensagens?.length ?? 0;
      const visiveis  = (sessao.mensagens || []).slice(-MENSAGENS_INICIAIS);
      const novoOffset = Math.max(0, total - MENSAGENS_INICIAIS);

      setSessaoAtual(sessao);
      setMensagensVisiveis(visiveis);
      setTotalMensagens(total);
      setOffset(novoOffset);
      setTemMais(novoOffset > 0);
    } catch (err) {
      console.warn('[useSyntaxSessoes] Erro ao carregar sessão:', err?.message);
    } finally {
      setCarregando(false);
    }
  }, [uid]);

  // ── Carregar mais ────────────────────────────────────────────────────────────
  /**
   * Carrega o bloco anterior de mensagens (paginação para trás).
   * A correção do scroll é responsabilidade do componente.
   */
  const carregarMais = useCallback(() => {
    if (!sessaoAtual || !temMais) return;

    const novoOffset = Math.max(0, offset - MENSAGENS_POR_PAGINA);
    const novasFatia = (sessaoAtual.mensagens || []).slice(novoOffset, offset);

    setMensagensVisiveis((prev) => [...novasFatia, ...prev]);
    setOffset(novoOffset);
    setTemMais(novoOffset > 0);
  }, [sessaoAtual, offset, temMais]);

  // ── Adicionar mensagem (com UI) ──────────────────────────────────────────────
  /**
   * Adiciona mensagem à sessão e persiste no Firestore.
   * System messages ficam apenas na UI.
   * Usa mutex para evitar race condition com writes simultâneos.
   *
   * @param {object} mensagem - { role, content, time, timestamp, isSystem? }
   */
  const adicionarMensagem = useCallback(async (mensagem) => {
    // System messages: apenas UI, nunca Firestore
    if (mensagem.isSystem) {
      setMensagensVisiveis((prev) => [...prev, mensagem]);
      return;
    }

    // Atualização otimista
    setMensagensVisiveis((prev) => [...prev, mensagem]);

    if (!uid || !sessaoAtual?.id) {
      console.error('[Syntax] Tentativa de salvar mensagem sem sessão ativa');
      return;
    }

    const mensagensAtualizadas = truncarMensagens([
      ...(sessaoAtual.mensagens || []),
      mensagem,
    ]);

    const ehPrimeiraMensagemUsuario =
      mensagem.role === 'user' && sessaoAtual.titulo === 'Nova conversa';

    const sessaoAtualizada = {
      ...sessaoAtual,
      titulo:            ehPrimeiraMensagemUsuario ? gerarTitulo(mensagem.content) : sessaoAtual.titulo,
      mensagens:         mensagensAtualizadas,
      totalMensagens:    mensagensAtualizadas.length,
      ultimaAtualizacao: new Date().toISOString(),
    };

    try {
      await persistirSessao(sessaoAtualizada);
      setSessaoAtual(sessaoAtualizada);
      setTotalMensagens(mensagensAtualizadas.length);
    } catch {
      // Erro já logado em persistirSessao — não propaga para não quebrar o fluxo do chat
    }
  }, [sessaoAtual, uid, persistirSessao]);

  // ── Adicionar mensagem (sem UI) ──────────────────────────────────────────────
  /**
   * Persiste mensagem no Firestore SEM atualizar mensagensVisiveis.
   * Usado após streaming — a UI já foi atualizada palavra a palavra.
   *
   * @param {object} mensagem - { role, content, time, timestamp }
   */
  const adicionarMensagemSemUI = useCallback(async (mensagem) => {
    if (!uid || !sessaoAtual?.id || mensagem.isSystem) return;

    const mensagensAtualizadas = truncarMensagens([
      ...(sessaoAtual.mensagens || []),
      mensagem,
    ]);

    const ehPrimeiraMensagemUsuario =
      mensagem.role === 'user' && sessaoAtual.titulo === 'Nova conversa';

    const sessaoAtualizada = {
      ...sessaoAtual,
      titulo:            ehPrimeiraMensagemUsuario ? gerarTitulo(mensagem.content) : sessaoAtual.titulo,
      mensagens:         mensagensAtualizadas,
      totalMensagens:    mensagensAtualizadas.length,
      ultimaAtualizacao: new Date().toISOString(),
    };

    try {
      await persistirSessao(sessaoAtualizada);
      setSessaoAtual(sessaoAtualizada);
      setTotalMensagens(mensagensAtualizadas.length);
    } catch {
      // Erro já logado em persistirSessao
    }
  }, [sessaoAtual, uid, persistirSessao]);

  // ── Listar sessões ───────────────────────────────────────────────────────────
  /**
   * Busca as últimas LIMITE_HISTORICO sessões para o painel de histórico.
   * Cache de 30s para evitar re-queries em aberturas rápidas.
   *
   * @returns {Promise<object[]>}
   */
  const listarSessoes = useCallback(async () => {
    if (!uid) return [];

    // Serve do cache se ainda válido (30s)
    const agora = Date.now();
    if (sessoesCache.current.data && agora - sessoesCache.current.ts < 30_000) {
      return sessoesCache.current.data;
    }

    try {
      const ref  = collection(db, 'users', uid, 'adabot_sessoes');
      const q    = query(ref, orderBy('ultimaAtualizacao', 'desc'), limit(LIMITE_HISTORICO));
      const snap = await withTimeout(getDocs(q), FIRESTORE_TIMEOUT_MS, 'listarSessoes');
      const data = snap.docs.map((d) => d.data());

      sessoesCache.current = { data, ts: agora };
      return data;
    } catch (err) {
      console.warn('[useSyntaxSessoes] Erro ao listar sessões:', err?.message);
      return sessoesCache.current.data || []; // retorna cache expirado como fallback
    }
  }, [uid]);

  return {
    sessaoAtual,
    mensagensVisiveis,
    totalMensagens,
    temMais,
    carregando,
    novaSessao,
    carregarSessao,
    carregarMais,
    adicionarMensagem,
    adicionarMensagemSemUI,
    listarSessoes,
    setMensagensVisiveis,
  };
};

export default useSyntaxSessoes;