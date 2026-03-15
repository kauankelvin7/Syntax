import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Lock, CheckCircle2, Circle } from 'lucide-react';
import RoadmapNode from './RoadmapNode';

const RoadmapTree = ({ phases, userProgress, onStatusChange }) => {
  return (
    <div className="relative space-y-16 pb-24">
      {/* Central Connector Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/30 via-cyan-500/20 to-transparent -translate-x-1/2 hidden md:block" />

      {phases.map((phase, pIdx) => {
        const isFirst = pIdx === 0;
        const prevPhase = phases[pIdx - 1];
        
        // Verificar se a fase anterior foi completa
        const isPrevComplete = !prevPhase || prevPhase.nodes.every(n => 
          userProgress[n.id]?.status === 'completed'
        );
        
        const isLocked = !isFirst && !isPrevComplete;
        const phaseCompletedCount = phase.nodes.filter(n => userProgress[n.id]?.status === 'completed').length;
        const phaseTotalCount = phase.nodes.length;

        return (
          <section key={phase.id} className={`relative z-10 ${isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            {/* Phase Header */}
            <div className="flex flex-col items-center mb-12">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative">
                  {isLocked ? (
                    <Lock size={20} className="text-slate-600" />
                  ) : (
                    <span className="text-xl font-black text-indigo-400">{pIdx + 1}</span>
                  )}
                  {phaseCompletedCount === phaseTotalCount && !isLocked && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="h-px w-12 bg-white/10 hidden md:block" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {phase.title}
                </h2>
                <div className="h-px w-12 bg-white/10 hidden md:block" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50 px-4 py-1.5 rounded-full border border-white/5">
                <span>{phaseCompletedCount} de {phaseTotalCount} tópicos</span>
              </div>
            </div>

            {/* Nodes Grid */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 px-4 max-w-6xl mx-auto">
              {phase.nodes.map((node) => (
                <RoadmapNode
                  key={node.id}
                  node={node}
                  status={userProgress[node.id]?.status}
                  onStatusChange={onStatusChange}
                  userContent={{ flashcards: 0, resumos: 0 }} // Mock
                />
              ))}
            </div>

            {/* Connector to next phase */}
            {pIdx < phases.length - 1 && (
              <div className="flex justify-center mt-12 md:hidden">
                <ChevronDown size={24} className="text-slate-800 animate-bounce" />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

RoadmapTree.displayName = 'RoadmapTree';

export default memo(RoadmapTree);
