/**
 * ⚔️ CHALLENGE INVITE MODAL
 * * Modal gamificado para seleção e envio de desafios (Code Battles).
 * - Header temático com contexto do oponente
 * - Cards de deck interativos com feedback visual de seleção
 * - Botões de ação com alta proeminência (Gamification UI)
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Loader2, Code2, CheckCircle2, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext-firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../../config/firebase-config';
import { getInitials, getAvatarColor } from '../../utils/chatHelpers';

const ChallengeInvite = memo(({ isOpen, onClose, friend, onSendChallenge }) => {
  const { user } = useAuth();
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    setLoading(true);
    setSelectedDeck(null); // Resetar seleção ao abrir

    const fetchDecks = async () => {
      try {
        const q = query(
          collection(db, 'flashcards'),
          where('uid', '==', user.uid),
          limit(50),
        );
        const snap = await getDocs(q);
        const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const deckMap = {};
        raw.forEach((card) => {
          const key = card.materiaId || card.materia || 'Geral';
          if (!deckMap[key]) {
            deckMap[key] = {
              id: key,
              name: card.materiaNome || card.materia || 'Snippets Gerais',
              materia: card.materia || '',
              cards: [],
            };
          }
          deckMap[key].cards.push(card);
        });

        // Ordena por quantidade de cards (maiores primeiro)
        const validDecks = Object.values(deckMap)
          .filter((d) => d.cards.length >= 3)
          .sort((a, b) => b.cards.length - a.cards.length);

        setDecks(validDecks);
      } catch {
        setDecks([]);
        toast.error('Erro ao carregar seus flashcards.');
      }
      setLoading(false);
    };
    fetchDecks();
  }, [isOpen, user?.uid]);

  const handleSend = async () => {
    if (!selectedDeck || !friend) return;
    setSending(true);
    try {
      await onSendChallenge(friend, selectedDeck);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar desafio');
    }
    setSending(false);
  };

  if (!friend) return null;
  const initials = getInitials(friend.displayName);
  const avatarBg = getAvatarColor(friend.displayName);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Escuro */}
          <motion.div
            className="fixed inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="fixed inset-x-4 top-1/2 z-[101] max-w-sm mx-auto"
            initial={{ opacity: 0, y: '-45%', scale: 0.95 }}
            animate={{ opacity: 1, y: '-50%', scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }}
            exit={{ opacity: 0, y: '-45%', scale: 0.95, transition: { duration: 0.2 } }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[85vh]">
              
              {/* ─── Header Gamificado (Code Battle) ─── */}
              <div className="relative bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 px-5 py-8 shrink-0 overflow-hidden">
                {/* Textura sutil no fundo */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-2xl rounded-full" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 flex items-center justify-center p-2 rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-md transition-all active:scale-95 z-20"
                  aria-label="Fechar"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border-2 border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                       <Swords size={36} className="text-white drop-shadow-md" strokeWidth={2.5} />
                    </div>
                    {/* Mini avatar do oponente */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-[2.5px] border-orange-500 overflow-hidden bg-white shadow-lg">
                      {friend.photoURL ? (
                        <img src={friend.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: avatarBg }}>
                          {initials}
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-[26px] font-black text-white tracking-tight drop-shadow-md leading-none mb-1.5 uppercase">Code Battle</h3>
                  <p className="text-[13px] font-bold text-orange-50 opacity-90 tracking-wide">Desafiando {friend.displayName.split(' ')[0]}</p>
                </div>
              </div>

              {/* ─── Body (Seleção de Deck) ─── */}
              <div className="p-6 flex flex-col flex-1 min-h-0 bg-slate-50 dark:bg-slate-900">
                <div className="mb-5 text-center shrink-0">
                  <h4 className="text-[16px] font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Escolha sua Stack</h4>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">Selecione um módulo de cards para o duelo</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-2">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <Loader2 size={24} className="animate-spin text-orange-500" strokeWidth={3} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Carregando módulos...</span>
                    </div>
                  ) : decks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4 bg-white dark:bg-slate-800/50 rounded-[20px] border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <Terminal size={32} className="text-slate-300 dark:text-slate-600 mb-3" strokeWidth={2} />
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Repositório vazio
                      </p>
                      <p className="text-[12px] font-medium text-slate-500">
                        Você precisa ter pelo menos 3 flashcards na mesma stack para iniciar o embate.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {decks.map((deck) => {
                        const isSelected = selectedDeck?.id === deck.id;
                        return (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={deck.id}
                            onClick={() => setSelectedDeck(deck)}
                            className={`
                              relative flex items-center gap-4 p-4 rounded-[20px] cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500 shadow-[0_8px_20px_rgba(249,115,22,0.15)]'
                                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-800'
                              }
                            `}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-inner ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'}`}>
                              <Code2 size={22} strokeWidth={isSelected ? 2.5 : 2} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-[15px] font-black truncate tracking-tight transition-colors ${isSelected ? 'text-orange-700 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {deck.name}
                              </p>
                              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                {deck.cards.length} cards
                              </p>
                            </div>
                            
                            {/* Checkmark animado */}
                            <div className="shrink-0 w-6 flex justify-end">
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                                    <CheckCircle2 size={24} className="text-orange-500" strokeWidth={2.5} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ─── Footer (Ação) ─── */}
                <div className="pt-5 mt-2 shrink-0">
                  <button
                    onClick={handleSend}
                    disabled={!selectedDeck || sending || decks.length === 0}
                    className={`
                      w-full py-4 rounded-[16px] font-black text-[15px] uppercase tracking-widest transition-all flex items-center justify-center gap-2
                      ${(!selectedDeck || decks.length === 0) 
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-[0_8px_24px_rgba(249,115,22,0.3)] active:scale-[0.98]'
                      }
                    `}
                  >
                    {sending ? (
                      <Loader2 size={22} className="animate-spin" strokeWidth={3} />
                    ) : (
                      <>
                        <Swords size={22} strokeWidth={2.5} /> Lançar Desafio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

ChallengeInvite.displayName = 'ChallengeInvite';
export default ChallengeInvite;