import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

/**
 * Busca recursos da comunidade (resumos/flashcards públicos).
 */
export async function getCommunityResources(filters = {}) {
  const types = ['flashcard', 'resumo'];
  const allResources = [];

  for (const type of types) {
    const colName = type === 'flashcard' ? 'communityFlashcards' : 'communityResumos';
    const q = query(
      collection(db, colName),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(25)
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => allResources.push({ id: d.id, ...d.data(), type }));
  }

  return allResources.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
}

/**
 * Compartilha um recurso privado na biblioteca comunitária.
 */
export async function shareResource(type, resourceData) {
  const colName = type === 'flashcard' ? 'communityFlashcards' : 'communityResumos';
  const docRef = await addDoc(collection(db, colName), {
    ...resourceData,
    isPublic: true,
    likes: 0,
    downloads: 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

/**
 * Incrementa o contador de likes de um recurso.
 */
export async function likeResource(type, resourceId) {
  const colName = type === 'flashcard' ? 'communityFlashcards' : 'communityResumos';
  const ref = doc(db, colName, resourceId);
  await updateDoc(ref, {
    likes: increment(1)
  });
}

/**
 * Registra o download (importação) de um recurso.
 */
export async function trackDownload(type, resourceId) {
  const colName = type === 'flashcard' ? 'communityFlashcards' : 'communityResumos';
  const ref = doc(db, colName, resourceId);
  await updateDoc(ref, {
    downloads: increment(1)
  });
}
