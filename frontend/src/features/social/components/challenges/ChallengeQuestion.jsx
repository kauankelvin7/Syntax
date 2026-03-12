/**
 * ⏱️ CHALLENGE QUESTION 
 * * Interface de duelo gamificada (Code Battle) com timer de alta tensão.
 * - Animação de pulso quando o tempo está acabando (< 5s)
 * - Respostas com feedback visual forte (Ícones + Sombras coloridas)
 * - Entrada em cascata (Staggered) das alternativas
 */

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Terminal } from 'lucide-react';

const TIMER_DURATION = 15; // 15 segundos por questão

const ChallengeQuestion = memo(({ question, questionIndex, totalQuestions, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isAnswered, setIsAnswered] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const hasSubmittedRef = useRef(false);

  // Reset on question change
  useEffect(() => {
    setSelectedOption(null);
    setTimeLeft(TIMER_DURATION);
    setIsAnswered(false);
    startTimeRef.current = Date.now();
    hasSubmittedRef.current = false;
  }, [questionIndex]);

  // Timer countdown
  useEffect(() => {
    if (isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            setIsAnswered(true);
            const elapsedMs = Date.now() - startTimeRef.current;
            onAnswer(questionIndex, null, elapsedMs);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [questionIndex, isAnswered, onAnswer]);

  const handleSelect = useCallback((optionIndex) => {
    if (isAnswered || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    clearInterval(timerRef.current);
    const elapsedMs = Date.now() - startTimeRef.current;
    onAnswer(questionIndex, optionIndex, elapsedMs);
  }, [isAnswered, questionIndex, onAnswer]);

  if (!question) return null;

  const isUrgent = timeLeft <= 5 && !isAnswered;
  const timerPercent = (timeLeft / TIMER_DURATION) * 100;
  // Cores adaptadas para a estética Tech/Neon
  const timerColor = timeLeft > 7 ? 'text-cyan-500' : timeLeft > 5 ? 'text-amber-500' : 'text-rose-500';
  const barColor = timeLeft > 7 ? 'bg-cyan-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-rose-500';

  const options = (question.options && question.options.length > 0)
    ? question.options
    : [question.back || question.front, ...(question.distractors || [])];

  const correctIndex = question.correctIndex ?? 0;

  // Variantes para a animação em cascata
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      key={questionIndex}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40, filter: 'blur(4px)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full max-w-2xl mx-auto w-full"
    >
      {/* ─── Header: Progresso e Timer ─── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-cyan-400 font-black text-[15px] border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
            {questionIndex + 1}
          </div>
          <span className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            de {totalQuestions}
          </span>
        </div>
        
        <div className={`flex items-center gap-1.5 font-mono font-black text-[22px] transition-colors duration-300 ${timerColor} ${isUrgent ? 'animate-pulse scale-110 drop-shadow-md' : ''}`}>
          <Clock size={22} strokeWidth={isUrgent ? 3 : 2.5} />
          <span>{timeLeft}s</span>
        </div>
      </div>

      {/* ─── Barra de Tempo Gamificada ─── */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden shadow-inner">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${barColor} ${isUrgent ? 'shadow-[0_0_12px_rgba(225,29,72,0.8)]' : ''}`}
          initial={{ width: '100%' }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* ─── Pergunta (Terminal Style) ─── */}
      <div className="relative bg-slate-50 dark:bg-slate-900/50 rounded-[24px] p-6 sm:p-8 mb-8 shadow-inner border border-slate-200/80 dark:border-slate-800">
        <div className="absolute -top-4 -left-2 w-12 h-12 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-[14px] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(6,182,212,0.3)] rotate-[-8deg] border-2 border-white dark:border-slate-900">
          <Terminal size={22} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[17px] sm:text-[19px] font-bold text-slate-800 dark:text-slate-100 leading-relaxed text-center mt-2 tracking-tight">
          {question.front || question.question || 'Compile Error: Pergunta não encontrada'}
        </p>
      </div>

      {/* ─── Opções (Alternativas) ─── */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 flex-1 pb-4">
        {options.map((opt, idx) => {
          const isCorrect = idx === correctIndex;
          const isSelected = idx === selectedOption;
          
          let optionStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 text-slate-700 dark:text-slate-200';
          let IconComponent = null;

          if (isAnswered) {
            if (isCorrect) {
              optionStyle = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-lg shadow-emerald-500/20 text-emerald-800 dark:text-emerald-300 z-10 scale-[1.02]';
              IconComponent = <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={3} />;
            } else if (isSelected && !isCorrect) {
              optionStyle = 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 shadow-lg shadow-rose-500/20 text-rose-800 dark:text-rose-300';
              IconComponent = <XCircle size={20} className="text-rose-500" strokeWidth={3} />;
            } else {
              optionStyle = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-40 grayscale-[50%]';
            }
          }

          const labels = ['A', 'B', 'C', 'D', 'E'];

          return (
            <motion.button
              variants={itemVariants}
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={isAnswered}
              whileTap={!isAnswered ? { scale: 0.97 } : undefined}
              className={`
                w-full text-left flex items-center gap-4 p-4 rounded-[20px] border-2 transition-all duration-300
                ${optionStyle}
                ${!isAnswered ? 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/80' : 'cursor-default'}
              `}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-[10px] shrink-0 transition-colors shadow-inner
                ${isAnswered && isCorrect ? 'bg-emerald-200/50 dark:bg-emerald-900/50' : ''}
                ${isAnswered && isSelected && !isCorrect ? 'bg-rose-200/50 dark:bg-rose-900/50' : ''}
                ${!isAnswered || (!isCorrect && !isSelected) ? 'bg-slate-100 dark:bg-slate-900 text-slate-500 font-black text-sm border border-slate-200/50 dark:border-slate-700/50' : ''}
              `}>
                {IconComponent ? IconComponent : labels[idx] || idx + 1}
              </div>
              <span className={`text-[15px] font-semibold leading-snug ${isAnswered && (isCorrect || isSelected) ? 'font-black' : ''}`}>
                {typeof opt === 'string' ? opt : opt?.text || ''}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
});

ChallengeQuestion.displayName = 'ChallengeQuestion';
export default ChallengeQuestion;