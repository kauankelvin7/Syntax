import React, { useState, memo } from 'react';
import { Terminal, Cpu, History as HistoryIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OutputPanel = ({ output, stderr, executionStats, isLoading, adaReview, history, onClear, onToggle }) => {
  const [activeTab, setActiveTab] = useState('output');

  const tabs = [
    { id: 'output', label: 'Output', icon: Terminal },
    { id: 'ada', label: 'Ada Review', icon: Cpu },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
      {/* Tabs */}
      <div className="flex items-center px-4 bg-slate-50 dark:bg-slate-950 h-10 gap-2 border-b border-slate-200 dark:border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1 text-xs font-medium transition-all rounded-t-lg ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t border-x border-slate-200 dark:border-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-white/5"
            title="Clear Output"
          >
            <X size={14} />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-white/5"
            title="Close Panel"
          >
            <X size={14} className="rotate-45" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50 dark:bg-[#0d1117] font-mono text-xs sm:text-sm">
        <AnimatePresence mode="wait">
          {activeTab === 'output' && (
            <motion.div
              key="output"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full whitespace-pre-wrap break-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse" />
                  Executando...
                </div>
              ) : stderr ? (
                <div className="flex flex-col h-full">
                  <div className="text-rose-600 dark:text-rose-400 flex-1">{stderr}</div>
                  {executionStats && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/5 flex gap-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                      <span>Time: {executionStats.time}s</span>
                      <span>Memory: {executionStats.memory}KB</span>
                      <span className="ml-auto text-rose-500/50">{executionStats.status}</span>
                    </div>
                  )}
                </div>
              ) : output ? (
                <div className="flex flex-col h-full">
                  <div className="text-slate-700 dark:text-emerald-400 flex-1">{output}</div>
                  {executionStats && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/5 flex gap-4 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                      <span>Time: {executionStats.time}s</span>
                      <span>Memory: {executionStats.memory}KB</span>
                      <span className="ml-auto text-emerald-500/50">{executionStats.status}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 dark:text-slate-600 italic">// Execute o código para ver o resultado aqui</div>
              )}
            </motion.div>
          )}

          {activeTab === 'ada' && (
            <motion.div
              key="ada"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {adaReview ? (
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  {/* Simplificando Markdown para exibição rápida, mas em um cenário real usaria react-markdown */}
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{adaReview}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-4">
                  <Cpu size={32} className="opacity-20" />
                  <p className="text-center max-w-xs">
                    Run "Ada Review" from the toolbar to get AI feedback on your code quality and suggestions.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full space-y-2"
            >
              {history && history.length > 0 ? (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{item.language}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.status}</div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-4">
                  <HistoryIcon size={32} className="opacity-20" />
                  <p>Your recent execution history will appear here.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

OutputPanel.displayName = 'OutputPanel';

export default memo(OutputPanel);
