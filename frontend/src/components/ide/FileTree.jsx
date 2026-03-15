import React, { useState, memo } from 'react';
import { FolderOpen, FileCode, Plus, Trash2, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

const FileTree = ({ snippets, onSelect, onNew, onDelete, isLoading }) => {
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Agrupar snippets por linguagem
  const groupedSnippets = snippets.reduce((acc, snippet) => {
    const langId = snippet.language || 'javascript';
    if (!acc[langId]) acc[langId] = [];
    acc[langId].push(snippet);
    return acc;
  }, {});

  const filteredSnippets = (groupSnippets) => {
    return groupSnippets.filter(s => 
      s.title?.toLowerCase().includes(search.toLowerCase()) || 
      s.code?.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 w-60">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-tighter text-sm">
            <FolderOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>Snippets</span>
          </div>
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
            title="Novo Snippet"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar snippets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-600 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-white/5" />
            ))}
          </div>
        ) : Object.keys(groupedSnippets).length > 0 ? (
          Object.entries(groupedSnippets).map(([langId, langSnippets]) => {
            const lang = SUPPORTED_LANGUAGES.find(l => l.id === langId) || { label: langId, icon: '?', color: '#ccc' };
            const isExpanded = expandedGroups[langId] ?? true;
            const filtered = filteredSnippets(langSnippets);

            if (search && filtered.length === 0) return null;

            return (
              <div key={langId} className="mb-2">
                <button
                  onClick={() => toggleGroup(langId)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition-colors group"
                >
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    <ChevronRight size={14} />
                  </div>
                  <span style={{ color: lang.color }} className="font-mono font-bold">{lang.icon}</span>
                  <span>{lang.label}</span>
                  <span className="ml-auto text-[10px] bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md text-slate-500 dark:text-slate-400">{langSnippets.length}</span>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 mt-1 space-y-1">
                        {filtered.map((snippet) => (
                          <div
                            key={snippet.id}
                            className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition-all border border-transparent hover:border-indigo-500/20 relative"
                            onClick={() => onSelect(snippet)}
                          >
                            <FileCode size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                            <span className="truncate flex-1">{snippet.title || 'Sem título'}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(snippet.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-red-500/50 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 p-4 text-center">
            <p className="text-xs mb-2">Nenhum snippet encontrado.</p>
            <p className="text-[10px] opacity-50">Seus códigos salvos aparecerão aqui agrupados por linguagem.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
            <span>Storage Usage</span>
            <span>{snippets.length}/50</span>
        </div>
        <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                className={`h-full ${snippets.length > 40 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${(snippets.length / 50) * 100}%` }}
            />
        </div>
        {snippets.length >= 40 && (
            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2 font-medium">Atenção: Limite de armazenamento atingindo 80%.</p>
        )}
      </div>
    </div>
  );
};

FileTree.displayName = 'FileTree';

export default memo(FileTree);
