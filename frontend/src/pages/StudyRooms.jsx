import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Users, MessageSquare, Search, 
  ChevronRight, Lock, Loader, Zap, 
  Clock, Globe, Filter, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useRoom } from '../hooks/useRoom';
import { 
  subscribeToActiveRooms, 
  createRoom, 
  updateParticipant 
} from '../services/roomService';
import RoomCard from '../components/rooms/RoomCard';
import RoomSession from '../components/rooms/RoomSession';
import { Z } from '../constants/zIndex';

const StudyRooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const { room: activeRoom, messages } = useRoom(activeRoomId);

  // Carregar salas ativas
  useEffect(() => {
    const unsubscribe = subscribeToActiveRooms((loadedRooms) => {
      setRooms(loadedRooms);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleJoinRoom = useCallback(async (room) => {
    if (!user) {
      toast.error('Você precisa estar logado para entrar em uma sala.');
      return;
    }

    if (room.isPrivate) {
      const pass = window.prompt('Esta sala é privada. Digite a senha:');
      if (pass !== room.password) {
        toast.error('Senha incorreta.');
        return;
      }
    }

    try {
      await updateParticipant(room.id, user.uid, {
        uid: user.uid,
        name: user.displayName || 'Dev Anonymous',
        avatar: user.photoURL || '',
        joinedAt: new Date(),
        status: 'online'
      });
      setActiveRoomId(room.id);
      toast.success(`Entrou na sala: ${room.name}`);
    } catch (error) {
      toast.error('Erro ao entrar na sala.');
    }
  }, [user]);

  const handleLeaveRoom = useCallback(async () => {
    if (!activeRoomId || !user) return;
    try {
      await updateParticipant(activeRoomId, user.uid, null);
      setActiveRoomId(null);
      toast.info('Você saiu da sala.');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  }, [activeRoomId, user]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roomData = {
      name: formData.get('name'),
      topic: formData.get('topic'),
      maxParticipants: parseInt(formData.get('maxParticipants')),
      isPrivate: formData.get('isPrivate') === 'on',
      password: formData.get('password') || '',
      ownerId: user.uid,
      ownerName: user.displayName,
      participants: {
        [user.uid]: {
          uid: user.uid,
          name: user.displayName,
          avatar: user.photoURL,
          joinedAt: new Date(),
          status: 'online'
        }
      }
    };

    try {
      const id = await createRoom(roomData);
      setActiveRoomId(id);
      setIsCreateModalOpen(false);
      toast.success('Sala criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar sala.');
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.topic.toLowerCase().includes(search.toLowerCase())
  );

  if (activeRoomId && activeRoom) {
    return (
      <RoomSession 
        room={activeRoom} 
        messages={messages} 
        user={user} 
        onLeave={handleLeaveRoom} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Study Rooms</h1>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Sync: {rooms.length} Salas Ativas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Buscar por tópico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Criar Sala</span>
          </button>
        </div>
      </header>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
            <Zap size={24} />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-900 dark:text-white tabular-nums">{rooms.length > 0 ? rooms.filter(r => r.status === 'studying').length : '0'}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Em Foco Agora</span>
          </div>
        </div>
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-900 dark:text-white tabular-nums">{rooms.length > 0 ? '124' : '0'}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estudantes Globais</span>
          </div>
        </div>
        <div className="p-6 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-900 dark:text-white tabular-nums">{rooms.length > 0 ? '42h' : '0h'}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Média Diária</span>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <main>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-slate-100/20 dark:bg-slate-900/20 rounded-[38px] border border-dashed border-slate-200 dark:border-white/10 transition-all duration-300">
            <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando_Salas...</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-100/30 dark:bg-slate-900/30 rounded-[38px] border border-dashed border-slate-200 dark:border-white/10">
            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5">
              <Users size={32} className="text-slate-400 dark:text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Nenhuma sala ativa</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">Seja o primeiro a criar a primeira e convide amigos!</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-tighter text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={18} />
              <span>Criar Primeira Sala</span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-24 left-4 right-4 sm:hidden" style={{ zIndex: Z.raised }}>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-tighter flex items-center justify-center gap-2 shadow-2xl shadow-indigo-600/40 border border-white/10"
        >
          <Plus size={20} />
          <span>Criar Sala de Estudo</span>
        </button>
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[480px] sm:max-w-[90vw] bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-[28px] border border-slate-200 dark:border-white/10 z-[101] overflow-hidden flex flex-col shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <Plus size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nova Sala</h2>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Sala</label>
                    <input name="name" required placeholder="Ex: Maratona de Algoritmos" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tópico / Tecnologia</label>
                    <input name="topic" required placeholder="Ex: React, Rust, SOLID..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max. Devs</label>
                      <select name="maxParticipants" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all appearance-none">
                        {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} Participantes</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Privacidade</label>
                      <div className="flex items-center gap-2 h-11">
                        <input type="checkbox" name="isPrivate" id="isPrivate" className="w-5 h-5 rounded border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500/50" />
                        <label htmlFor="isPrivate" className="text-xs font-bold text-slate-500 dark:text-slate-400">Sala Privada</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha (opcional)</label>
                    <input name="password" type="password" placeholder="••••••" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                  >
                    Lançar Sala Agora
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

StudyRooms.displayName = 'StudyRoomsPage';

export default StudyRooms;
