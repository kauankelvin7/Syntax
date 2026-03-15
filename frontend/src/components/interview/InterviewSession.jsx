import React, { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, Info, AlertCircle, Clock, Zap, Cpu, Code2 } from 'lucide-react';
import { Z } from '../../constants/zIndex';
import CodeEditor from '../ide/CodeEditor';

const InterviewSession = ({ questions, onComplete, onCancel }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  
  const currentQuestion = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setActiveTab('text');
    } else {
      onComplete(answers);
    }
  };

  const handleAnswerChange = (val) => {
    setAnswers({ ...answers, [currentQuestion.id]: val });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-[100] overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center px-6 bg-slate-900 border-b border-white/5 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu size={24} className="text-white" />
            </div>
            <div>
              <span className="block text-xs font-black text-indigo-400 uppercase tracking-widest">Ada AI Interviewer</span>
              <span className="text-sm font-bold text-white uppercase tracking-tighter">Entrevista em Andamento</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 border border-white/5">
            <Clock size={16} className="text-slate-500" />
            <span className="text-sm font-mono font-bold text-slate-300">{formatTime(timer)}</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="text-right">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Progresso</span>
                <span className="text-xs font-bold text-white">{currentIdx + 1} de {questions.length}</span>
             </div>
             <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-indigo-500 shadow-lg shadow-indigo-500/50"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                />
             </div>
          </div>

          <button 
            onClick={onCancel}
            className="px-4 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold uppercase tracking-widest border border-red-500/20 transition-all"
          >
            Encerrar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Question Card */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[28px] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={80} />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600/20 text-[10px] font-black text-indigo-400 uppercase tracking-wider border border-indigo-500/20">
                        {currentQuestion.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-wider border border-white/5">
                        {currentQuestion.difficulty}
                    </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tighter">
                    {currentQuestion.question}
                </h2>
            </div>

            {/* Answer Area */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                            activeTab === 'text' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Resposta Texto
                    </button>
                    {currentQuestion.type === 'coding' && (
                        <button 
                            onClick={() => setActiveTab('code')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                activeTab === 'code' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <Code2 size={14} />
                            Código
                        </button>
                    )}
                </div>

                <div className="h-[400px] rounded-[28px] overflow-hidden border border-white/5 bg-slate-900/30 backdrop-blur-sm relative group focus-within:border-indigo-500/50 transition-colors">
                    {activeTab === 'text' ? (
                        <textarea
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            placeholder="Sua resposta aqui... Explique seu raciocínio detalhadamente."
                            className="w-full h-full bg-transparent p-8 text-slate-200 placeholder:text-slate-700 focus:outline-none resize-none font-medium leading-relaxed"
                        />
                    ) : (
                        <div className="h-full pt-4">
                            <CodeEditor 
                                code={answers[currentQuestion.id] || '// Escreva sua solução aqui'}
                                language="javascript"
                                onChange={handleAnswerChange}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-8">
                <button 
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-widest"
                    title="Pedir uma dica reduzirá sua pontuação final"
                >
                    <Info size={14} />
                    Pedir Dica (-10 pts)
                </button>

                <button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                    className="flex items-center gap-3 px-8 py-4 rounded-[18px] bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-black uppercase tracking-tighter text-lg shadow-xl shadow-indigo-600/30 hover:scale-105 disabled:opacity-50 disabled:grayscale transition-all"
                >
                    <span>{currentIdx === questions.length - 1 ? 'Finalizar Entrevista' : 'Próxima Pergunta'}</span>
                    <SkipForward size={20} />
                </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

InterviewSession.displayName = 'InterviewSession';

export default memo(InterviewSession);
