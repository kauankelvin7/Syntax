/**
 * 👤 PROFILE MODAL - Configurações de Desenvolvedor (Syntax Theme)
 * * Modal premium com seções organizadas e Glassmorphism.
 * * Integrado com Firebase Auth + Cloudinary.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { uploadImage } from '../services/cloudinaryService';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Z } from '../constants/zIndex';
import Button from './ui/Button';
import { Input } from './ui/Input';
import FontSizeControl from './FontSizeControl';
import { hapticSuccess, hapticError } from '../utils/haptics';
import { 
  X, 
  User, 
  Mail, 
  Check, 
  Loader2,
  Camera,
  Type,
  Eye,
  Shield,
  Calendar,
  Sun,
  Moon,
  Monitor,
  Palette,
  Settings2,
  Sparkles,
  ImagePlus,
  Trash2,
  TerminalSquare
} from 'lucide-react';

/* ─── Section wrapper Refinado (Tech Style) ─── */
const Section = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center gap-2.5 px-1">
      <div className="w-8 h-8 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
        <Icon size={14} className="text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
      </div>
      <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">{title}</h3>
    </div>
    <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-[20px] p-4 border border-slate-200/50 dark:border-slate-800/80 shadow-sm">
      {children}
    </div>
  </div>
);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const { mode, setMode, isDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  const [displayName, setDisplayName] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoPreview(user.photoURL || null);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) { setSuccess(false); setError(null); setPhotoFile(null); setDragOver(false); }
  }, [isOpen]);

  const handlePhotoSelect = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoSelect(file);
    e.target.value = '';
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoSelect(file);
  }, [handlePhotoSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSave = async () => {
    if (!displayName.trim()) { setError('Digite seu nome de dev para continuar.'); return; }
    setLoading(true);
    setError(null);

    try {
      let photoURL = user?.photoURL || null;

      if (photoFile) {
        setUploadingPhoto(true);
        try {
          photoURL = await uploadImage(photoFile);
        } catch (uploadErr) {
          toast.error('Erro ao enviar foto. Salvando dados básicos.');
        } finally {
          setUploadingPhoto(false);
        }
      } else if (!photoPreview && user?.photoURL) {
        photoURL = '';
      }

      await updateProfile(auth.currentUser, { 
        displayName: displayName.trim(),
        photoURL: photoURL || '',
      });

      if (setUser) {
        const updatedUser = { 
          ...user, 
          nome: displayName.trim(), 
          displayName: displayName.trim(),
          photoURL: photoURL || '',
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      hapticSuccess();
      setSuccess(true);
      toast.success('Configurações compiladas! ✨');
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      hapticError();
      setError('Não foi possível salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (displayName) return displayName[0]?.toUpperCase();
    return 'U';
  };

  const themeOptions = [
    { key: 'light',  icon: Sun,     label: 'Claro' },
    { key: 'dark',   icon: Moon,    label: 'Escuro' },
    { key: 'system', icon: Monitor, label: 'Auto' },
  ];

  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
          style={{ zIndex: Z.modal }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop Glass Premium */}
          <motion.div 
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md" 
            onClick={onClose} 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800/60"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── Header: Photo Section Premium (Tech Style) ─── */}
            <div
              className={`relative h-44 flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${
                dragOver ? 'bg-indigo-600' : 'bg-slate-900 dark:bg-slate-800/80'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* Background Orbs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-30%] left-[-10%] w-48 h-48 bg-indigo-600 rounded-full blur-3xl" />
                <div className="absolute bottom-[-30%] right-[-10%] w-48 h-48 bg-cyan-500 rounded-full blur-3xl" />
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-20 active:scale-95"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              <div className="relative z-10 group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-24 h-24 rounded-[32px] border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center transition-all ${
                    dragOver ? 'ring-8 ring-cyan-500/30' : 'group-hover:ring-4 ring-indigo-500/30'
                  }`}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-white">{getInitials()}</span>
                  )}
                  
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <Camera className="text-white" size={24} />
                  </div>

                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="text-white animate-spin" size={24} />
                    </div>
                  )}
                </motion.button>

                {/* Edit Badge Tech */}
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-cyan-500 rounded-xl border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg text-white pointer-events-none">
                  {success ? <Check size={16} strokeWidth={3} /> : <Camera size={16} strokeWidth={2.5} />}
                </div>

                {/* Remove Button */}
                {photoPreview && !success && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 hover:bg-rose-600 rounded-xl border-[3px] border-white dark:border-slate-900 flex items-center justify-center shadow-lg text-white transition-transform hover:scale-110 active:scale-95"
                  >
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* ─── Scrollable Body ─── */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar">
              
              {/* Seção: Identidade */}
              <Section icon={TerminalSquare} title="Developer ID">
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                      Nickname ou Nome
                    </label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex: Linus Torvalds"
                      leftIcon={User}
                      disabled={loading || success}
                      className="h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold text-[15px] focus:ring-cyan-500/20 focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-100/50 dark:bg-slate-950/50 rounded-[14px] border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                    <Mail size={16} className="text-slate-400 dark:text-slate-500" strokeWidth={2.5} />
                    <span className="text-[14px] font-bold text-slate-500 dark:text-slate-400 truncate">{user?.email || 'Sem email vinculado'}</span>
                  </div>
                </div>
              </Section>

              {/* Seção: Interface */}
              <Section icon={Palette} title="Ambiente / IDE">
                <div className="space-y-6">
                  <div className="relative flex p-1.5 bg-slate-200/50 dark:bg-slate-950/80 rounded-[16px] border border-slate-200/50 dark:border-slate-800 shadow-inner">
                    {themeOptions.map(({ key, icon: ThIcon, label }) => {
                      const active = mode === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setMode(key)}
                          className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 z-10 ${
                            active ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {active && (
                            <motion.div 
                              layoutId="profileTheme"
                              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-200/50 dark:border-slate-700"
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                          <ThIcon size={16} className="relative z-20" strokeWidth={2.5} />
                          <span className="relative z-20">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800">
                    <FontSizeControl variant="compact" />
                  </div>
                </div>
              </Section>

              {/* Seção: Segurança e Datas */}
              {createdAt && (
                <Section icon={Shield} title="Credenciais">
                  <div className="flex items-center gap-4 text-slate-500">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                      <Calendar size={18} className="text-slate-400 dark:text-slate-500" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Conta Criada Em</p>
                      <p className="text-[13px] font-black text-slate-700 dark:text-slate-300 tracking-tight">{createdAt}</p>
                    </div>
                  </div>
                </Section>
              )}

              {/* Feedback Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-rose-600 dark:text-rose-400 text-[13px] font-bold flex items-center gap-2 shadow-sm"
                  >
                    <AlertTriangle size={16} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── Footer Premium ─── */}
            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex gap-3 shrink-0">
              <Button variant="secondary" fullWidth onClick={onClose} disabled={loading} className="h-14 rounded-2xl font-bold text-[14px]">
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleSave}
                loading={loading}
                disabled={success}
                className={`h-14 rounded-2xl font-bold text-[14px] border-none shadow-lg transition-all ${
                  success 
                    ? 'bg-emerald-500 shadow-emerald-500/20' 
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 shadow-indigo-500/20'
                }`}
                leftIcon={success ? <Check size={18} strokeWidth={3} /> : null}
              >
                {success ? 'Concluído!' : 'Salvar Alterações'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AlertTriangle = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default ProfileModal;