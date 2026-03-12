/**
 * @file useSyntaxSessoes.js
 * @description Gerencia criação, carregamento e persistência de sessões do Syntax,
 * assistente de engenharia de software e programação.
 * Cada sessão é um documento em users/{uid}/syntax_sessoes/{sessaoId}.
 * Suporta carregamento paginado (MENSAGENS_INICIAIS + "carregar mais") para não
 * sobrecarregar o chat com histórico extenso.
 *
 * @dependencies
 *  - Firebase Firestore (collection, doc, setDoc, getDoc, getDocs, orderBy, query, limit)
 *  - firebase-config.js — instância db
 *
 * @sideEffects
 *  - Lê e escreve em users/{uid}/syntax_sessoes/{sessaoId}
 *  - Nenhum efeito externo além do Firestore
 *
 * @notes
 *  - Sessões são imutáveis para outros usuários (regras de segurança do Firestore)
 *  - System messages (isSystem: true) NÃO são persistidas — apenas feedback de UI
 *  - O título da sessão é gerado automaticamente na primeira mensagem do usuário
 *  - WARN: documentos de sessão carregam o array mensagens inteiro — evite sessões > 200 msgs
 */

import { useState, useCallback } from 'react';
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

/** Número de mensagens exibidas inicialmente ao abrir uma sessão. */
const MENSAGENS_INICIAIS = 15;

/** Quantidade de mensagens carregadas a cada clique em "Carregar mais". */
const MENSAGENS_POR_PAGINA = 10;

/** Mensagem de boas-vindas padrão (fallback). */
const MENSAGEM_BOAS_VINDAS_PADRAO = {
  role: 'assistant',
  content:
    '👋 Olá! Sou o **Syntax**, seu assistente de engenharia de software.\n\nPosso te ajudar com revisão de código, debugging, arquitetura de sistemas, boas práticas, documentação e muito mais. Por onde quer começar?',
};

/**
 * Hook para gerenciar sessões de conversa do Syntax.
 *
 * @param {string|null} uid - UID do usuário autenticado
 * @returns {{ sessaoAtual, mensagensVisiveis, totalMensagens, temMais, carregando,
 *             novaSessao, carregarSessao, carregarMais, adicionarMensagem,
 *             adicionarMensagemSemUI, listarSessoes, setMensagensVisiveis }}
 */
const useSyntaxSessoes = (uid) => {
  const [sessaoAtual, setSessaoAtual] = useState(null);
  const [mensagensVisiveis, setMensagensVisiveis] = useState([]);
  const [totalMensagens, setTotalMensagens] = useState(0);
  const [offset, setOffset] = useState(MENSAGENS_INICIAIS);
  const [carregando, setCarregando] = useState(false);
  const [temMais, setTemMais] = useState(false);

  /**
   * Gera um título automático para a sessão com base na primeira mensagem do usuário.
   * Remove markdown e limita a 40 caracteres.
   *
   * @param {string} primeiraMensagem
   * @returns {string}
   */
  const gerarTitulo = (primeiraMensagem) => {
    const limpo = primeiraMensagem.trim().replace(/[*_`#>]/g, '');
    return limpo.length > 40 ? limpo.substring(0, 37) + '...' : limpo;
  };

  /**
   * Cria uma nova sessão limpa no Firestore com mensagem de boas-vindas.
   * Aceita opcionalmente memória e dados do sistema para gerar mensagem contextual.
   * NOTE: não apaga sessões anteriores — ficam disponíveis no painel de histórico.
   *
   * @param {object} [memoria]      - Estado memoriausuario (para mensagem contextual)
   * @param {object} [dadosSistema] - Dados do useSyntaxContext (para mensagem contextual)
   * @returns {Promise<object|null>} Dados da sessão criada
   */
  const novaSessao = useCallback(async (memoria, dadosSistema) => {
    if (!uid) return null;

    const sessaoId = `sessao_${Date.now()}`;
    const agora = new Date();

    let conteudoBoasVindas = MENSAGEM_BOAS_VINDAS_PADRAO.content;

    if (memoria && dadosSistema) {
      try {
        const hora = agora.getHours();
        const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
        const pref = memoria?.preferenciasUsuario || {};
        const stats = memoria?.estatisticasUso || {};
        const nome = pref.nomePreferido ? `, ${pref.nomePreferido}` : '';
        const totalMsgs = stats.totalMensagens || 0;
        const linguagemFavorita = pref.linguagemFavorita || null;
        const ultimoProjeto = dadosSistema?.ultimoProjeto || null;

        if (totalMsgs === 0) {
          conteudoBoasVindas = `${saudacao}! Sou o Syntax, seu assistente de engenharia de software. Pode me mandar código pra revisar, tirar dúvidas sobre arquitetura, pedir ajuda com debugging — o que precisar. Por onde quer começar?`;
        } else if (ultimoProjeto) {
          conteudoBoasVindas = `${saudacao}${nome}. Continuando com **${ultimoProjeto}**? É só mandar o código ou me contar onde travou.`;
        } else if (linguagemFavorita) {
          conteudoBoasVindas = `${saudacao}${nome}. Mais um dia de código. Trabalhando com ${linguagemFavorita} hoje?`;
        } else {
          const aberturasGenericas = [
            `${saudacao}${nome}. Qual o problema de hoje?`,
            `${saudacao}${nome}. Pronto pra codar?`,
            `${saudacao}${nome}. Me manda o código ou descreve o que precisa.`,
          ];
          conteudoBoasVindas = aberturasGenericas[Math.floor(Math.random() * aberturasGenericas.length)];
        }
      } catch (err) {
        console.warn('[useSyntaxSessoes] Erro ao gerar mensagem contextual:', err?.message);
      }
    }

    const mensagemBoasVindas = {
      role: 'assistant',
      content: conteudoBoasVindas,
      time: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: agora.toISOString(),
    };

    const novaSessaoData = {
      id: sessaoId,
      titulo: 'Nova conversa',
      criadaEm: agora.toISOString(),
      ultimaAtualizacao: agora.toISOString(),
      totalMensagens: 1,
      mensagens: [mensagemBoasVindas],
    };

    try {
      await setDoc(doc(db, 'users', uid, 'syntax_sessoes', sessaoId), novaSessaoData);
    } catch (err) {
      console.warn('[useSyntaxSessoes] Erro ao criar sessão:', err?.message);
    }

    setSessaoAtual(novaSessaoData);
    setMensagensVisiveis([mensagemBoasVindas]);
    setTotalMensagens(1);
    setOffset(MENSAGENS_INICIAIS);
    setTemMais(false);

    return novaSessaoData;
  }, [uid]);

  /**
   * Carrega uma sessão existente pelo ID, exibindo apenas as últimas
   * MENSAGENS_INICIAIS mensagens para não sobrecarregar o chat.
   *
   * @param {string} sessaoId
   */
  const carregarSessao = useCallback(async (sessaoId) => {
    if (!uid) return;
    setCarregando(true);
    try {
      const docRef = doc(db, 'users', uid, 'syntax_sessoes', sessaoId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return;

      const sessao = snap.data();
      const total = sessao.mensagens?.length ?? 0;
      const visiveis = (sessao.mensagens || []).slice(-MENSAGENS_INICIAIS);
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

  /**
   * Carrega o bloco anterior de mensagens ao clicar em "Carregar mensagens anteriores".
   * Insere no início do array visível sem perder a posição do scroll (responsabilidade
   * do componente — ver carregarMaisComScroll em Syntax.jsx).
   */
  const carregarMais = useCallback(() => {
    if (!sessaoAtual || !temMais) return;

    const novoOffset = Math.max(0, offset - MENSAGENS_POR_PAGINA);
    const novasFatia = (sessaoAtual.mensagens || []).slice(novoOffset, offset);

    setMensagensVisiveis((prev) => [...novasFatia, ...prev]);
    setOffset(novoOffset);
    setTemMais(novoOffset > 0);
  }, [sessaoAtual, offset, temMais]);

  /**
   * Adiciona uma nova mensagem à sessão atual e persiste no Firestore.
   * System messages (isSystem: true) são adicionadas apenas à UI, nunca ao Firestore.
   *
   * NOTE: o título da sessão é gerado automaticamente na primeira mensagem do usuário.
   * WARN: sessao.mensagens cresce sem limite — considere arquivar sessões longas.
   *
   * @param {object} mensagem - Mensagem com { role, content, time, timestamp, isSystem? }
   */
  const adicionarMensagem = useCallback(async (mensagem) => {
    // System messages ficam apenas na UI (feedback transiente)
    if (mensagem.isSystem) {
      setMensagensVisiveis((prev) => [...prev, mensagem]);
      return;
    }

    // Atualização otimista da UI
    setMensagensVisiveis((prev) => [...prev, mensagem]);

    // GUARD: sessão deve existir antes de adicionar mensagens
    if (!uid || !sessaoAtual?.id) {
      console.error('[Syntax] Tentativa de salvar mensagem sem sessão ativa');
      return;
    }

    const mensagensAtualizadas = [...(sessaoAtual.mensagens || []), mensagem];

    const ehPrimeiraMensagemUsuario =
      mensagem.role === 'user' && sessaoAtual.titulo === 'Nova conversa';
    const novoTitulo = ehPrimeiraMensagemUsuario
      ? gerarTitulo(mensagem.content)
      : sessaoAtual.titulo;

    const sessaoAtualizada = {
      ...sessaoAtual,
      titulo: novoTitulo,
      mensagens: mensagensAtualizadas,
      totalMensagens: mensagensAtualizadas.length,
      ultimaAtualizacao: new Date().toISOString(),
    };

    try {
      await setDoc(
        doc(db, 'users', uid, 'syntax_sessoes', sessaoAtual.id),
        sessaoAtualizada,
        { merge: true }
      );
    } catch (err) {
      console.error('[Syntax] Erro ao salvar sessão:', err);
    }

    setSessaoAtual(sessaoAtualizada);
    setTotalMensagens(mensagensAtualizadas.length);
  }, [sessaoAtual, uid]);

  /**
   * Persiste uma mensagem no Firestore SEM atualizar a UI (mensagensVisiveis).
   * Usado quando a digitação progressiva já atualizou a UI manualmente.
   *
   * @param {object} mensagem - Mensagem com { role, content, time, timestamp }
   */
  const adicionarMensagemSemUI = useCallback(async (mensagem) => {
    if (!uid || !sessaoAtual?.id || mensagem.isSystem) return;

    const mensagensAtualizadas = [...(sessaoAtual.mensagens || []), mensagem];

    const ehPrimeiraMensagemUsuario =
      mensagem.role === 'user' && sessaoAtual.titulo === 'Nova conversa';
    const novoTitulo = ehPrimeiraMensagemUsuario
      ? gerarTitulo(mensagem.content)
      : sessaoAtual.titulo;

    const sessaoAtualizada = {
      ...sessaoAtual,
      titulo: novoTitulo,
      mensagens: mensagensAtualizadas,
      totalMensagens: mensagensAtualizadas.length,
      ultimaAtualizacao: new Date().toISOString(),
    };

    try {
      await setDoc(
        doc(db, 'users', uid, 'syntax_sessoes', sessaoAtual.id),
        sessaoAtualizada,
        { merge: true }
      );
    } catch (err) {
      console.error('[Syntax] Erro ao salvar sessão:', err);
    }

    setSessaoAtual(sessaoAtualizada);
    setTotalMensagens(mensagensAtualizadas.length);
  }, [sessaoAtual, uid]);

  /**
   * Busca as últimas 15 sessões do usuário para o painel de histórico.
   * Ordenadas por ultimaAtualizacao decrescente.
   *
   * @returns {Promise<object[]>}
   */
  const listarSessoes = useCallback(async () => {
    if (!uid) return [];
    try {
      const ref = collection(db, 'users', uid, 'syntax_sessoes');
      const q = query(ref, orderBy('ultimaAtualizacao', 'desc'), limit(15));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (err) {
      console.warn('[useSyntaxSessoes] Erro ao listar sessões:', err?.message);
      return [];
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