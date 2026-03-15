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
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

/**
 * Inscreve-se em uma sala de estudo específica.
 */
export function subscribeToRoom(roomId, callback, onError) {
  if (!roomId) return () => {};
  
  const unsubscribe = onSnapshot(
    doc(db, 'rooms', roomId),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error('[roomService] Erro ao ouvir sala:', err);
      onError?.(err);
    }
  );
  return unsubscribe;
}

/**
 * Inscreve-se nas mensagens de uma sala.
 */
export function subscribeToMessages(roomId, callback) {
  if (!roomId) return () => {};

  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  const unsubscribe = onSnapshot(q,
    (snap) => {
      const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(messages);
    },
    (err) => {
      console.error('[roomService] Erro ao ouvir mensagens:', err);
    }
  );
  return unsubscribe;
}

/**
 * Lista todas as salas ativas (não expiradas).
 */
export function subscribeToActiveRooms(callback) {
  const now = new Date();
  const q = query(
    collection(db, 'rooms'),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'asc')
  );

  const unsubscribe = onSnapshot(q,
    (snap) => {
      const rooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(rooms);
    },
    (err) => {
      console.error('[roomService] Erro ao listar salas:', err);
    }
  );
  return unsubscribe;
}

/**
 * Cria uma nova sala de estudo.
 */
export async function createRoom(roomData) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const docRef = await addDoc(collection(db, 'rooms'), {
    ...roomData,
    status: 'waiting',
    createdAt: serverTimestamp(),
    expiresAt: expiresAt,
    pomodoro: {
      mode: 'focus',
      timeLeft: 25 * 60,
      isRunning: false,
      cycle: 1,
      startedAt: null
    }
  });
  return docRef.id;
}

/**
 * Envia uma mensagem no chat da sala.
 */
export async function sendMessage(roomId, messageData) {
  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    ...messageData,
    createdAt: serverTimestamp()
  });
}

/**
 * Atualiza o estado do Pomodoro na sala.
 */
export async function updatePomodoro(roomId, pomodoroData) {
  await updateDoc(doc(db, 'rooms', roomId), {
    pomodoro: pomodoroData
  });
}

/**
 * Adiciona ou remove um participante da sala.
 */
export async function updateParticipant(roomId, uid, participantData) {
  const roomRef = doc(db, 'rooms', roomId);
  if (participantData === null) {
    // Remover participante
    await updateDoc(roomRef, {
      [`participants.${uid}`]: deleteDoc() // Nota: no Firestore usa-url key delete
    });
  } else {
    await updateDoc(roomRef, {
      [`participants.${uid}`]: participantData
    });
  }
}
