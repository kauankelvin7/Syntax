/**
 * 🛰️ HOME (MISSION CONTROL) — Syntax Theme Premium
 * Dashboard Central de Operações do Engenheiro de Software.
 * CORRIGIDO: tag </SectionCard> no último widget + dados reais nos widgets
 */

import { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FileText,
  CreditCard,
  Plus,
  Calendar,
  ChevronRight,
  Zap,
  Target,
  Trash2,
  Sun,
  CloudSun,
  Moon,
  Search,
  Layers,
  Lightbulb,
  Terminal,
  Cpu,
  Activity,
  Code2,
  Database,
  Flame,
  CheckCircle2,
  Newspaper,
  MessageSquare,
  Users,
  Globe,
  Github,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useDashboardData } from '../contexts/DashboardDataContext';
import { salvarEvento, deletarEvento, listarFlashcards, atualizarMetaMensal } from '../services/firebaseService';
import { isDueForReview } from '../utils/sm2';
import { useTheme } from '../contexts/ThemeContext';
import { Z } from '../constants/zIndex';
import AddEventModal from '../components/modals/AddEventModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import SkeletonPulse from '../components/ui/SkeletonPulse';

import { useGitHub } from '../hooks/useGitHub';

/* ═══════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════ */

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Bom dia',   Icon: Sun,     color: '#FBBF24' };
  if (hour >= 12 && hour < 18) return { text: 'Boa tarde', Icon: CloudSun, color: '#FB923C' };
  return                               { text: 'Boa noite', Icon: Moon,    color: '#A78BFA' };
};

const techPhrases = [
  'A arquitetura de software é a base. Domine-a e o sistema escalará.',
  'Cada Logic_Unit revisada é um passo mais perto da senioridade.',
  'Consistência supera intensidade no deploy de conhecimento.',
  'Seu futuro código agradece cada hora de estudo de fundamentos.',
  'Engenharia de Software é ciência e abstração — domine ambas.',
  'Pequenos commits diários constroem um repositório sólido.',
  'Refatore hoje o que aprendeu ontem. O aprendizado é iterativo!',
  'Você está construindo uma stack que vai durar toda sua carreira.',
];

const getMotivationalPhrase = () => {
  const idx = (new Date().getDate() + new Date().getHours()) % techPhrases.length;
  return techPhrases[idx];
};

const getStoredMetaMensal = () => {
  try {
    const raw = localStorage.getItem('cinesia:meta:mensal');
    if (raw == null) return { value: 50, hasSaved: false };
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) return { value: 50, hasSaved: false };
    return { value: Math.min(500, Math.round(parsed)), hasSaved: true };
  } catch {
    return { value: 50, hasSaved: false };
  }
};

const parseSafeDate = (value) => {
  try {
    const candidate = value?.toDate?.() || (value ? new Date(value) : null);
    if (!candidate || Number.isNaN(candidate.getTime())) return null;
    return candidate;
  } catch {
    return null;
  }
};

/* ═══════════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════════ */

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ═══════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════ */
const AnimatedNumber = ({ value, duration = 1.2, className = 'tabular-nums font-mono', style }) => {
  const [display, setDisplay] = useState(0);
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const target = typeof value === 'number' ? value : 0;
    if (target === 0) { setDisplay(0); return; }
    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, inView, duration]);

  return <span ref={ref} className={className} style={style}>{display}</span>;
};

/* ═══════════════════════════════════════════
   AVATAR WITH FALLBACK
═══════════════════════════════════════════ */
const Avatar = memo(({ src, name, size = 56, ring = false, className = '' }) => {
  const [error, setError] = useState(false);
  const initials = useMemo(() =>
    (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  , [name]);
  const bgColor = useMemo(() => {
    const colors = ['#6366F1','#06B6D4','#8B5CF6','#10B981','#F59E0B','#F43F5E'];
    return colors[(name || '').charCodeAt(0) % colors.length || 0];
  }, [name]);

  const renderFallback = (w, h, fs) => (
    <div
      className="rounded-[18px] flex items-center justify-center text-white font-black shrink-0 shadow-inner border border-white/10"
      style={{ width: w, height: h, backgroundColor: bgColor, fontSize: fs }}
    >
      {initials}
    </div>
  );

  if (!ring) {
    return (
      <div className={className}>
        {(error || !src) ? renderFallback(size, size, size * 0.35) : (
          <img
            src={src} alt=""
            className="rounded-[18px] object-cover shrink-0 shadow-sm border border-white/10"
            style={{ width: size, height: size }}
            onError={() => setError(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size + 10, height: size + 10 }}>
      <div className="absolute inset-0 rounded-[22px] opacity-80 bg-gradient-to-tr from-indigo-600 via-cyan-400 to-indigo-600 animate-spin-slow" />
      <div className="absolute rounded-[19px] bg-white dark:bg-slate-950" style={{ inset: '3px' }} />
      <div className="absolute overflow-hidden rounded-[16px]" style={{ inset: '6px' }}>
        {(error || !src) ? (
          <div className="w-full h-full flex items-center justify-center text-white font-black bg-indigo-600" style={{ fontSize: size * 0.35 }}>{initials}</div>
        ) : (
          <img src={src} alt="" className="w-full h-full object-cover" onError={() => setError(true)} />
        )}
      </div>
    </div>
  );
});
Avatar.displayName = 'Avatar';

/* ═══════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════ */
const KPI_VARIANTS = {
  materias:  { color: '#6366F1', Icon: Code2,    label: 'Stacks',  sublabel: 'Matérias ativas',    path: '/materias'   },
  flashcard: { color: '#06B6D4', Icon: Cpu,      label: 'Logics',  sublabel: 'Revisões pendentes', path: '/flashcards' },
  resumos:   { color: '#10B981', Icon: Database, label: 'Docs',    sublabel: 'Resumos salvos',     path: '/resumos'    },
  feed:      { color: '#F59E0B', Icon: Newspaper,label: 'Feed',    sublabel: 'Novas notícias',     path: '/feed'       },
  ide:       { color: '#8B5CF6', Icon: Code2,    label: 'IDE',     sublabel: 'Snippets salvos',    path: '/ide'        },
  rooms:     { color: '#6366F1', Icon: Users,    label: 'Rooms',   sublabel: 'Salas ativas',       path: '/study-rooms'},
  community: { color: '#06B6D4', Icon: Globe,    label: 'Lib',     sublabel: 'Recursos globais',   path: '/community'  },
};

const KpiCard = memo(({ variant, value, loading, navigate: nav, delay = 0 }) => {
  const { color, Icon, label, sublabel, path } = KPI_VARIANTS[variant] || {};
  return (
    <motion.div
      role="listitem"
      onClick={() => nav(path)}
      className="relative overflow-hidden cursor-pointer group
                 bg-white dark:bg-slate-900
                 border-2 border-slate-100 dark:border-slate-800
                 rounded-[24px] p-5 sm:p-6 shadow-sm transition-all"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5, borderColor: `${color}50`, boxShadow: `0 15px 35px ${color}15` }}
      whileTap={{ y: 0, scale: 0.98 }}
    >
      <div className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full opacity-60"
        style={{ background: color, filter: 'blur(1px)' }} />
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon size={18} style={{ color }} strokeWidth={2.5} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {label}
        </span>
      </div>
      {loading ? (
        <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
      ) : (
        <AnimatedNumber
          value={value}
          className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tighter"
        />
      )}
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 block">
        {sublabel}
      </span>
    </motion.div>
  );
});
KpiCard.displayName = 'KpiCard';

/* ═══════════════════════════════════════════
   CIRCULAR PROGRESS
═══════════════════════════════════════════ */
const CircularProgress = memo(({ current = 0, total = 50, size = 100, showStartMessage = false }) => {
  const strokeWidth  = 8;
  const radius       = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage   = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const offset       = circumference - (percentage / 100) * circumference;
  const ref          = useRef(null);
  const inView       = useInView(ref, { once: true });

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-slate-100 dark:text-slate-800" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#syntaxGradHome)"
          strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="syntaxGradHome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showStartMessage ? (
          <span className="text-[12px] font-black text-indigo-500 uppercase tracking-tighter">Start</span>
        ) : (
          <>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
              <AnimatedNumber value={current} duration={1.5} />
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">de {total}</span>
          </>
        )}
      </div>
    </div>
  );
});
CircularProgress.displayName = 'CircularProgress';

/* ═══════════════════════════════════════════
   SECTION CARD
═══════════════════════════════════════════ */
const SectionCard = memo(({ children, className = '', hover = true, onClick }) => {
  const { isDarkMode } = useTheme();
  return (
    <motion.div
      variants={fadeUp}
      className={`relative overflow-hidden transition-all duration-300 border-2
                  ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
        borderColor:     isDarkMode ? '#1e293b' : '#f1f5f9',
        borderRadius:    '32px',
        boxShadow:       isDarkMode
          ? '0 4px 20px rgba(0,0,0,0.4)'
          : '0 4px 15px rgba(0,0,0,0.03)',
      }}
      onClick={onClick}
      whileHover={hover && onClick ? {
        y: -3,
        borderColor: '#6366f150',
        boxShadow: isDarkMode
          ? '0 20px 40px rgba(0,0,0,0.4)'
          : '0 15px 30px rgba(0,0,0,0.05)',
      } : undefined}
    >
      {children}
    </motion.div>
  );
});
SectionCard.displayName = 'SectionCard';

/* ═══════════════════════════════════════════
   MAIN HOME COMPONENT
═══════════════════════════════════════════ */
const Home = () => {
  const { user }              = useAuth();
  const { isDarkMode }        = useTheme();
  const navigate              = useNavigate();
  const { loadData, refreshData } = useDashboardData();

  const [dashboardData, setDashboardData]               = useState(null);
  const [isLoading, setIsLoading]                       = useState(true);
  const [isEventModalOpen, setIsEventModalOpen]         = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState(new Date());
  const [confirmDeleteEvento, setConfirmDeleteEvento]   = useState({ isOpen: false, evento: null });
  const [isDeletingEvento, setIsDeletingEvento]         = useState(false);
  const [pendingReviews, setPendingReviews]             = useState(0);
  const [editingMeta, setEditingMeta]                   = useState(false);
  const [metaValue, setMetaValue]                       = useState(() => getStoredMetaMensal().value);
  const [hasSavedMeta, setHasSavedMeta]                 = useState(() => getStoredMetaMensal().hasSaved);
  const [isSavingMeta, setIsSavingMeta]                 = useState(false);

  const { isConnected: githubConnected, username: githubUsername } = useGitHub();

  const persistMetaMensal = useCallback((value) => {
    const userId = user?.uid;
    if (!userId) { toast.error('Usuário não autenticado'); return; }
    setIsSavingMeta(true);
    atualizarMetaMensal(userId, value)
      .then((result) => {
        const safe = result.metaSalva;
        try { localStorage.setItem('cinesia:meta:mensal', String(safe)); setHasSavedMeta(true); }
        catch { setHasSavedMeta(false); }
        setMetaValue(safe);
        toast.success('📈 Meta mensal salva com sucesso!');
        refreshData(userId).then(updatedData => setDashboardData(updatedData));
      })
      .catch(() => toast.error('❌ Não foi possível salvar a meta. Tente novamente.'))
      .finally(() => setIsSavingMeta(false));
  }, [user, refreshData]);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId) return;
    listarFlashcards(userId)
      .then(fcs => setPendingReviews(fcs.filter(fc => isDueForReview(fc)).length))
      .catch(() => setPendingReviews(0));
  }, [user?.uid]);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId) return;
    const handleResumoAlterado = async () => {
      try {
        const updatedData = await refreshData(userId);
        setDashboardData(updatedData);
      } catch { setDashboardData(prev => prev); }
    };
    window.addEventListener('cinesia:resumo:alterado', handleResumoAlterado);
    return () => window.removeEventListener('cinesia:resumo:alterado', handleResumoAlterado);
  }, [user, refreshData]);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    const loadDash = async () => {
      const userId = user?.uid;
      if (!userId) { setIsLoading(false); return; }
      try {
        const data = await loadData(userId);
        setDashboardData(data);
        if (data?.metaMensal?.meta) { setMetaValue(data.metaMensal.meta); setHasSavedMeta(true); }
      } catch { setDashboardData(null); }
      finally { setIsLoading(false); }
    };
    loadDash();
  }, [user]);

  const handleOpenEventModal = useCallback((date = new Date()) => {
    setSelectedDateForEvent(date);
    setIsEventModalOpen(true);
  }, []);

  const handleSaveEvent = async (newEvent) => {
    const userId = user?.uid;
    if (!userId) return;
    try {
      await salvarEvento(newEvent, userId);
      const updatedData = await refreshData(userId);
      setDashboardData(updatedData);
      setIsEventModalOpen(false);
      toast.success('Evento adicionado com sucesso!');
    } catch {
      toast.error('Não foi possível salvar o evento.');
    }
  };

  const handleDeleteEvento = useCallback((evento) => {
    setConfirmDeleteEvento({ isOpen: true, evento });
  }, []);

  const confirmarExclusaoEvento = async () => {
    if (!confirmDeleteEvento.evento?.id) return;
    setIsDeletingEvento(true);
    try {
      await deletarEvento(confirmDeleteEvento.evento.id);
      const userId      = user?.uid;
      const updatedData = await refreshData(userId);
      setDashboardData(updatedData);
      setConfirmDeleteEvento({ isOpen: false, evento: null });
      toast.success('Evento excluído com sucesso.');
    } catch {
      toast.error('Não foi possível excluir o evento.');
    } finally {
      setIsDeletingEvento(false);
    }
  };

  const greeting   = useMemo(() => getGreeting(), []);
  const techPhrase = useMemo(() => getMotivationalPhrase(), []);

  const progressPercent = useMemo(() => {
    if (!dashboardData?.totalMaterias) return 0;
    return Math.round((dashboardData.concluidas / dashboardData.totalMaterias) * 100);
  }, [dashboardData]);

  const proximosEventos = useMemo(() => {
    const eventos = dashboardData?.proximosEventos || [];
    const hoje    = new Date().setHours(0, 0, 0, 0);
    return eventos
      .map(e => ({ ...e, dataObj: parseSafeDate(e?.data) }))
      .filter(e => e.dataObj && e.dataObj >= hoje)
      .sort((a, b) => a.dataObj - b.dataObj)
      .slice(0, 4);
  }, [dashboardData]);

  const quickActions = [
    { Icon: FileText,   label: 'Novo Resumo', onClick: () => navigate('/resumos',         { state: { openNew: true } }), color: '#6366F1' },
    { Icon: CreditCard, label: 'Flashcards',  onClick: () => navigate('/flashcards'),                                    color: '#06B6D4' },
    { Icon: Target,     label: 'Simulados',   onClick: () => navigate('/simulados'),                                     color: '#10B981' },
    { Icon: Search,     label: 'Consulta',    onClick: () => navigate('/consulta-rapida'),                               color: '#F59E0B' },
    { Icon: Layers,     label: 'Arch_3D',     onClick: () => navigate('/atlas-3d'),                                      color: '#8B5CF6' },
  ];

  return (
    <motion.div
      className="min-h-screen pb-32 bg-slate-50/30 dark:bg-slate-950"
      initial="hidden" animate="show" variants={staggerContainer}
    >

      {/* ─── ① HERO HEADER ─── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden mx-4 sm:mx-6 mt-6 shadow-2xl
                   bg-white dark:bg-slate-900
                   border-2 border-slate-200 dark:border-white/5
                   rounded-[32px]"
        style={{
          paddingTop:    'clamp(32px, 5vw, 48px)',
          paddingLeft:   'clamp(24px, 5vw, 48px)',
          paddingRight:  'clamp(24px, 5vw, 48px)',
          paddingBottom: 'clamp(48px, 8vw, 80px)',
        }}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/5 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-8" style={{ zIndex: Z.base + 1 }}>
          <Avatar src={user?.photoURL} name={user?.displayName || user?.email} size={72} ring />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20
                               text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                Online
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                #USR-STX-{user?.uid?.slice(0, 6)}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">
              {greeting.text},{' '}
              <span className="text-cyan-600 dark:text-cyan-400">
                {user?.displayName?.split(' ')[0] || 'dev'}
              </span>
              <motion.span
                className="inline-flex ml-2"
                animate={{ rotate: [0, 15, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <greeting.Icon size={32} style={{ color: greeting.color }} />
              </motion.span>
            </h1>

            <p className="text-[15px] text-slate-600 dark:text-slate-400 font-medium italic opacity-80 max-w-2xl leading-relaxed">
              &ldquo;{techPhrase}&rdquo;
            </p>

            <div className="mt-5 inline-flex items-center gap-4
                            bg-slate-100/80 dark:bg-black/40
                            backdrop-blur-md p-2 pl-4 rounded-full
                            border border-slate-200 dark:border-white/10">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Sequência:
                </span>
                <span className="text-xl font-black text-orange-500 font-mono">
                  {isLoading ? '—' : <AnimatedNumber value={dashboardData?.offensiveStreak || 0} />}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Flame size={16} className="text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── ② FLOATING KPIs ─── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 -mt-12" style={{ zIndex: Z.raised }}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5" role="list">
          <KpiCard variant="materias"  value={dashboardData?.totalMaterias  || 0} loading={isLoading} navigate={navigate} delay={0.6} />
          <KpiCard variant="flashcard" value={dashboardData?.totalFlashcards || 0} loading={isLoading} navigate={navigate} delay={0.7} />
          <KpiCard variant="resumos"   value={dashboardData?.totalResumos   || 0} loading={isLoading} navigate={navigate} delay={0.8} />
          <KpiCard variant="feed"      value={0}                                   loading={isLoading} navigate={navigate} delay={0.9} />
          <KpiCard variant="ide"       value={dashboardData?.totalSnippets  || 0} loading={isLoading} navigate={navigate} delay={1.0} />
          <KpiCard variant="rooms"     value={dashboardData?.activeRooms    || 0} loading={isLoading} navigate={navigate} delay={1.1} />
          <KpiCard variant="community" value={dashboardData?.communityCount || 0} loading={isLoading} navigate={navigate} delay={1.2} />
        </div>
      </div>

      {/* ─── ③ MAIN GRID ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <motion.div variants={staggerContainer} className="flex flex-col gap-10">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Revisão SM-2 ── */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <SkeletonPulse className="h-40 w-full rounded-[32px]" />
              ) : pendingReviews > 0 ? (
                <SectionCard className="h-full group" hover={false}
                  onClick={() => navigate('/flashcards', { state: { reviewMode: true } })}>
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Zap size={140} className="text-orange-500" />
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 shrink-0">
                      <Cpu size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Revisão pendente
                      </h3>
                      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Você tem{' '}
                        <span className="font-black text-orange-500">{pendingReviews} flashcards</span>{' '}
                        prontos para revisão.
                      </p>
                    </div>
                    <Button className="shrink-0 bg-orange-500 hover:bg-orange-600 font-black uppercase tracking-widest text-[11px] h-12 px-6 sm:px-10 !rounded-[14px]">
                      Iniciar revisão
                    </Button>
                  </div>
                </SectionCard>
              ) : (
                <div className="h-full flex items-center gap-6 p-8 rounded-[32px] border-2 border-dashed border-emerald-500/30 bg-emerald-500/[0.03]">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase">Tudo em dia</h3>
                    <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">
                      Seu repositório de estudos está totalmente sincronizado.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Event Logs (Agenda) ── */}
            <SectionCard className="p-6 sm:p-8 h-full flex flex-col" hover={false}>
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" /> Event_Logs
                </h2>
                <button
                  onClick={() => handleOpenEventModal()}
                  className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 space-y-3">
                {proximosEventos.length > 0 ? proximosEventos.map((e, i) => (
                  <div key={e.id || i}
                    className="flex items-center gap-4 p-4 rounded-2xl
                               bg-slate-50 dark:bg-slate-950/50
                               border border-slate-100 dark:border-slate-800
                               group hover:border-indigo-500/30 transition-all">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl
                                    bg-white dark:bg-slate-900
                                    border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                      <span className="text-[15px] font-black text-indigo-500 leading-none">
                        {e.dataObj.getDate()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">
                        {e.dataObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-black text-slate-800 dark:text-white truncate uppercase italic tracking-tight">
                        {e.titulo || e.title}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 opacity-70">
                        {e.tipo || 'Task'}
                      </p>
                    </div>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleDeleteEvento(e); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-30">
                    <Terminal size={32} className="mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                      Waiting_for_Events...
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="font-black uppercase tracking-widest text-[9px] text-slate-400 dark:text-slate-500">
                  Sincronizado: {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </SectionCard>
          </div>

          {/* ── ④ QUICK ACTIONS ── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <h2 className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">
                System_Shortcuts
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickActions.map((action) => (
                <motion.button
                  key={action.label}
                  onClick={action.onClick}
                  className="group relative flex flex-col items-center justify-center gap-4 p-6 sm:p-8
                             rounded-[28px]
                             bg-white dark:bg-slate-900
                             border-2 border-slate-100 dark:border-slate-800
                             hover:border-indigo-500/30 transition-all shadow-sm"
                  whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                                  bg-slate-50 dark:bg-slate-950
                                  border border-slate-100 dark:border-slate-800
                                  group-hover:scale-110 group-hover:rotate-3 transition-all shadow-inner">
                    <action.Icon size={24} style={{ color: action.color }} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── ⑤ STATS & SYSTEM HEALTH ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <SectionCard className="flex flex-col" hover={false}>
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" /> Recent_Stacks
                </h2>
                <button
                  onClick={() => navigate('/materias')}
                  className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View_All
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                <div>
                  <div className="flex justify-between mb-3 items-baseline">
                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Global_Index
                    </span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {isLoading ? '—' : <AnimatedNumber value={progressPercent} />}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {dashboardData?.materiasRecentes?.slice(0, 4).map((m, idx) => (
                    <div key={m.id || idx}
                      className="flex items-center gap-4 p-3 rounded-2xl
                                 hover:bg-slate-50 dark:hover:bg-slate-950
                                 transition-all cursor-pointer group"
                      onClick={() => navigate('/materias')}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[13px] border shadow-sm group-hover:scale-110 transition-transform shrink-0"
                        style={{ backgroundColor: `${m.cor}15`, color: m.cor, borderColor: `${m.cor}30` }}
                      >
                        {m.nome.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-black text-slate-800 dark:text-white truncate tracking-tight">
                          {m.nome}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                          {m.totalFlashcards} Logics · {m.totalResumos} Docs
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}

                  {(!dashboardData?.materiasRecentes || dashboardData.materiasRecentes.length === 0) && !isLoading && (
                    <div className="py-8 text-center">
                      <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                        Nenhuma matéria ainda
                      </p>
                      <button
                        onClick={() => navigate('/materias')}
                        className="mt-3 text-[11px] font-black text-indigo-500 hover:underline uppercase tracking-widest"
                      >
                        Criar primeira matéria →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard className="lg:col-span-2 p-6 sm:p-8" hover={false}>
              <div className="flex items-center justify-between mb-8 sm:mb-10">
                <h2 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Zap size={14} className="text-cyan-500" /> Monthly_Production
                </h2>
                <span className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {dashboardData?.metaMensal?.mesNome || 'Cycle'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Cards_Target
                    </span>
                    <span className="text-sm font-black text-indigo-500">
                      {dashboardData?.metaMensal?.flashcardsDoMes || 0} / {dashboardData?.metaMensal?.meta || 300}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((dashboardData?.metaMensal?.flashcardsDoMes || 0) / (dashboardData?.metaMensal?.meta || 300)) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Docs_Target
                    </span>
                    <span className="text-sm font-black text-cyan-500">
                      {dashboardData?.metaMensal?.resumosDoMes || 0} / 15
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((dashboardData?.metaMensal?.resumosDoMes || 0) / 15) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-10 p-5 rounded-[22px] bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex gap-4">
                <div className="mt-1 shrink-0"><Lightbulb size={20} className="text-orange-500" /></div>
                <p className="text-[14px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                  {(dashboardData?.offensiveStreak || 0) > 0 ? (
                    <>Sequência ativa: <span className="font-black text-orange-500">🔥 {dashboardData.offensiveStreak} dias</span>! Sincronize seus módulos hoje para manter o uptime.</>
                  ) : (
                    <>Estude ao menos <strong className="text-slate-900 dark:text-white">15 minutos</strong> para inicializar sua sequência de produtividade.</>
                  )}
                </p>
              </div>

              <div style={{ width: '100%', minHeight: 0 }} className="mt-10 sm:mt-12 h-[220px] sm:h-[240px]">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dashboardData?.activityHistory || []}>
                    <CartesianGrid
                      strokeDasharray="3 3" vertical={false}
                      stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                    />
                    <XAxis
                      dataKey="name" axisLine={false} tickLine={false} dy={10}
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 800 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        border:          'none',
                        borderRadius:    '16px',
                        boxShadow:       '0 10px 30px rgba(0,0,0,0.2)',
                        fontSize:        '11px',
                        fontWeight:      'bold',
                        color:           isDarkMode ? '#f1f5f9' : '#1e293b',
                      }}
                    />
                    <Bar dataKey="cards"   fill="#6366f1" radius={[4,4,0,0]} barSize={24} />
                    <Bar dataKey="resumos" fill="#06b6d4" radius={[4,4,0,0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* ── ⑥ EXTRA FEATURES WIDGETS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <SectionCard onClick={() => navigate('/study-rooms')} className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner shrink-0">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Study Rooms</p>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">Active_Hub</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    {isLoading ? '—' : `${dashboardData?.activeRooms ?? 0} salas ativas`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 shrink-0" />
              </div>
            </SectionCard>

            <SectionCard onClick={() => navigate('/community')} className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-inner shrink-0">
                  <Globe size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Library</p>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">Community</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    {isLoading ? '—' : `${dashboardData?.communityCount ?? 0} recursos públicos`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 shrink-0" />
              </div>
            </SectionCard>

            <SectionCard onClick={() => navigate('/github')} className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-inner shrink-0">
                  <Github size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">GitHub</p>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">Integration</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    {githubConnected ? `@${githubUsername}` : 'Não conectado'}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 shrink-0" />
              </div>
            </SectionCard>

            {/* ✅ CORRIGIDO: </SectionCard> no lugar de </div> */}
            <SectionCard onClick={() => navigate('/peer-review')} className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner shrink-0">
                  <MessageSquare size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Code Review</p>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">Peer_Network</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    {isLoading ? '—' : `${dashboardData?.pendingReviews ?? 0} reviews pendentes`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 dark:text-slate-700 shrink-0" />
              </div>
            </SectionCard>

          </div>
        </motion.div>
      </div>

      {/* ─── MODALS ─── */}
      <AddEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDateForEvent}
      />

      <ConfirmModal
        isOpen={confirmDeleteEvento.isOpen}
        onClose={() => setConfirmDeleteEvento({ isOpen: false, evento: null })}
        onConfirm={confirmarExclusaoEvento}
        title="Delete_Event_Log?"
        message={
          <>Deseja remover permanentemente o log{' '}
            <span className="font-black text-slate-900 dark:text-white">
              &ldquo;{confirmDeleteEvento.evento?.titulo}&rdquo;
            </span>? Esta operação modificará o histórico do servidor.
          </>
        }
        confirmText="Execute_Delete"
        type="danger"
        isLoading={isDeletingEvento}
      />

      <AnimatePresence>
        {editingMeta && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ zIndex: Z.modal }}
            className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => setEditingMeta(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 100 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 100 }}
              className="bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] p-8 sm:p-10 w-full sm:max-w-sm border-2 border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">
                Ajustar Meta
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    Meta Mensal (Itens)
                  </label>
                  <input
                    type="number"
                    value={metaValue}
                    onChange={e => setMetaValue(Number(e.target.value))}
                    className="w-full h-16 bg-slate-100 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-2xl font-black font-mono text-center text-indigo-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <Button
                  onClick={() => { persistMetaMensal(metaValue); setEditingMeta(false); }}
                  loading={isSavingMeta}
                  fullWidth
                  className="bg-indigo-600 h-14 font-black uppercase tracking-widest text-[13px] !rounded-[16px] shadow-xl shadow-indigo-600/20"
                >
                  Salvar Meta
                </Button>
                <button
                  onClick={() => setEditingMeta(false)}
                  className="w-full py-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </motion.div>
  );
};

export default Home;