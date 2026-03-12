/**
 * 👤 NODE_IDENTITY (Meu Perfil) — Syntax Theme Premium
 * * Central de gerenciamento de credenciais e ativos visuais do Node.
 * - Features: Upload tático (Firebase Storage), Identidade Visual, Telemetria de Registro.
 * - Design: High-Fidelity Infrastructure Style (Bordas 24px, Glassmorphism).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera,
  Upload,
  Trash2,
  Save,
  UserCircle2,
  Image as ImageIcon,
  Loader2,
  X,
  CheckCircle2,
  Calendar,
  Mail,
  Shield,
  Terminal,
  Cpu,
  Activity
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MeuPerfil() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [memberSince, setMemberSince] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || user.nome || '');
    setPhotoURL(user.photoURL || null);

    const creationTime = auth.currentUser?.metadata?.creationTime;
    if (creationTime) setMemberSince(new Date(creationTime));
  }, [user]);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Handshake_Error: Formato inválido. Use JPG, PNG ou WebP.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Payload_Overflow: Limite de 2MB excedido.');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !validateFile(file)) return;
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  }, []);

  const handleUploadPhoto = async () => {
    if (!selectedFile || !user?.uid) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}/avatar.${selectedFile.type.split('/')[1]}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      await setDoc(doc(db, 'users', user.uid), { photoURL: downloadURL }, { merge: true });

      setPhotoURL(downloadURL);
      setPreviewURL(null);
      setSelectedFile(null);

      if (setUser) {
        const updated = { ...user, photoURL: downloadURL };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }

      toast.success('Identity_Updated: Foto de perfil sincronizada.');
    } catch (err) {
      toast.error('Sync_Fault: Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.uid) return;
    setRemovingPhoto(true);
    try {
      for (const ext of ['jpeg', 'png', 'webp', 'jpg']) {
        try {
          const storageRef = ref(storage, `profile-pictures/${user.uid}/avatar.${ext}`);
          await deleteObject(storageRef);
        } catch (e) { /* skip */ }
      }
      await updateProfile(auth.currentUser, { photoURL: '' });
      await setDoc(doc(db, 'users', user.uid), { photoURL: null }, { merge: true });

      setPhotoURL(null);
      if (setUser) {
        const updated = { ...user, photoURL: null };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
      toast.success('Identity_Cleared: Foto de perfil removida.');
    } catch (err) {
      toast.error('De-sync_Error: Erro ao remover foto.');
    } finally {
      setRemovingPhoto(false);
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await setDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() }, { merge: true });

      if (setUser) {
        const updated = { ...user, displayName: displayName.trim(), nome: displayName.trim() };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
      toast.success('Handshake_Success: Nome atualizado.');
    } catch (err) {
      toast.error('Protocol_Error: Falha na atualização.');
    } finally {
      setSavingName(false);
    }
  };

  const initials = (user?.displayName || user?.nome || user?.email || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        
        {/* ─── HEADER ─── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-[22px] flex items-center justify-center shadow-2xl border-2 border-white/10 shrink-0">
              <Cpu size={32} className="text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-1">Node_Identity</h1>
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity size={14} className="text-indigo-500" /> Managing credential assets
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── PHOTO SECTION ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-8"
        >
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-4">
              <Terminal size={18} className="text-indigo-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Visual_Asset_Upload</span>
            </div>
          </div>

          <div className="p-8 flex flex-col md:flex-row items-center gap-10">
            {/* Avatar Stack */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                {previewURL || photoURL ? (
                  <img src={previewURL || photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-indigo-500 font-mono tracking-tighter">{initials}</span>
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-[32px] bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                <Camera size={32} className="text-white" />
              </button>
            </div>

            <div className="flex-1 w-full space-y-6">
              {/* Dropzone Tática */}
              <div
                className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer ${
                  dragActive ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-950/50'
                }`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileSelect} className="hidden" />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px] uppercase font-mono">{selectedFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewURL(null); }} className="p-1 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={24} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Arraste ou <span className="text-indigo-500 underline">clique para importar</span></p>
                  </div>
                )}
              </div>

              {/* Botões de Ação Syntax */}
              <div className="flex flex-wrap gap-4 pt-2">
                {selectedFile && (
                  <Button onClick={handleUploadPhoto} loading={uploading} className="bg-indigo-600 h-12 px-8 font-black uppercase tracking-widest text-[11px] !rounded-[14px] shadow-lg shadow-indigo-600/20">
                    Sincronizar Foto
                  </Button>
                )}
                {photoURL && !selectedFile && (
                  <Button onClick={handleRemovePhoto} loading={removingPhoto} variant="ghost" className="text-rose-500 hover:bg-rose-500/10 h-12 px-6 font-black uppercase tracking-widest text-[11px] !rounded-[14px]">
                    <Trash2 size={16} className="mr-2" /> Remover Asset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── INFO SECTION ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-4">
            <Shield size={18} className="text-indigo-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Security_&_Profile_Data</span>
          </div>

          <div className="p-8 space-y-8">
            {/* Display Name Input */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity_Alias</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Node Name..." disabled={savingName} className="flex-1 !h-14 !rounded-[16px] bg-slate-50 dark:bg-slate-950 border-2 font-bold" />
                <Button onClick={handleSaveName} loading={savingName} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-14 px-10 font-black uppercase tracking-widest text-[11px] !rounded-[16px]">
                  Update_Alias
                </Button>
              </div>
            </div>

            {/* Read-only Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[22px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800"><Mail size={18} className="text-indigo-500" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network_Address</p>
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{user?.email}</p>
                </div>
              </div>

              <div className="p-5 rounded-[22px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800"><Shield size={18} className="text-cyan-500" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auth_Protocol</p>
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 capitalize">
                    {auth.currentUser?.providerData?.[0]?.providerId === 'google.com' ? 'Google SSO' : 'Hash Password'}
                  </p>
                </div>
              </div>
            </div>

            {/* Member Since Telemetry */}
            {memberSince && (
              <div className="p-6 rounded-[24px] bg-indigo-600/[0.03] border border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center"><Calendar size={18} className="text-indigo-500" /></div>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deployment_Date</p>
                     <p className="text-[14px] font-bold text-slate-900 dark:text-white">
                       {memberSince.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                     </p>
                   </div>
                </div>
                <div className="hidden sm:block text-right">
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Handshake_Verified</p>
                   <p className="text-[11px] font-mono text-slate-400">#SYN-ACK-{user?.uid?.slice(0, 8)}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
      `}</style>
    </div>
  );
}