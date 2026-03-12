/**
 * 🏟️ CHALLENGE ROOM
 * * A Arena de Batalha de Código (Full-Screen Container).
 * - Background radial imersivo (Modo Foco)
 * - Telas de Loading e Waiting gamificadas (Radar de rede)
 * - Header de combate polido estilo CodeWars
 */

import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Loader2, Zap, WifiOff, ArrowLeft, Terminal } from 'lucide-react';
import ChallengeQuestion from './ChallengeQuestion';
import ChallengeScoreboard from './ChallengeScoreboard';
import ChallengeResults from './ChallengeResults';
import { useChallenge } from '../../hooks/useChallenge';

const ChallengeRoom = memo(({ challengeId, currentUserId, onClose }) => {
  const { challenge, loading, submitAnswer } = useChallenge(challengeId);
  const [currentQ, setCurrentQ] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questions = useMemo(() => challenge?.questions || [], [challenge?.questions]);
  const totalQ = questions.length;
  const myPlayerData = challenge?.players?.[currentUserId];
  const answeredCount = myPlayerData?.answers?.length || 0;

  // Avança para próxima questão ou resultados
  const handleAnswer = useCallback(async (questionIndex, selectedOption, elapsedMs) => {
      const question = questions[questionIndex];
      if (!question || !challengeId) return;

      const correct = selectedOption !== null && selectedOption === (question.correctIndex ?? 0);

      try {
        await submitAnswer(questionIndex, selectedOption, correct, elapsedMs);
      } catch (err) {
        console.error('Erro ao enviar resposta:', err);
      }

      // Auto-avança após 1.4s para mostrar feedback de acerto/erro confortavelmente
      setTimeout(() => {
        if (questionIndex + 1 >= totalQ) {
          setShowResults(true);
        } else {
          setCurrentQ(questionIndex + 1);
        }
      }, 1400); 
    },
    [questions, challengeId, submitAnswer, totalQ],
  );

  useEffect(() => {
    if (challenge?.status === 'finished') {
      setShowResults(true);
    }
  }, [challenge?.status]);

  useEffect(() => {
    if (!challenge) return;
    if (answeredCount > 0 && answeredCount < totalQ && answeredCount > currentQ) {
      setCurrentQ(answeredCount);
    }
  }, [challenge?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── TELA 1: LOADING (Warm-up Tech) ───
  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950" />
        <div className="relative text-center flex flex-col items-center">
          <div className="relative w-24 h-24 mb-6">
             <div className="absolute inset-0 border-[3px] border-cyan-500/30 rounded-[24px] animate-ping rotate-12" />
             <div className="relative w-full h-full bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-[24px] flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <Terminal size={40} className="text-white animate-pulse" strokeWidth={2} />
             </div>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Iniciando Ambiente</h2>
          <p className="text-[13px] font-mono text-cyan-400/80">Compilando dependências do duelo...</p>
        </div>
      </div>
    );
  }

  // ─── TELA 2: ERROR / NOT FOUND ───
  if (!challenge) {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900 flex items-center justify-center">
        <div className="text-center px-6 w-full max-w-sm">
          <div className="w-20 h-20 bg-slate-800 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
             <WifiOff size={32} className="text-slate-400" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Connection Refused</h2>
          <p className="text-[14px] text-slate-400 mb-8 mx-auto leading-relaxed">
            Não foi possível localizar o servidor da arena. O duelo expirou ou foi cancelado.
          </p>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-2xl font-black text-[14px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg"
          >
            <ArrowLeft size={18} strokeWidth={2.5} /> Abortar (Exit 1)
          </button>
        </div>
      </div>
    );
  }

  // ─── TELA 3: AGUARDANDO OPONENTE (Network Radar) ───
  if (challenge.status === 'pending') {
    return (
      <div className="fixed inset-0 z-[110] bg-slate-900 flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900 to-slate-950 pointer-events-none" />
        
        <div className="relative text-center px-6 w-full max-w-sm">
          
          {/* Radar Animation */}
          <div className="relative w-32 h-32 mx-auto mb-10">
             {/* Oponent Placeholder */}
             <div className="absolute top-0 right-0 w-10 h-10 bg-slate-800 border-2 border-slate-700 rounded-[12px] flex items-center justify-center z-10 animate-bounce shadow-lg">
                <span className="text-lg">❓</span>
             </div>
             
             {/* Player */}
             <motion.div
               animate={{ rotate: [0, 15, -15, 0] }}
               transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
               className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] z-20"
             >
               <Swords size={44} className="text-white drop-shadow-md" strokeWidth={2.5} />
             </motion.div>

             {/* Radar Waves */}
             <div className="absolute inset-0 border-2 border-cyan-500/40 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
             <div className="absolute inset-[-20px] border border-cyan-500/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            Aguardando conexão...
          </h2>
          <p className="text-[14px] text-slate-400 mb-10 leading-relaxed">
            A request de duelo foi enviada para <br/>
            <span className="font-black text-cyan-400 text-[16px] uppercase tracking-wider">{challenge.inviteeName || challenge.challengedName || 'Oponente'}</span>
          </p>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg"
          >
            <X size={18} strokeWidth={2.5} /> Cancelar Request
          </button>
        </div>
      </div>
    );
  }

  // ─── TELA 4: RESULTADOS ───
  if (showResults) {
    return (
      <ChallengeResults challenge={challenge} currentUserId={currentUserId} onClose={onClose} />
    );
  }

  // ─── TELA 5: ARENA (JOGO EM ANDAMENTO) ───
  return (
    <motion.div
      className="fixed inset-0 z-[110] bg-slate-50 dark:bg-slate-950 flex flex-col"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Imersivo da Arena */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-slate-50 to-slate-50 dark:from-indigo-900/10 dark:via-slate-950 dark:to-slate-950 pointer-events-none" />

      {/* Header com scoreboard */}
      <div className="relative shrink-0 px-4 pt-4 pb-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/80 shadow-sm z-10">
        <div className="flex items-center justify-between mb-5 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-[10px] border border-rose-100 dark:border-rose-900/50 shadow-sm">
            <Zap size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-500">
              Code Battle
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-[12px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors active:scale-95 border border-transparent dark:border-slate-700/50"
            aria-label="Sair"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="max-w-2xl mx-auto w-full">
          <ChallengeScoreboard challenge={challenge} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Question area */}
      <div className="relative flex-1 overflow-y-auto px-4 py-6 z-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          <ChallengeQuestion
            key={currentQ}
            question={questions[currentQ]}
            questionIndex={currentQ}
            totalQuestions={totalQ}
            onAnswer={handleAnswer}
          />
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

ChallengeRoom.displayName = 'ChallengeRoom';
export default ChallengeRoom;