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
  deleteDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase-config';

const getColName = (type) => type === 'flashcard' ? 'communityFlashcards' : 'communityResumos';

export async function getCommunityResources() {
  const types = ['flashcard', 'resumo'];
  const allResources = [];
  for (const type of types) {
    const q = query(
      collection(db, getColName(type)),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(25)
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => allResources.push({ id: d.id, ...d.data(), type }));
  }
  return allResources.sort((a, b) =>
    (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
  );
}

export async function shareResource(type, resourceData) {
  const docRef = await addDoc(collection(db, getColName(type)), {
    ...resourceData,
    isPublic:  true,
    likes:     0,
    downloads: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function likeResource(type, resourceId) {
  await updateDoc(doc(db, getColName(type), resourceId), { likes: increment(1) });
}

/**
 * Importa recurso para a coleção pessoal do usuário.
 * Se for um Deck de Flashcards (Array), desempacota e cria um documento para cada cartão.
 */
export async function importResource(type, resource, userId) {
  if (!userId) throw new Error('Usuário não autenticado');

  // Incrementa downloads na biblioteca da comunidade
  await updateDoc(doc(db, getColName(type), resource.id), {
    downloads: increment(1),
  });

  if (type === 'flashcard') {
    // Verifica se o conteúdo é um Deck (Array de perguntas e respostas)
    if (Array.isArray(resource.content)) {
      // Cria um flashcard individual para cada item do array
      const promessas = resource.content.map(cartao => {
        return addDoc(collection(db, 'flashcards'), {
          uid:            userId,
          pergunta:       cartao.question || '',
          resposta:       cartao.answer || '',
          materiaId:      '',
          materiaNome:    resource.topic || 'Comunidade', // Usa o tópico do deck
          materiaCor:     '#8B5CF6', // Cor roxa para destacar cartões importados
          tags:           ['importado', ...(resource.tags || [])],
          importadoDe:    resource.id,
          // SM-2 defaults
          repetitions:    0,
          interval:       0,
          easeFactor:     2.5,
          nextReviewDate: null,
          createdAt:      serverTimestamp(),
        });
      });
      
      // Aguarda todos os cartões serem salvos no banco
      await Promise.all(promessas);

    } else {
      // Fallback: Caso seja um flashcard antigo/único (texto simples)
      await addDoc(collection(db, 'flashcards'), {
        uid:            userId,
        pergunta:       resource.title   || resource.pergunta   || '',
        resposta:       resource.content || resource.resposta   || '',
        materiaId:      '',
        materiaNome:    resource.topic   || 'Importado',
        materiaCor:     '#8B5CF6',
        tags:           resource.tags    || [],
        importadoDe:    resource.id,
        repetitions:    0,
        interval:       0,
        easeFactor:     2.5,
        nextReviewDate: null,
        createdAt:      serverTimestamp(),
      });
    }
  } else {
    // Resumos continuam sendo salvos normalmente
    await addDoc(collection(db, 'resumos'), {
      uid:            userId,
      titulo:         resource.title   || resource.titulo   || 'Resumo importado',
      conteudo:       resource.content || resource.conteudo || '',
      materiaId:      '',
      materiaNome:    resource.topic   || 'Importado',
      tags:           resource.tags    || [],
      importadoDe:    resource.id,
      createdAt:      serverTimestamp(),
    });
  }
}

export async function deleteResource(type, resourceId) {
  await deleteDoc(doc(db, getColName(type), resourceId));
}