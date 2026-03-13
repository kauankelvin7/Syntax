/**
 * 🔐 LOGIN MINIMAL — Syntax Theme
 * Portal de Autenticação e Sincronização de Nodes.
 * - Design: High-Fidelity Terminal Interface.
 * - Segurança: Carregamento de credenciais via Firebase.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { Mail, Lock, UserRound, Eye, EyeOff, ArrowRight, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

const LoginMinimal = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🛡️ Limites de caracteres por campo
  const LIMITS = { nome: 50, email: 100, password: 64 };

  // Regex de whitelist por campo — bloqueia caracteres inválidos na digitação
  const ALLOWED = {
    nome: /^[a-zA-ZÀ-ÿ\s'-]*$/,
    email: /^[a-zA-Z0-9@._+\-]*$/,
    password: /^[\x20-\x7E]*$/, // printable ASCII — sem null bytes ou unicode exótico
  };

  // Regex de formato final — validados no submit
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9\W]).{6,64}$/; // mínimo 1 letra + 1 número ou símbolo

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (value.length > LIMITS[name]) return;
    if (ALLOWED[name] && !ALLOWED[name].test(value)) return;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin && formData.nome.trim().length < 3) {
      setError('Nome muito curto. Use ao menos 3 caracteres.');
      setLoading(false);
      return;
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      setError('Email inválido. Verifique o formato.');
      setLoading(false);
      return;
    }

    if (!PASSWORD_REGEX.test(formData.password)) {
      setError('Senha fraca. Use letras, números e ao menos um símbolo.');
      setLoading(false);
      return;
    }

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(formData.nome, formData.email, formData.password);
    }

    if (!result.success) {
      const errorMap = {
        'auth/user-not-found': 'Email não encontrado. Verifique ou crie uma conta.',
        'auth/wrong-password': 'Senha incorreta. Tente novamente ou redefina sua senha.',
        'auth/email-already-in-use': 'Email já cadastrado. Tente entrar ou recupere sua senha.',
        'auth/invalid-email': 'Email inválido. Verifique o formato e tente novamente.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'auth/network-request-failed': 'Sem conexão. Verifique sua internet e tente novamente.',
      };
      setError(errorMap[result.code] || result.error || 'Erro de conexão. Tente novamente.');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle();
    if (!result.success) setError('Não foi possível entrar com o Google. Tente novamente.');
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ nome: '', email: '', password: '' });
    setError('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors selection:bg-indigo-500 selection:text-white">

      {/* ─── PAINEL ESQUERDO (The Architecture) ─── */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative items-center justify-center p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)' }}
      >
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="relative z-10 max-w-lg text-center">
          <motion.div
            className="mx-auto mb-12 w-28 h-28 rounded-[32px] bg-white/5 backdrop-blur-2xl flex items-center justify-center border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Logo size="large" iconOnly />
          </motion.div>

          <motion.h2
            className="text-4xl xl:text-5xl font-black text-white mb-8 tracking-tighter leading-tight uppercase italic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Do Hello World <br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              à arquitetura distribuída
            </span>
            .
          </motion.h2>

          <motion.p
            className="text-slate-400 text-lg leading-relaxed mb-12 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            &ldquo;A melhor forma de prever o futuro do seu código é estudando os fundamentos hoje.&rdquo;
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {['Code Review', 'Algoritmos', 'System Design', 'Ada AI'].map((f) => (
              <span
                key={f}
                className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-cyan-400/80 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
              >
                {f}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── PAINEL DIREITO (The Terminal) ─── */}
      <div className="flex-1 flex items-center justify-center py-12 px-6 sm:px-12 bg-slate-50/30 dark:bg-slate-950">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8 lg:hidden">
              <div className="w-20 h-20 rounded-[24px] bg-slate-900 flex items-center justify-center shadow-2xl border border-white/10">
                <Logo size="medium" iconOnly />
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Terminal size={18} className="text-indigo-500" />
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                {isLogin ? 'Entrar' : 'Criar conta'}
              </h1>
            </div>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
              {isLogin
                ? 'Entre com sua conta para continuar.'
                : 'Crie sua conta e comece a estudar com IA.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                className="bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl px-5 py-4 text-rose-500 text-sm mb-8 flex items-start gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <span className="font-bold uppercase tracking-tight leading-snug">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-4 hover:border-cyan-500/50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-4 my-10">
            <div className="flex-1 h-0.5 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
              ou entre com email
            </span>
            <div className="flex-1 h-0.5 bg-slate-100 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <Input
                label="Seu nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Digite o seu nome"
                leftIcon={UserRound}
                required
                className="!h-14 !rounded-2xl"
              />
            )}
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              leftIcon={Mail}
              required
              className="!h-14 !rounded-2xl"
            />
            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                leftIcon={Lock}
                required
                className="!h-14 !rounded-2xl pr-14"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-slate-400 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="h-16 !rounded-[20px] bg-indigo-600 border-none font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30"
            >
              {isLogin ? 'Entrar' : 'Criar conta'}
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </form>

          <div className="mt-10 text-center p-6 rounded-[24px] bg-slate-100/50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800">
            <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400">
              {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
              <button
                onClick={toggleMode}
                className="ml-2 text-indigo-600 dark:text-cyan-400 font-black uppercase tracking-widest hover:underline transition-colors"
              >
                {isLogin ? 'Criar conta' : 'Já tenho conta'}
              </button>
            </p>
          </div>

          <p className="mt-12 text-center text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.4em]">
            © 2026 Syntax · High Fidelity Engineering
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const AlertTriangle = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default LoginMinimal;