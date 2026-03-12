/**
 * 🔔 SYSTEM_EVENT_LOG (Notificações) — Syntax Theme Premium
 * * Central de telemetria e avisos do ecossistema Syntax.
 * - Features: Real-time sync, Batch processing, Type-coded alerts.
 * - Design: Terminal Log Style (Bordas de 20px, indicadores neon).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  BookOpen,
  Loader2,
  Trash2,
  Trophy,
  Inbox,
  Terminal,
  Activity,
  Zap,
  Cpu
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { useAuth } from '../contexts/AuthContext-firebase';
import Button from '../components/ui/Button';

const TYPE_CONFIG = {
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    accent: 'bg-blue-500'
  },
  alerta: {
    icon: AlertTriangle,
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    border: 'border-rose-500/20',
    accent: 'bg-rose-500'
  },
  estudo: {
    icon: BookOpen,
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'border-indigo-500/20',
    accent: 'bg-indigo-500'
  },
  conquista: {
    icon: Trophy,
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    accent: 'bg-amber-500'
  },
};

function NotificationItem({ notification, userId, onMarkRead }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
  const Icon = config.icon;
  const isRead = notification.read;

  const handleClick = async () => {
    if (!isRead) {
      try {
        const notifRef = doc(db, 'users', userId, 'notifications', notification.id);
        await updateDoc(notifRef, { read: true });
        onMarkRead?.();
      } catch (err) {
        console.error('Telemetria_Error:', err);
      }
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const notifRef = doc(db, 'users', userId, 'notifications', notification.id);
      await deleteDoc(notifRef);
      toast.success('Log_Purged: Entrada removida.');
    } catch (err) {
      toast.error('Erro ao purgar log.');
    }
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={handleClick}
      className={`group relative flex items-start gap-5 p-5 rounded-[22px] border-2 transition-all cursor-pointer ${
        isRead
          ? 'opacity-50 bg-slate-50 dark:bg-slate-900/40 border-transparent grayscale'
          : `bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-lg hover:border-indigo-500/30`
      }`}
    >
      {/* Dynamic Status Indicator */}
      {!isRead && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full ${config.accent} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
      )}

      {/* Icon Node */}
      <div className={`w-12 h-12 rounded-[14px] ${config.bg} flex items-center justify-center shrink-0 border border-white/5`}>
        <Icon size={22} className={config.text} strokeWidth={2.5} />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[15px] font-black tracking-tight uppercase ${isRead ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
          {notification.title}
        </h4>
        <p className={`text-[13px] mt-1 font-medium leading-relaxed ${isRead ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {notification.message}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[10px] font-black font-mono text-indigo-500/60 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded">
            {timeAgo(notification.createdAt)}
          </span>
          {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />}
        </div>
      </div>

      {/* Purge Action */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all absolute right-4 top-1/2 -translate-y-1/2 border border-transparent hover:border-rose-500/20 shadow-xl"
        title="Purgar Log"
      >
        <Trash2 size={18} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

export default function Notificacoes() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user?.uid) return;

    const notifRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifs);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [user?.uid]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.uid || unreadCount === 0) return;
    setMarkingAll(true);

    try {
      const notifRef = collection(db, 'users', user.uid, 'notifications');
      const snapshot = await getDocs(notifRef);
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnapshot => {
        if (!docSnapshot.data().read) {
          batch.update(docSnapshot.ref, { read: true });
        }
      });

      await batch.commit();
      toast.success('Logs_Synced: Todas as entradas lidas.');
    } catch (err) {
      toast.error('Erro na sincronização de logs.');
    } finally {
      setMarkingAll(false);
    }
  }, [user?.uid, unreadCount]);

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto">
        
        {/* Header (Terminal Style) */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[22px] bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl border-2 border-white/10 shrink-0">
                <Bell size={32} className="text-white dark:text-slate-900" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none mb-1">Event_Logs</h1>
                <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" /> 
                  {unreadCount > 0 ? `${unreadCount} pending_alerts` : 'System status: optimal'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="secondary"
                onClick={markAllAsRead}
                loading={markingAll}
                className="h-12 px-6 !rounded-[14px] bg-white dark:bg-slate-900 border-2 font-black uppercase tracking-widest text-[10px]"
              >
                <CheckCheck size={16} className="mr-2" /> Sync_All
              </Button>
            )}
          </div>
        </motion.div>

        {/* Content Viewport */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 animate-pulse">
              <Loader2 size={40} className="text-indigo-500 animate-spin mb-6" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Accessing_Data_Stream...</p>
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-24 h-24 rounded-[28px] bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-800">
                <Inbox size={48} className="text-slate-200 dark:text-slate-800" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Logs_Empty</h3>
              <p className="text-[13px] text-slate-400 mt-2 font-medium uppercase tracking-widest">
                No system events detected.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notif => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  userId={user.uid}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}