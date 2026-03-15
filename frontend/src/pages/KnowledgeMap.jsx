import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { db } from '../config/firebase-config';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import dagre from 'dagre';

import KnowledgeGraph from '../components/knowledge/KnowledgeGraph';
import ConceptPanel from '../components/knowledge/ConceptPanel';
import KnowledgeFilters from '../components/knowledge/KnowledgeFilters';
import { CONCEPTS } from '../data/concepts';
import { Map } from 'lucide-react';

const KnowledgeMap = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [userKnowledge, setUserKnowledge] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [activeArea, setActiveArea] = useState('todos');
  const [activeStatus, setActiveStatus] = useState('all');

  // Carregar progresso do usuário
  const loadProgress = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, `users/${user.uid}/knowledgeMap`));
      const progress = {};
      snap.forEach(doc => {
        progress[doc.id] = doc.data();
      });
      setUserKnowledge(progress);
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
      toast.error('Não foi possível carregar seu progresso.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Atualizar status de um conceito
  const handleStatusChange = async (conceptId, newStatus) => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, `users/${user.uid}/knowledgeMap`, conceptId);
      await setDoc(docRef, {
        status: newStatus,
        updatedAt: Date.now()
      }, { merge: true });

      setUserKnowledge(prev => ({
        ...prev,
        [conceptId]: { ...prev[conceptId], status: newStatus }
      }));

      if (newStatus === 'mastered') {
        toast.success(`Parabéns! Você dominou ${CONCEPTS.find(c => c.id === conceptId)?.label}`);
      }
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      toast.error('Erro ao atualizar status.');
    }
  };

  // Processar nós e arestas para o React Flow
  const { nodes, edges, stats } = useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

    const masteredIds = Object.keys(userKnowledge).filter(id => userKnowledge[id]?.status === 'mastered');

    const filteredConcepts = CONCEPTS.filter(c => {
      const matchesArea = activeArea === 'todos' || c.area === activeArea;
      const status = userKnowledge[c.id]?.status || 'not-started';
      const isAvailable = c.prerequisites.every(p => masteredIds.includes(p));
      
      let matchesStatus = true;
      if (activeStatus === 'available') matchesStatus = isAvailable && status !== 'mastered';
      else if (activeStatus !== 'all') matchesStatus = status === activeStatus;

      return matchesArea && matchesStatus;
    });

    const flowNodes = filteredConcepts.map(c => {
      const status = userKnowledge[c.id]?.status || 'not-started';
      const isAvailable = c.prerequisites.every(p => masteredIds.includes(p));
      
      dagreGraph.setNode(c.id, { width: 160, height: 64 });
      
      return {
        id: c.id,
        data: { ...c, status, isAvailable },
        position: { x: 0, y: 0 }, // Será calculado pelo dagre
      };
    });

    const flowEdges = [];
    CONCEPTS.forEach(c => {
      c.prerequisites.forEach(pId => {
        if (filteredConcepts.some(fc => fc.id === c.id) && filteredConcepts.some(fc => fc.id === pId)) {
          dagreGraph.setEdge(pId, c.id);
          flowEdges.push({
            id: `e-${pId}-${c.id}`,
            source: pId,
            target: c.id,
            animated: masteredIds.includes(pId),
            style: { 
              stroke: masteredIds.includes(pId) 
                ? (isDarkMode ? '#6366f1' : '#4f46e5') 
                : (isDarkMode ? '#1e293b' : '#e2e8f0'), 
              strokeWidth: 2 
            },
          });
        }
      });
    });

    dagre.layout(dagreGraph);

    flowNodes.forEach(node => {
      const nodeWithPos = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPos.x - 80,
        y: nodeWithPos.y - 32,
      };
    });

    const masteredCount = masteredIds.length;
    const availableCount = CONCEPTS.filter(c => 
      userKnowledge[c.id]?.status !== 'mastered' && 
      c.prerequisites.every(p => masteredIds.includes(p))
    ).length;

    return { 
      nodes: flowNodes, 
      edges: flowEdges, 
      stats: { total: CONCEPTS.length, mastered: masteredCount, available: availableCount } 
    };
  }, [userKnowledge, activeArea, activeStatus, isDarkMode]);

  const selectedConcept = useMemo(() => 
    CONCEPTS.find(c => c.id === selectedConceptId), 
    [selectedConceptId]
  );

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-20 px-6 pb-6 overflow-hidden">
      <header className="flex flex-col gap-2 mb-4 shrink-0">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mapa de Conhecimento</h1>
        <p className="text-slate-600 dark:text-slate-500 font-semibold text-sm">Visualize sua jornada e descubra novos horizontes técnicos.</p>
      </header>

      <KnowledgeFilters 
        activeArea={activeArea}
        onAreaChange={setActiveArea}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        stats={stats}
      />

      <main className="flex-1 relative overflow-hidden">
        {nodes.length > 0 ? (
          <KnowledgeGraph 
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => setSelectedConceptId(node.id)}
            isLoading={isLoading}
          />
        ) : !isLoading && (
          <div className="flex flex-col items-center justify-center h-full bg-slate-100/30 dark:bg-slate-900/30 rounded-[38px] border-2 border-dashed border-slate-200 dark:border-white/5 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5 shadow-sm">
              <Map size={32} className="text-slate-400 dark:text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Seu mapa está pronto para ser explorado</h3>
            <p className="text-slate-600 dark:text-slate-500 font-medium max-w-md mb-8">
              Comece marcando seus primeiros conceitos como dominados para ver as conexões e dependências entre as tecnologias.
            </p>
            <button 
              onClick={() => setActiveStatus('all')}
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              Ver todos os conceitos
            </button>
          </div>
        )}

        <AnimatePresence>
          {selectedConceptId && (
            <ConceptPanel 
              concept={selectedConcept}
              userStatus={userKnowledge[selectedConceptId]?.status}
              onStatusChange={handleStatusChange}
              onClose={() => setSelectedConceptId(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

KnowledgeMap.displayName = 'KnowledgeMapPage';

export default KnowledgeMap;
