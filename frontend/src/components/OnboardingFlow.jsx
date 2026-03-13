/**
 * 🚀 Onboarding Flow Premium - Syntax Theme
 * * Fluxo de introdução e configuração inicial para novos devs.
 * * Cores, ícones e copy ajustados para o contexto de Engenharia de Software.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CreditCard, FileCode2, Calendar, Flame, Rocket,
  ChevronLeft, ChevronRight, Sun, Moon, Trophy, Sparkles,
  ArrowRight, MessageSquareCode, Compass, User, Zap, Cpu, Terminal,
  FolderPlus, X, Check
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Z } from '../constants/zIndex';
import AdaAvatar from './Ada/AdaAvatar'; 

// ─── Confetti CSS Animation ──────────────────────────────────────────────────
const CONFETTI_COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];
const ConfettiPiece = ({ index }) => {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${5 + Math.random() * 90}%`;
  const delay = `${Math.random() * 2}s`;
  const duration = `${2.5 + Math.random() * 2}s`;
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;

  return (
    <span
      className="absolute top-0 rounded-sm opacity-0 pointer-events-none"
      style={{
        left,
        width: size,
        height: size * 1.6,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        animation: `confettiFall ${duration} ${delay} ease-out forwards`,
      }}
    />
  );
};

// ─── Step Definitions ────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;

// ─── Slide variants ──────────────────────────────────────────────────────────
const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 400 : -400, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ x: direction > 0 ? -400 : 400, opacity: 0, scale: 0.95 }),
};

export default function OnboardingFlow() {
  const { user } = useAuth();
  const { setMode, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const uid = user?.uid || user?.id;

  // Bloqueia UI até autenticação estar pronta
  if (!uid || !auth.currentUser) {
    return <div style={{textAlign:'center',marginTop:'2rem'}}>Aguardando backend...</div>;
  }

  // ─── State ───────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState('checking'); // checking | show | done
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    nomePreferido: user?.displayName || '',
    nivel: 'Iniciante',
    stack: [],
    objetivos: [],
  });
  const [nomeError, setNomeError] = useState('');
  const [savingNome, setSavingNome] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // ─── Check onboarding status ────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid, 'perfil', 'dados'));
        if (snap.exists() && snap.data().onboardingConcluido === true) {
          setStatus('done');
        } else {
          setStatus('show');
        }
      } catch {
        // Se houver erro de permissão ou rede, não bloqueia o app
        setStatus('done');
      }
    };
    check();
  }, [uid]);

  // ─── Navigation helpers ──────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setDirection(1);
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  }, []);

  const skipTour = useCallback(() => {
    setDirection(1);
    setStep(TOTAL_STEPS); // pula direto para conclusão
  }, []);

  const handleSaveName = async () => {
    const trimmed = onboardingData.nomePreferido.trim();
    if (trimmed.length < 2) {
      setNomeError('Mínimo 2 caracteres');
      return;
    }
    if (trimmed.length > 30) {
      setNomeError('Máximo 30 caracteres');
      return;
    }
    setNomeError('');
    setSavingNome(true);
    try {
      setOnboardingData((prev) => ({
        ...prev,
        nomePreferido: trimmed,
      }));
      goNext();
    } catch (error) {
      setNomeError('Erro inesperado. Tente novamente.');
      console.error("Erro detalhado:", error);
    } finally {
      setSavingNome(false);
    }
  };

  // ─── Step 3: Save stack ─────────────────────────────────────────────────────
  const handleSaveStack = async (stacks) => {
    setOnboardingData(prev => ({ ...prev, stack: stacks }));
    goNext();
  };

  // ─── Step 4: Save goals ─────────────────────────────────────────────────────
  const handleSaveGoals = async (goals) => {
    setOnboardingData(prev => ({ ...prev, objetivos: goals }));
    goNext();
  };

  // ─── Step 5: Finish onboarding ──────────────────────────────────────────────
  const finishOnboarding = useCallback(async (action) => {
    if (!uid || !auth.currentUser) return;
    setFinishing(true);
    try {
      // Atualiza displayName do Auth
      await updateProfile(auth.currentUser, {
        displayName: onboardingData.nomePreferido,
      });

      // Salva todos os dados de uma vez no Firestore
      await setDoc(
        doc(db, 'users', uid, 'perfil', 'dados'),
        {
          nomePreferido: onboardingData.nomePreferido,
          nivel: onboardingData.nivel,
          stack: onboardingData.stack,
          objetivos: onboardingData.objetivos,
          onboardingConcluido: true,
          onboardingConcluidoEm: serverTimestamp(),
        },
        { merge: true }
      );

      // Também salvar em preferenciasUsuario para a Ada ler
      await setDoc(
        doc(db, 'users', uid),
        {
          preferenciasUsuario: {
            nomePreferido: onboardingData.nomePreferido,
            nivelConhecimento: onboardingData.nivel,
            areasDeInteresse: onboardingData.stack,
            objetivos: onboardingData.objetivos
          }
        },
        { merge: true }
      );

      // Força reload do contexto de usuário para garantir nome/displayName atualizados
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cinesia:user:reload'));
      }

      setStatus('done');
      if (action === 'materias') {
        navigate('/materias');
      } else if (action === 'ada') {
        window.dispatchEvent(new CustomEvent('cinesia:kakabot:abrir')); // Mantivemos o evento interno antigo pra não quebrar a lógica
      }
    } catch (error) {
      setNomeError('Erro ao concluir setup. Verifique os logs.');
      console.error("Erro detalhado:", error);
    } finally {
      setFinishing(false);
    }
  }, [uid, onboardingData, navigate]);

  // ─── Render conditions ──────────────────────────────────────────────────────
  if (status !== 'show') return null;

  const nomePreferido =
    (onboardingData.nomePreferido &&
      onboardingData.nomePreferido.trim()) ||
    user?.displayName ||
    'Dev';

  return (
    <>
      {/* Confetti keyframes */}
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(85vh) rotate(720deg) scale(0.4); }
        }
      `}</style>

      <div style={{ zIndex: Z.onboarding }} className="fixed inset-0 flex items-center justify-center p-4">
        {/* Backdrop Refinado Premium */}
        <motion.div
          className="absolute inset-0 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal container - Efeito Glassmorphism Tech */}
        <motion.div
          className="relative w-full max-w-[520px] max-h-[90vh] overflow-hidden rounded-[32px] border shadow-2xl
            bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20 dark:border-slate-800/60 flex flex-col"
          style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: 'linear-gradient(90deg, #4f46e5, #06b6d4)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Content area */}
          <div className="relative overflow-hidden flex-1" style={{ minHeight: 460 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-10"
              >
                {step === 1 && <StepWelcome onNext={goNext} />}
                {step === 2 && (
                  <StepName
                    nome={onboardingData.nomePreferido}
                    setNome={(nome) => setOnboardingData((prev) => ({ ...prev, nomePreferido: nome }))}
                    nomeError={nomeError}
                    saving={savingNome}
                    onConfirm={handleSaveName}
                  />
                )}
                {step === 3 && (
                  <StepLevel
                    selected={onboardingData.nivel}
                    onSelect={(nivel) => {
                      setOnboardingData(prev => ({ ...prev, nivel }));
                      goNext();
                    }}
                  />
                )}
                {step === 4 && (
                  <StepStack
                    selected={onboardingData.stack}
                    onConfirm={handleSaveStack}
                  />
                )}
                {step === 5 && (
                  <StepGoals
                    selected={onboardingData.objetivos}
                    onConfirm={handleSaveGoals}
                  />
                )}
                {step === 6 && (
                  <StepConclusion
                    nome={nomePreferido}
                    finishing={finishing}
                    onFinish={finishOnboarding}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
            {/* Back button */}
            <div className="w-24">
              {step > 1 && step < TOTAL_STEPS && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                  Back
                </button>
              )}
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 flex-1">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-500 ${
                    i + 1 === step
                      ? 'w-6 h-2 bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-sm'
                      : i + 1 < step
                        ? 'w-2 h-2 bg-indigo-400/80'
                        : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Skip / Next for tour steps */}
            <div className="w-24 flex justify-end">
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS (Tech Adapted)
// ═══════════════════════════════════════════════════════════════════════════════

function StepLevel({ selected, onSelect }) {
  const levels = [
    { id: 'Iniciante', label: 'Iniciante', desc: 'Estou começando agora', icon: Rocket, color: '#10b981' },
    { id: 'Júnior', label: 'Júnior', desc: 'Já conheço o básico', icon: Zap, color: '#6366f1' },
    { id: 'Pleno', label: 'Pleno', desc: 'Atuo profissionalmente', icon: Cpu, color: '#8b5cf6' },
    { id: 'Sênior', label: 'Sênior', desc: 'Foco em arquitetura', icon: Trophy, color: '#f59e0b' },
  ];

  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Qual seu nível atual?
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-8">
        A Ada adaptará as explicações com base nisso.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[440px]">
        {levels.map((lvl) => (
          <button
            key={lvl.id}
            type="button"
            onClick={() => onSelect(lvl.id)}
            className={`relative p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 group
              ${selected === lvl.id
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-lg'
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected === lvl.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-500'}`}>
              <lvl.icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <span className="block text-[15px] font-bold text-slate-800 dark:text-white">{lvl.label}</span>
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">{lvl.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepStack({ selected, onConfirm }) {
  const [input, setInput] = useState('');
  const [chips, setChips] = useState(selected.length > 0 ? selected : ['Javascript', 'TypeScript', 'React']);

  const addChip = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      if (!chips.includes(input.trim())) setChips([...chips, input.trim()]);
      setInput('');
    }
  };

  const removeChip = (c) => setChips(chips.filter(item => item !== c));

  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Sua Stack Principal
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-8">
        Quais linguagens e tecnologias você domina ou quer focar?
      </p>

      <div className="w-full max-w-sm mb-8">
        <div className="relative mb-4">
          <Terminal size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={addChip}
            placeholder="Ex: Python, Go, SQL..."
            className="w-full pl-12 pr-4 h-14 rounded-2xl text-[15px] font-bold border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {chips.map(c => (
            <span key={c} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[12px] font-black uppercase tracking-wider">
              {c}
              <button onClick={() => removeChip(c)} className="hover:text-rose-500"><X size={14} /></button>
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onConfirm(chips)}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 transition-all active:scale-[0.97]"
      >
        Continuar <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function StepGoals({ selected, onConfirm }) {
  const options = [
    { id: 'entrevistas', label: 'Entrevistas técnicas', icon: MessageSquareCode },
    { id: 'clean_code', label: 'Clean code e boas práticas', icon: BookOpen },
    { id: 'arquitetura', label: 'Arquitetura de sistemas', icon: Cpu },
    { id: 'algoritmos', label: 'Algoritmos e estruturas', icon: Terminal },
  ];

  const [goals, setGoals] = useState(selected);

  const toggle = (id) => {
    if (goals.includes(id)) setGoals(goals.filter(g => g !== id));
    else setGoals([...goals, id]);
  };

  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Qual seu objetivo?
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-8">
        Selecione um ou mais focos de estudo.
      </p>

      <div className="grid grid-cols-1 gap-3 w-full max-w-[400px] mb-8">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
              ${goals.includes(opt.id)
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30'
                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200'
              }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${goals.includes(opt.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <opt.icon size={20} />
            </div>
            <span className="font-bold text-[14px] text-slate-700 dark:text-slate-200">{opt.label}</span>
            {goals.includes(opt.id) && <Check size={20} className="ml-auto text-indigo-500" strokeWidth={3} />}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onConfirm(goals)}
        disabled={goals.length === 0}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 transition-all disabled:opacity-50"
      >
        Finalizar Setup
      </button>
    </div>
  );
}

function StepWelcome({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      {/* Animated ring + icon */}
      <div className="relative mb-8">
        <motion.div
          className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-xl relative z-10"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Terminal size={44} color="#fff" strokeWidth={1.8} />
        </motion.div>
        {/* Glow effect behind */}
        <motion.div
          className="absolute inset-0 rounded-[28px] bg-indigo-500 blur-2xl opacity-50"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent mb-3 tracking-tight">
        Syntax
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-[15px] font-bold uppercase tracking-widest mb-8">
        Engenharia de Software
      </p>

      <p className="text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-sm text-[15px] font-medium">
        Seja bem-vindo(a) ao seu novo ambiente de estudos. Vamos compilar suas configurações em menos de 1 minuto.
      </p>

      <button
        type="button"
        onClick={onNext}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg flex items-center justify-center gap-2
          bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600
          transition-all hover:shadow-indigo-500/30 active:scale-[0.97]"
      >
        <Zap size={18} strokeWidth={2.5} /> Iniciar Setup
      </button>
    </div>
  );
}

function StepName({ nome, setNome, nomeError, saving, onConfirm }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-20 h-20 rounded-[24px] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-6 border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
        <span className="text-4xl">👋</span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Como podemos te chamar?
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        Esse nome será usado pela Ada (IA) e nos logs do seu painel principal.
      </p>

      <div className="w-full max-w-sm mb-8 relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <User size={20} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome ou nickname dev"
          maxLength={30}
          className="w-full pl-12 pr-4 h-14 rounded-2xl text-[16px] font-bold
            border-2 border-slate-200 dark:border-slate-700
            bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white
            focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10
            placeholder:text-slate-400 transition-all shadow-inner"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
        />
        <div className="flex justify-between mt-2 px-2">
          {nomeError ? (
            <span className="text-[12px] font-bold text-rose-500">{nomeError}</span>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{nome.length}/30 chars</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={saving || nome.trim().length < 2}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg flex items-center justify-center gap-2
          bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90
          transition-all hover:shadow-indigo-500/30 active:scale-[0.97]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Gravando...' : 'Next Step'} <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function StepTheme({ selected, setSelected, saving, onConfirm }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Selecione o seu Tema
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-8">
        Qual ambiente de IDE você prefere para codar e estudar?
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-[360px] mb-10">
        {/* Dark option */}
        <button
          type="button"
          onClick={() => setSelected('dark')}
          className={`relative p-5 rounded-[24px] border-2 transition-all text-center flex flex-col items-center group
            ${selected === 'dark'
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-lg shadow-indigo-500/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
        >
          <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center mb-3 transition-colors ${selected === 'dark' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-indigo-500'}`}>
            <Moon size={24} strokeWidth={2.5} />
          </div>
          <span className="block text-[15px] font-bold text-slate-800 dark:text-white mb-1">Dark Mode</span>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            O padrão da indústria
          </span>
          {selected === 'dark' && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </button>

        {/* Light option */}
        <button
          type="button"
          onClick={() => setSelected('light')}
          className={`relative p-5 rounded-[24px] border-2 transition-all text-center flex flex-col items-center group
            ${selected === 'light'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/30 shadow-lg shadow-amber-500/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
            }`}
        >
          <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center mb-3 transition-colors ${selected === 'light' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-amber-500'}`}>
            <Sun size={24} strokeWidth={2.5} />
          </div>
          <span className="block text-[15px] font-bold text-slate-800 dark:text-white mb-1">Light Mode</span>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
            Para leitura em sol forte
          </span>
          {selected === 'light' && (
            <motion.div
              layoutId="theme-check"
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={saving}
        className="w-full sm:w-[85%] h-14 rounded-2xl font-bold text-white text-[15px] shadow-lg flex items-center justify-center gap-2
          bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90
          transition-all hover:shadow-indigo-500/30 active:scale-[0.97]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Aplicando...' : 'Aplicar Tema'} <ArrowRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Tour Steps ─────────────────────────────────────────────────────────────

function TourLayout({ icon: Icon, iconColor, title, text, children }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="relative mb-6">
        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center shadow-lg relative z-10 border border-white/20 dark:border-white/5"
          style={{ background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)` }}
        >
          <Icon size={36} color="#fff" strokeWidth={2} />
        </div>
        <div 
          className="absolute inset-0 blur-xl opacity-50 rounded-[24px]" 
          style={{ backgroundColor: iconColor }} 
        />
      </div>
      
      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%] mb-8">
        {text}
      </p>
      
      <div className="w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}

function StepTourMaterias() {
  return (
    <TourLayout
      icon={BookOpen}
      iconColor="#4f46e5" // Indigo
      title="Módulos & Pastas"
      text="Organize seus estudos em módulos como 'React', 'Bancos de Dados' ou 'Design Patterns'. Toda sua documentação ficará centralizada."
    >
      <div className="flex flex-col w-full max-w-[320px] gap-2 p-3 rounded-[20px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 shadow-inner">
        {[
          { name: 'Frontend (React)', color: '#06b6d4', count: 12 },
          { name: 'System Design', color: '#8b5cf6', count: 8 },
          { name: 'Algoritmos & DBs', color: '#f59e0b', count: 24 },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-[15px] shrink-0" style={{ backgroundColor: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}>
              {m.name.charAt(0)}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200">{m.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{m.count} arquivos</p>
            </div>
            <ChevronRight size={16} strokeWidth={2.5} className="text-slate-300 dark:text-slate-600" />
          </div>
        ))}
      </div>
    </TourLayout>
  );
}

function StepTourFlashcards() {
  return (
    <TourLayout
      icon={CreditCard}
      iconColor="#06b6d4" // Cyan
      title="Code Flashcards"
      text="Nosso algoritmo espaçado SM-2 agenda a revisão de cada card baseado no seu índice de esquecimento (Ebbinghaus). Decore sintaxe sem esforço."
    >
      <div className="relative w-full max-w-[320px] h-[160px] flex items-center justify-center mt-2">
        {/* Card Traseiro (Stack effect) */}
        <div className="absolute top-4 left-4 right-4 bottom-[-16px] rounded-[24px] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 transform rotate-[-3deg] scale-[0.92]" />
        <div className="absolute top-2 left-2 right-2 bottom-[-8px] rounded-[24px] bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 transform rotate-[1.5deg] scale-[0.96]" />
        
        {/* Card Principal */}
        <div className="relative z-10 w-full h-full rounded-[24px] bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-900/50 shadow-[0_8px_30px_rgba(6,182,212,0.15)] p-5 flex flex-col text-left">
          <div className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-3 flex items-center justify-between">
            Backend <Sparkles size={12} />
          </div>
          <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">
            Qual a principal diferença entre processamento Concorrente e Paralelo?
          </p>
          <div className="mt-auto border-t border-dashed border-slate-200 dark:border-slate-700 pt-3 flex items-center gap-2">
            <Terminal size={14} className="text-slate-400" />
            <p className="text-[12px] font-mono font-bold text-slate-500 dark:text-slate-400 blur-[3px] select-none">
              Concorrência gere threads, paralelismo roda ao mesmo tempo.
            </p>
          </div>
        </div>
      </div>
    </TourLayout>
  );
}

function StepTourResumos() {
  return (
    <TourLayout
      icon={FileCode2}
      iconColor="#8b5cf6" // Violet
      title="Documentação Rica"
      text="Crie docs estruturadas no nosso editor Notion-like. Com 1 clique, nossa IA transforma o seu texto em dezenas de flashcards de teste."
    >
      <div className="w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-[24px] shadow-lg border border-slate-200 dark:border-slate-800 p-5 text-left">
        <div className="flex items-center gap-2 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="ml-auto flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/50 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 shadow-sm">
            <Zap size={10} strokeWidth={3} /> Gerar Cards
          </div>
        </div>
        <div className="space-y-3">
          <div className="w-2/3 h-4 rounded-md bg-slate-200 dark:bg-slate-700" />
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="w-4/5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" />
          
          <div className="w-full h-10 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 mt-4 flex items-center px-3">
             <span className="text-slate-300 dark:text-slate-600 font-mono text-[10px]">{'<code>'} return true {'</code>'}</span>
          </div>
        </div>
      </div>
    </TourLayout>
  );
}

function StepTourAda() {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="relative mb-6 flex justify-center mt-2">
        <AdaAvatar size="lg" speaking showStatus />
        <motion.div 
          className="absolute -right-12 -top-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-[16px] rounded-bl-none shadow-lg border border-slate-100 dark:border-slate-700"
          initial={{ opacity: 0, y: 15, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
        >
          <span className="text-[12px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            System Online!
          </span>
        </motion.div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Sua Copilot Pessoal
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%] mb-10">
        A Ada tira dúvidas de arquitetura, gera snippets e roda scripts para criar materiais no seu banco de dados em tempo real.
      </p>

      {/* FAB mockup animado */}
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-[20px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-inner">
        <motion.div
          className="w-12 h-12 rounded-[16px] flex items-center justify-center shadow-[0_4px_15px_rgba(6,182,212,0.4)] relative"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Cpu size={22} color="#fff" strokeWidth={2} />
        </motion.div>
        <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 text-left leading-relaxed">
          O ícone flutuante fica<br/>disponível em todas as telas
        </span>
      </div>
    </div>
  );
}

function StepTourAgenda() {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="flex items-center gap-4 mb-8 relative">
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shadow-lg border border-indigo-100 dark:border-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', backgroundColor: 'transparent' }}
        >
          <Terminal size={30} className="text-indigo-600" strokeWidth={2.5} />
        </div>
        <div className="w-8 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shadow-lg border border-orange-100 dark:border-orange-500/20"
          style={{ background: 'linear-gradient(135deg, #fffbeb, #ffedd5)', backgroundColor: 'transparent' }}
        >
          <Flame size={32} className="text-orange-500" strokeWidth={2} />
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Commits & Streaks
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[90%] mb-8">
        Assim como o GitHub, cada dia codando/estudando acende seu Streak diário. A consistência é o maior segredo para virar Sênior.
      </p>

      {/* Streak mockup premium */}
      <div className="flex items-center justify-center gap-2 p-5 rounded-[24px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-inner w-full max-w-[340px]">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => {
          const isActive = d <= 5;
          const isToday = d === 5;
          return (
            <div key={d} className="flex flex-col items-center gap-2">
              <div 
                className={`w-9 h-11 rounded-[12px] flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-gradient-to-b from-orange-400 to-orange-500 shadow-md shadow-orange-500/30' 
                    : 'bg-slate-200 dark:bg-slate-800'
                } ${isToday ? 'scale-110 border-2 border-white dark:border-slate-700' : ''}`}
              >
                {isActive && <Flame size={18} color="#fff" strokeWidth={2.5} />}
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">D{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepConclusion({ nome, finishing, onFinish }) {
  return (
    <div className="flex flex-col items-center text-center relative overflow-hidden w-full h-full justify-center">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(79,70,229,0.4)] border-4 border-white/20 dark:border-slate-800"
      >
        <Rocket size={44} color="#fff" strokeWidth={2} />
      </motion.div>

      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">
        Build Completo, {nome}!
      </h2>
      <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[85%] mb-10">
        Seu workspace está configurado e pronto para uso. O que você quer fazer agora?
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[380px]">
        <button
          type="button"
          onClick={() => onFinish('materias')}
          disabled={finishing}
          className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-lg
            bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90
            transition-all hover:shadow-indigo-500/30 active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed text-[14px]"
        >
          <FolderPlus size={18} strokeWidth={2.5} />
          Criar Módulo
        </button>

        <button
          type="button"
          onClick={() => onFinish('ada')}
          disabled={finishing}
          className="flex-1 h-14 flex items-center justify-center gap-2 rounded-2xl font-bold shadow-sm
            bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-2 border-indigo-100 dark:border-indigo-800/50
            hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed text-[14px]"
        >
          <MessageSquareCode size={18} strokeWidth={2.5} />
          Acionar Ada
        </button>
      </div>

      <button
        type="button"
        onClick={() => onFinish('explore')}
        disabled={finishing}
        className="mt-8 flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600
          dark:hover:text-slate-300 transition-colors disabled:opacity-50"
      >
        <Compass size={16} strokeWidth={2.5} />
        Apenas explorar o painel
      </button>
    </div>
  );
}