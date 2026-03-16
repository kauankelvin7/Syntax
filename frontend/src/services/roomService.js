import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  setDoc, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc,
  deleteField,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

export function subscribeToRoom(roomId, callback, onError) {
  if (!roomId) return () => {};
  const unsubscribe = onSnapshot(
    doc(db, 'rooms', roomId),
    (snap) => { if (snap.exists()) { callback({ id: snap.id, ...snap.data() }); } else { callback(null); } },
    (err) => { console.error('[roomService] Erro ao ouvir sala:', err); onError?.(err); }
  );
  return unsubscribe;
}

export function subscribeToMessages(roomId, callback) {
  if (!roomId) return () => {};
  const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'), limit(100));
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => console.error('[roomService] Erro ao ouvir mensagens:', err)
  );
}

export function subscribeToActiveRooms(callback) {
  const now = new Date();
  const q = query(collection(db, 'rooms'), where('expiresAt', '>', now), orderBy('expiresAt', 'asc'));
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => console.error('[roomService] Erro ao listar salas:', err)
  );
}

export async function createRoom(roomData) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  const docRef = await addDoc(collection(db, 'rooms'), {
    ...roomData, status: 'waiting', createdAt: serverTimestamp(), expiresAt,
    pomodoro: { mode: 'focus', timeLeft: 25 * 60, isRunning: false, cycle: 1, startedAt: null }
  });
  return docRef.id;
}

/**
 * Encerra e apaga uma sala e todas as suas mensagens (batch delete).
 * Apenas o dono deve chamar esta função.
 */
export async function deleteRoom(roomId) {
  if (!db) throw new Error('Firestore não inicializado');
  if (!roomId) throw new Error('roomId é obrigatório');
  const messagesSnap = await getDocs(collection(db, 'rooms', roomId, 'messages'));
  const batch = writeBatch(db);
  messagesSnap.docs.forEach((msgDoc) => batch.delete(msgDoc.ref));
  batch.delete(doc(db, 'rooms', roomId));
  await batch.commit();
}

export async function sendMessage(roomId, messageData) {
  await addDoc(collection(db, 'rooms', roomId, 'messages'), { ...messageData, createdAt: serverTimestamp() });
}

export async function updatePomodoro(roomId, pomodoroData) {
  await updateDoc(doc(db, 'rooms', roomId), { pomodoro: pomodoroData });
}

export async function updateParticipant(roomId, uid, participantData) {
  if (!db) throw new Error('Firestore não inicializado');
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    [`participants.${uid}`]: participantData === null ? deleteField() : participantData
  });
}