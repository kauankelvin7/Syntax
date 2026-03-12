/**
 * @file adaActions.js
 * @description Parser e executor de ações do agente AdaBot. Extrai blocos ```action```
 * das respostas do Gemini e executa operações reais no Firestore.
 *
 * @dependencies
 *  - firebaseService.js (criarMateria, criarFlashcard, criarResumo, salvarEvento)
 *
 * @sideEffects
 *  - Escreve em `materias/{docId}`, `flashcards/{docId}`, `resumos/{docId}`, `eventos/{docId}`
 *  - Dispara CustomEvents (window) para notificar outros componentes:
 *    'syntax:materia:alterada', 'syntax:flashcard:alterado',
 *    'syntax:resumo:alterado', 'syntax:evento:alterado'
 *
 * @notes
 *  - Ações suportadas: CRIAR_MATERIA, CRIAR_FLASHCARD, CRIAR_MULTIPLOS_FLASHCARDS,
 *    CRIAR_RESUMO, AGENDAR_REVISAO, ATUALIZAR_PREFERENCIAS
 *  - WARN: ATUALIZAR_PREFERENCIAS não escreve no Firestore — retorna dados para
 *          o AdaBot.jsx atualizar a memória (trata separado)
 *  - NOTE: o bloco JSON esperado é delimitado por ```action ... ``` na resposta do Gemini
 */

import {
  criarMateria,
  criarFlashcard,
  criarResumo,
  salvarEvento,
} from '../services/firebaseService';

// ─── CONSTANTES ────────────────────────────────────────────────────────────────

/** Máximo de flashcards por chamada CRIAR_MULTIPLOS_FLASHCARDS */
const MAX_FLASHCARDS_POR_ACAO = 20;

/** Timeout padrão para operações Firestore (ms) */
const FIRESTORE_TIMEOUT_MS = 10_000;

// ─── UTILITÁRIOS ───────────────────────────────────────────────────────────────

/**
 * Envolve uma Promise com timeout para evitar espera infinita.
 * @param {Promise} promise
 * @param {number} ms
 * @returns {Promise}
 */
const withTimeout = (promise, ms = FIRESTORE_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
    ),
  ]);

/**
 * Normaliza um objeto flashcard recebido do Gemini para o schema interno.
 * O Gemini às vezes retorna campos em inglês (front/back) ou outros aliases.
 * @param {object} fc - Flashcard raw do Gemini
 * @returns {{ pergunta: string, resposta: string }}
 */
const normalizarFlashcard = (fc) => ({
  pergunta: (fc.pergunta ?? fc.front    ?? fc.question ?? fc.frente ?? '').trim(),
  resposta: (fc.resposta ?? fc.back     ?? fc.answer   ?? fc.verso  ?? '').trim(),
});

/**
 * Loga ações de forma estruturada para facilitar debug em produção.
 * @param {string} acao
 * @param {string} uid
 * @param {boolean} sucesso
 * @param {string|null} erro
 */
const logAcao = (acao, uid, sucesso, erro = null) => {
  const entry = {
    acao,
    uid,
    timestamp: new Date().toISOString(),
    sucesso,
    ...(erro ? { erro } : {}),
  };
  if (sucesso) {
    console.info('[AdaActions]', JSON.stringify(entry));
  } else {
    console.error('[AdaActions]', JSON.stringify(entry));
  }
};

// ─── PARSER ────────────────────────────────────────────────────────────────────

/**
 * Extrai TODAS as ações do texto de resposta do Gemini.
 * Sanitiza o JSON antes de parsear para lidar com comentários e trailing commas
 * que o Gemini eventualmente inclui.
 *
 * @param {string} texto - Resposta completa do Gemini
 * @returns {{ textoLimpo: string, acoes: object[] }}
 */
export const extrairAcoes = (texto) => {
  const regex = /```action\s*([\s\S]*?)```/g;
  const matches = [...texto.matchAll(regex)];

  if (matches.length === 0) {
    return { textoLimpo: texto, acoes: [] };
  }

  const acoes = [];

  for (const match of matches) {
    try {
      // Sanitiza o JSON: remove comentários de linha e trailing commas
      const jsonLimpo = match[1]
        .trim()
        .replace(/\/\/.*$/gm, '')        // remove comentários de linha
        .replace(/,(\s*[}\]])/g, '$1');  // remove trailing commas

      const acao = JSON.parse(jsonLimpo);

      // Garante que a ação tem os campos mínimos esperados
      if (!acao.acao || typeof acao.acao !== 'string') {
        console.warn('[AdaBot] Bloco action sem campo "acao" — ignorado:', jsonLimpo);
        continue;
      }

      acoes.push(acao);
    } catch {
      console.warn('[AdaBot] Bloco action inválido ignorado:', match[1]);
    }
  }

  // Remove TODOS os blocos action do texto visível
  const textoLimpo = texto.replace(regex, '').trim();

  return { textoLimpo, acoes };
};

/**
 * Compat: mantém a API antiga para qualquer código que ainda use extrairAcao.
 * @deprecated Use extrairAcoes (plural).
 */
export const extrairAcao = (texto) => {
  const { textoLimpo, acoes } = extrairAcoes(texto);
  return { textoLimpo, acao: acoes[0] || null };
};

// ─── EXECUTOR ──────────────────────────────────────────────────────────────────

/**
 * Executa uma ação no Firestore utilizando os serviços existentes.
 *
 * @param {object} acao     - { acao: string, dados: object }
 * @param {string} uid      - UID do usuário autenticado
 * @param {Array}  materias - Lista de matérias do contexto (para lookup)
 * @returns {Promise<{ sucesso: boolean, mensagem: string, dadosRetorno?: any }>}
 */
export const executarAcao = async (acao, uid, materias = []) => {

  // Valida uid antes de qualquer operação
  if (!uid || typeof uid !== 'string' || uid.trim() === '') {
    return { sucesso: false, mensagem: '❌ Usuário não autenticado. Faça login novamente.' };
  }

  if (!acao) {
    return { sucesso: false, mensagem: '❌ Dados insuficientes para executar a ação.' };
  }

  try {
    switch (acao.acao) {

      /* ─── CRIAR MATÉRIA ─────────────────────────────── */
      case 'CRIAR_MATERIA': {
        const { nome, cor, descricao } = acao.dados || {};

        if (!nome?.trim()) {
          return { sucesso: false, mensagem: '❌ Nome da matéria é obrigatório.' };
        }

        const result = await withTimeout(
          criarMateria(
            {
              nome: nome.trim(),
              cor: cor || '#2563EB',
              descricao: descricao || '',
              criadoPorAda: true,
            },
            uid
          )
        );

        window.dispatchEvent(new CustomEvent('syntax:materia:alterada'));
        logAcao('CRIAR_MATERIA', uid, true);

        return {
          sucesso: true,
          mensagem: `✅ Matéria **"${nome}"** criada com sucesso!`,
          dadosRetorno: { id: result.id, nome },
        };
      }

      /* ─── CRIAR FLASHCARD ───────────────────────────── */
      case 'CRIAR_FLASHCARD': {
        const dados = acao.dados || {};
        const { pergunta, resposta } = normalizarFlashcard(dados);

        if (!pergunta) return { sucesso: false, mensagem: '❌ Pergunta do flashcard é obrigatória.' };
        if (!resposta) return { sucesso: false, mensagem: '❌ Resposta do flashcard é obrigatória.' };

        const materiaId = dados.materiaId || null;
        const mat = materiaId ? materias.find((m) => m.id === materiaId) : null;

        const result = await withTimeout(
          criarFlashcard(
            {
              pergunta,
              resposta,
              materiaId,
              materiaNome: mat?.nome ?? null,
              materiaCor:  mat?.cor  ?? null,
              criadoPorAda: true,
            },
            null,
            uid
          )
        );

        window.dispatchEvent(new CustomEvent('syntax:flashcard:alterado'));
        logAcao('CRIAR_FLASHCARD', uid, true);

        return {
          sucesso: true,
          mensagem: '✅ Flashcard criado com sucesso!',
          dadosRetorno: { id: result.id },
        };
      }

      /* ─── CRIAR MÚLTIPLOS FLASHCARDS ────────────────── */
      case 'CRIAR_MULTIPLOS_FLASHCARDS': {
        const { flashcards, materiaId } = acao.dados || {};

        if (!Array.isArray(flashcards) || flashcards.length === 0) {
          return { sucesso: false, mensagem: '❌ Nenhum flashcard fornecido.' };
        }

        // Limita para evitar writes excessivos
        const listaLimitada = flashcards.slice(0, MAX_FLASHCARDS_POR_ACAO);
        if (flashcards.length > MAX_FLASHCARDS_POR_ACAO) {
          console.warn(`[AdaActions] Limitado a ${MAX_FLASHCARDS_POR_ACAO} flashcards (recebidos: ${flashcards.length})`);
        }

        const mat = materiaId ? materias.find((m) => m.id === materiaId) : null;

        // Normaliza e filtra cards inválidos antes de tentar salvar
        const listaValida = listaLimitada
          .map((fc) => normalizarFlashcard(fc))
          .filter((fc) => {
            const valido = fc.pergunta.length > 0 && fc.resposta.length > 0;
            if (!valido) console.warn('[AdaActions] Flashcard inválido descartado:', fc);
            return valido;
          });

        if (listaValida.length === 0) {
          return { sucesso: false, mensagem: '❌ Todos os flashcards estavam inválidos (pergunta ou resposta vazias).' };
        }

        // Promise.allSettled: salva o máximo possível, não aborta no primeiro erro
        const resultados = await Promise.allSettled(
          listaValida.map((fc) =>
            withTimeout(
              criarFlashcard(
                {
                  pergunta: fc.pergunta,
                  resposta: fc.resposta,
                  materiaId: materiaId || null,
                  materiaNome: mat?.nome ?? null,
                  materiaCor:  mat?.cor  ?? null,
                  criadoPorAda: true,
                },
                null,
                uid
              )
            )
          )
        );

        const criados = resultados.filter((r) => r.status === 'fulfilled').length;
        const falhas  = resultados.filter((r) => r.status === 'rejected').length;

        if (falhas > 0) {
          console.error(`[AdaActions] ${falhas} flashcard(s) falharam:`,
            resultados.filter((r) => r.status === 'rejected').map((r) => r.reason?.message)
          );
        }

        window.dispatchEvent(new CustomEvent('syntax:flashcard:alterado'));
        logAcao('CRIAR_MULTIPLOS_FLASHCARDS', uid, criados > 0, falhas > 0 ? `${falhas} falhas` : null);

        if (criados === 0) {
          return { sucesso: false, mensagem: '❌ Não foi possível criar nenhum flashcard.' };
        }

        const mensagem = falhas > 0
          ? `⚠️ **${criados} flashcard${criados !== 1 ? 's' : ''}** criado${criados !== 1 ? 's' : ''}. (${falhas} falharam)`
          : `✅ **${criados} flashcard${criados !== 1 ? 's' : ''}** criado${criados !== 1 ? 's' : ''} com sucesso!`;

        return { sucesso: true, mensagem };
      }

      /* ─── CRIAR RESUMO ─────────────────────────────── */
      case 'CRIAR_RESUMO': {
        const { titulo, conteudo, materiaId, tags } = acao.dados || {};

        if (!titulo?.trim()) return { sucesso: false, mensagem: '❌ Título do resumo é obrigatório.' };
        if (!conteudo?.trim()) return { sucesso: false, mensagem: '❌ Conteúdo do resumo é obrigatório.' };

        const result = await withTimeout(
          criarResumo(
            {
              titulo: titulo.trim(),
              conteudo: conteudo.trim(),
              materiaId: materiaId || null,
              tags: Array.isArray(tags) ? tags : [],
              criadoPorAda: true,
            },
            uid
          )
        );

        // syntax:resumo:alterado já é disparado dentro de criarResumo
        logAcao('CRIAR_RESUMO', uid, true);

        return {
          sucesso: true,
          mensagem: `✅ Resumo **"${titulo}"** criado com sucesso!`,
          dadosRetorno: { id: result.id },
        };
      }

      /* ─── AGENDAR REVISÃO ───────────────────────────── */
      case 'AGENDAR_REVISAO': {
        const { data, descricao, materiaId } = acao.dados || {};

        if (!data) {
          return { sucesso: false, mensagem: '❌ Data da revisão é obrigatória.' };
        }

        const dataRevisao = new Date(data);

        if (isNaN(dataRevisao.getTime())) {
          return { sucesso: false, mensagem: '❌ Data inválida. Use o formato ISO (ex: 2025-06-15).' };
        }

        if (dataRevisao < new Date()) {
          return { sucesso: false, mensagem: '❌ Não é possível agendar uma revisão no passado.' };
        }

        const mat = materiaId ? materias.find((m) => m.id === materiaId) : null;
        const titulo = mat
          ? `📖 Revisão: ${mat.nome}`
          : (descricao?.trim() || 'Revisão agendada pelo Ada');

        await withTimeout(
          salvarEvento({ titulo, data: dataRevisao, tipo: 'estudo' }, uid)
        );

        window.dispatchEvent(new CustomEvent('syntax:evento:alterado'));
        logAcao('AGENDAR_REVISAO', uid, true);

        return {
          sucesso: true,
          mensagem: `✅ Revisão agendada para **${dataRevisao.toLocaleDateString('pt-BR')}**!`,
        };
      }

      /* ─── ATUALIZAR PREFERÊNCIAS ────────────────────── */
      case 'ATUALIZAR_PREFERENCIAS': {
        // Não escreve no Firestore — retorna dados para o AdaBot.jsx atualizar a memória
        logAcao('ATUALIZAR_PREFERENCIAS', uid, true);
        return {
          sucesso: true,
          mensagem: '✅ Preferências atualizadas! Vou me adaptar melhor para você.',
          dadosRetorno: { preferencias: acao.dados },
        };
      }

      default:
        return { sucesso: false, mensagem: `❌ Ação desconhecida: **${acao.acao}**` };
    }
  } catch (error) {
    logAcao(acao.acao, uid, false, error.message || String(error));
    return {
      sucesso: false,
      mensagem: `❌ Não foi possível executar a ação: ${error.message || String(error)}`,
    };
  }
};

/**
 * Executa múltiplas ações em série, aguardando cada uma completar.
 * Execução serial garante ordem correta e evita conflitos no Firestore.
 *
 * @param {object[]} acoes    - Array de ações { acao, dados }
 * @param {string}   uid      - UID do usuário
 * @param {Array}    materias - Lista de matérias para lookup
 * @returns {Promise<{ sucesso: boolean, mensagem: string, dadosRetorno?: any }[]>}
 */
export const executarAcoes = async (acoes, uid, materias = []) => {
  const resultados = [];
  for (const acao of acoes) {
    // await serial intencional — garante ordem e evita race conditions
    const resultado = await executarAcao(acao, uid, materias);
    resultados.push(resultado);
  }
  return resultados;
};