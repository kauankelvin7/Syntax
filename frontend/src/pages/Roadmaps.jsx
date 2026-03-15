import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { db } from '../config/firebase-config';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { Map, Zap, Target, History, ChevronRight, Trophy, Info } from 'lucide-react';

import CareerSelector from '../components/roadmap/CareerSelector';
import RoadmapProgress from '../components/roadmap/RoadmapProgress';
import RoadmapTree from '../components/roadmap/RoadmapTree';
import { ROADMAPS } from '../data/roadmaps';

const Roadmaps = () => {
  const { user } = useAuth();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(null);
  const [userRoadmaps, setUserRoadmaps] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Carregar progresso dos roadmaps
  const loadRoadmapProgress = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, `users/${user.uid}/roadmapProgress`));
      const progress = {};
      snap.forEach(doc => {
        progress[doc.id] = doc.data();
      });
      setUserRoadmaps(progress);
      
      // Se houver apenas uma trilha em progresso, seleciona ela automaticamente (opcional)
      // const active = Object.keys(progress).find(id => progress[id].overallProgress < 100);
      // if (active) setSelectedRoadmapId(active);

    } catch (error) {
      console.error('Erro ao carregar roadmaps:', error);
      toast.error('Não foi possível carregar seu progresso nas trilhas.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadRoadmapProgress();
  }, [loadRoadmapProgress]);

  const activeRoadmap = useMemo(() => 
    ROADMAPS.find(r => r.id === selectedRoadmapId), 
    [selectedRoadmapId]
  );

  const calculateOverallProgress = (roadmap, nodesProgress) => {
    const totalNodes = roadmap.phases.reduce((acc, phase) => acc + phase.nodes.length, 0);
    if (totalNodes === 0) return 0;
    
    const completedNodes = roadmap.phases.reduce((acc, phase) => {
      return acc + phase.nodes.filter(node => nodesProgress[node.id]?.status === 'completed').length;
    }, 0);
    
    return Math.round((completedNodes / totalNodes) * 100);
  };

  const calculateRemainingMonths = (roadmap, nodesProgress) => {
    const pendingWeeks = roadmap.phases.reduce((acc, phase) => {
      return acc + phase.nodes.reduce((pAcc, node) => {
        return pAcc + (nodesProgress[node.id]?.status !== 'completed' ? node.estimatedWeeks : 0);
      }, 0);
    }, 0);
    
    return Math.ceil(pendingWeeks / 4);
  };

  const handleStatusChange = async (nodeId, newStatus) => {
    if (!user?.uid || !activeRoadmap) return;
    
    try {
      const roadmapId = activeRoadmap.id;
      const currentProgress = userRoadmaps[roadmapId] || { nodes: {}, selectedAt: Date.now() };
      
      const newNodesProgress = {
        ...currentProgress.nodes,
        [nodeId]: { status: newStatus, updatedAt: Date.now() }
      };
      
      const overallProgress = calculateOverallProgress(activeRoadmap, newNodesProgress);
      const remainingMonths = calculateRemainingMonths(activeRoadmap, newNodesProgress);
      
      const roadmapData = {
        ...currentProgress,
        nodes: newNodesProgress,
        overallProgress,
        updatedAt: Date.now()
      };

      await setDoc(doc(db, `users/${user.uid}/roadmapProgress`, roadmapId), roadmapData);
      
      setUserRoadmaps(prev => ({
        ...prev,
        [roadmapId]: roadmapData
      }));

      if (newStatus === 'completed') {
        toast.success('Tópico concluído! Continue assim.');
        if (overallProgress === 100) {
            toast.success(`🎉 PARABÉNS! Você completou a trilha ${activeRoadmap.title}!`);
            // Aqui poderia disparar o sistema de conquistas
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso do roadmap:', error);
      toast.error('Erro ao salvar progresso.');
    }
  };

  const handleAskAda = () => {
    const progress = userRoadmaps[selectedRoadmapId]?.overallProgress || 0;
    toast.info(`Ada está analisando seu progresso de ${progress}%...`);
    // Em um cenário real, isso abriria o chat da Ada com o contexto do roadmap
  };

  const roadmapStats = useMemo(() => {
    if (!activeRoadmap) return null;
    const progress = userRoadmaps[activeRoadmap.id] || { nodes: {} };
    const total = activeRoadmap.phases.reduce((acc, p) => acc + p.nodes.length, 0);
    const completed = activeRoadmap.phases.reduce((acc, p) => 
        acc + p.nodes.filter(n => progress.nodes[n.id]?.status === 'completed').length, 0);
    
    return {
        totalCount: total,
        completedCount: completed,
        remainingMonths: calculateRemainingMonths(activeRoadmap, progress.nodes)
    };
  }, [activeRoadmap, userRoadmaps]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-20 pb-12 px-6 overflow-x-hidden relative">
      <AnimatePresence mode="wait">
        {!selectedRoadmapId ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-[1400px] mx-auto w-full space-y-12"
          >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Trilhas de Carreira</h1>
                <p className="text-slate-600 dark:text-slate-500 font-semibold max-w-xl">
                  Escolha seu destino e nós traçamos o caminho mais eficiente para sua senioridade.
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Target size={20} />
                <span className="text-xs font-black uppercase tracking-widest">
                    {Object.keys(userRoadmaps).length} trilhas iniciadas
                </span>
              </div>
            </header>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 rounded-[28px] bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-white/5 shadow-sm transition-all duration-300" />
                ))}
              </div>
            ) : (
              <CareerSelector 
                roadmaps={ROADMAPS}
                userProgress={userRoadmaps}
                onSelect={(r) => setSelectedRoadmapId(r.id)}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <RoadmapProgress 
                roadmap={activeRoadmap}
                progress={roadmapStats}
                onBack={() => setSelectedRoadmapId(null)}
                onAskAda={handleAskAda}
            />

            <main className="max-w-[1400px] mx-auto pt-12">
                <RoadmapTree 
                    phases={activeRoadmap.phases}
                    userProgress={userRoadmaps[activeRoadmap.id]?.nodes || {}}
                    onStatusChange={handleStatusChange}
                />
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};

Roadmaps.displayName = 'RoadmapsPage';

export default Roadmaps;
