import React, { useMemo, memo } from 'react';
import { ReactFlow, Controls, Background, MiniMap, ConnectionLineType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ConceptNode from './ConceptNode';
import { useTheme } from '../../contexts/ThemeContext';

const nodeTypes = {
  concept: ConceptNode,
};

const KnowledgeGraph = ({ nodes, edges, onNodeClick, isLoading }) => {
  const { isDarkMode } = useTheme();
  const defaultViewport = { x: 0, y: 0, zoom: 0.8 };

  const graphNodes = useMemo(() => nodes.map(node => ({
    ...node,
    type: 'concept',
  })), [nodes]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/5 shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5" />
        <div className="w-12 h-12 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] animate-pulse">Carregando_Grafo...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 relative shadow-2xl transition-all duration-300">
      <ReactFlow
        nodes={graphNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        defaultViewport={defaultViewport}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        colorMode={isDarkMode ? 'dark' : 'light'}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={isDarkMode ? '#1e293b' : '#e2e8f0'} gap={20} size={1} />
        <Controls className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-white/10 !rounded-xl !shadow-2xl overflow-hidden" />
        <MiniMap 
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const areaColors = {
              frontend: '#06b6d4',
              backend: '#6366f1',
              algorithms: '#8b5cf6',
              database: '#f59e0b',
              devops: '#10b981',
              architecture: '#f43f5e',
              'cs-fundamentals': '#475569',
            };
            return areaColors[node.data.area] || '#334155';
          }}
          maskColor={isDarkMode ? "rgba(2, 6, 23, 0.8)" : "rgba(255, 255, 255, 0.7)"}
          className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-white/10 !rounded-2xl !shadow-2xl"
        />
      </ReactFlow>
    </div>
  );
};

KnowledgeGraph.displayName = 'KnowledgeGraph';

export default memo(KnowledgeGraph);
