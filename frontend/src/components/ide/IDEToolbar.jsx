import React, { useState, memo } from 'react';
import { Play, Cpu, Save, FileCode, FileText, ChevronDown, Check, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

const IDEToolbar = ({
  selectedLanguage,
  onLanguageChange,
  onRun,
  onAdaReview,
  onSaveSnippet,
  onToFlashcard,
  onToSummary,
  status = 'ready',
  isLoading = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const statusColors = {
    ready: 'bg-emerald-500',
    running: 'bg-amber-500 animate-pulse',
    error: 'bg-red-500'
  };

  const statusLabels = {
    ready: 'Ready',
    running: 'Running...',
    error: 'Error'
  };

  return (
    <div className="h-14 flex items-center px-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 gap-4 z-30">
      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all text-sm font-semibold"
        >
          <span style={{ color: currentLang.color }}>{currentLang.icon}</span>
          <span className="text-slate-900 dark:text-slate-200">{currentLang.label}</span>
          <ChevronDown size={14} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange(lang.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm transition-colors ${
                      selectedLanguage === lang.id ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold" style={{ color: lang.color }}>{lang.icon}</span>
                      <span>{lang.label}</span>
                    </div>
                    {selectedLanguage === lang.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

      {/* Main Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={isLoading}
          className="group relative flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold text-white shadow-lg shadow-emerald-500/20"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          <span>Executar</span>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">
            Ctrl + Enter
          </div>
        </button>

        <button
          onClick={onAdaReview}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90 transition-all text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
        >
          <Cpu size={16} />
          <span>Ada Review</span>
        </button>
      </div>

      <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

      {/* Save Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveSnippet}
          className="group relative p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-slate-500 dark:text-slate-400"
          title="Salvar Snippet"
        >
          <Save size={18} />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">
            Ctrl + S
          </div>
        </button>
        <button
          onClick={onToFlashcard}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-slate-500 dark:text-slate-400"
          title="Criar Flashcard"
        >
          <FileCode size={18} />
        </button>
        <button
          onClick={onToSummary}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 transition-all text-slate-500 dark:text-slate-400"
          title="Adicionar ao Resumo"
        >
          <FileText size={18} />
        </button>
      </div>

      <div className="flex-1" />

      {/* Status Indicator */}
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{statusLabels[status]}</span>
        <div className="group relative">
            <Info size={12} className="text-slate-400 dark:text-slate-600 cursor-help" />
            <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-slate-200 dark:border-white/10 shadow-xl z-50">
                Piston API Status: Online<br/>
                Monaco Editor: Ready<br/>
                Cache: Active
            </div>
        </div>
      </div>
    </div>
  );
};

IDEToolbar.displayName = 'IDEToolbar';

export default memo(IDEToolbar);
