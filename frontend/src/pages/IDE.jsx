import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { loader } from '@monaco-editor/react';
import { db } from '../config/firebase-config';
import { collection, setDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext-firebase';

// Configurar o Monaco Editor para desabilitar source maps
loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' },
});

import IDEToolbar from '../components/ide/IDEToolbar';
import FileTree from '../components/ide/FileTree';
import CodeEditor from '../components/ide/CodeEditor';
import OutputPanel from '../components/ide/OutputPanel';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { executeCode } from '../services/pistonService';

import { Terminal, FolderOpen, ChevronUp, Play, Save, Loader } from 'lucide-react';

const IDE = () => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].template);
  const [snippets, setSnippets] = useState([]);
  const [activeSnippet, setActiveSnippet] = useState(null);
  const [output, setOutput] = useState('');
  const [stderr, setStderr] = useState('');
  const [executionStats, setExecutionStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSnippetsLoading, setIsSnippetsLoading] = useState(false);
  const [adaReview, setAdaReview] = useState('');
  const [history, setHistory] = useState([]);
  
  // Estados para responsividade mobile
  const [showFileTree, setShowFileTree] = useState(false);
  const [showOutput, setShowOutput] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const editorRef = useRef(null);

  // Monitorar redimensionamento para isMobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Carregar snippets do Firestore
  const loadSnippets = useCallback(async () => {
    const userId = user?.uid;
    if (!userId) return;
    setIsSnippetsLoading(true);
    try {
      const q = query(
        collection(db, 'users', userId, 'snippets'),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const loadedSnippets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSnippets(loadedSnippets);
    } catch (error) {
      console.error('Erro ao carregar snippets:', error);
      toast.error('Não foi possível carregar seus snippets.');
    } finally {
      setIsSnippetsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadSnippets();
    // Carregar histórico do localStorage
    const savedHistory = localStorage.getItem('ide_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [loadSnippets]);

  // Executar código
  const handleRun = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setStderr('');
    setOutput('');
    setExecutionStats(null);

    try {
      const lang = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage);
      const result = await executeCode({
        language: lang.pistonName,
        code: code
      });

      if (result.stderr) {
        setStderr(result.stderr);
        addToHistory('error');
      } else {
        setOutput(result.stdout);
        addToHistory('success');
      }
      setExecutionStats({
        time: result.time,
        memory: result.memory,
        status: result.status
      });
    } catch (error) {
      if (error.message.startsWith('JUDGE0_NOT_CONFIGURED')) {
        setStderr(error.message.replace('JUDGE0_NOT_CONFIGURED: ', ''));
      } else {
        setStderr(error.message);
        toast.error('Erro na execução: ' + error.message);
      }
      addToHistory('error');
    } finally {
      setIsLoading(false);
    }
  };

  const addToHistory = (status) => {
    const newItem = {
      language: selectedLanguage,
      timestamp: Date.now(),
      status: status
    };
    const newHistory = [newItem, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('ide_history', JSON.stringify(newHistory));
  };

  // Salvar snippet no Firestore
  const handleSaveSnippet = async () => {
    const userId = user?.uid;
    if (!userId) {
      toast.error('Você precisa estar logado para salvar.');
      return;
    }

    if (!activeSnippet && snippets.length >= 50) {
      toast.error('Limite de 50 snippets atingido.');
      return;
    }

    try {
      const title = code.split('\n')[0].replace(/\/\/\s*|#\s*|--\s*/, '').substring(0, 40) || 'Novo Snippet';
      const snippetId = activeSnippet?.id || crypto.randomUUID();
      const snippetData = {
        title,
        code,
        language: selectedLanguage,
        updatedAt: serverTimestamp(),
      };

      if (!activeSnippet) {
        snippetData.createdAt = serverTimestamp();
      }

      await setDoc(
        doc(db, 'users', userId, 'snippets', snippetId),
        snippetData,
        { merge: true }
      );

      if (!activeSnippet) {
        setActiveSnippet({ id: snippetId, ...snippetData });
      }
      
      toast.success(activeSnippet ? 'Snippet atualizado!' : 'Snippet salvo!');
      loadSnippets();
    } catch (error) {
      console.error('Erro ao salvar snippet:', error);
      toast.error('Erro ao salvar o snippet.');
    }
  };

  const handleNewSnippet = () => {
    setActiveSnippet(null);
    const lang = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage);
    setCode(lang.template);
  };

  const handleSelectSnippet = (snippet) => {
    setActiveSnippet(snippet);
    setSelectedLanguage(snippet.language);
    setCode(snippet.code);
  };

  const handleDeleteSnippet = async (id) => {
    const userId = user?.uid;
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'snippets', id));
      if (activeSnippet?.id === id) setActiveSnippet(null);
      loadSnippets();
      toast.success('Snippet removido.');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao remover snippet.');
    }
  };

  const handleLanguageChange = (newLangId) => {
    const newLang = SUPPORTED_LANGUAGES.find(l => l.id === newLangId);
    if (code.trim() !== '' && code !== SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage).template) {
      if (window.confirm('Deseja manter o código atual? Se não, o template da nova linguagem será carregado.')) {
        setSelectedLanguage(newLangId);
        return;
      }
    }
    setSelectedLanguage(newLangId);
    setCode(newLang.template);
  };

  const handleAdaReview = async () => {
    toast.loading('Ada está revisando seu código...', { id: 'ada-review' });
    try {
      // Mock da chamada Gemini para demonstração. Em um cenário real, usaria a API integrada.
      // O prompt system está definido no syntax-fase1-prompt.md
      setTimeout(() => {
        setAdaReview(`### Ada Review - ${selectedLanguage.toUpperCase()}

**Qualidade Geral: 8/10**
Seu código está bem estruturado e segue boas práticas de nomenclatura. A lógica principal é clara.

**Pontos Positivos:**
- Uso eficiente de métodos nativos da linguagem.
- Nomes de variáveis descritivos.
- Estrutura modular.

**Melhorias Sugeridas:**
- Adicione tratamento de erros (try/catch) para operações externas.
- Considere o uso de constantes para valores fixos.

**Complexidade:** O(n) - Tempo linear baseado na entrada.
**Próximo Desafio:** Tente implementar uma versão otimizada usando cache para evitar reprocessamento.`);
        toast.success('Revisão concluída!', { id: 'ada-review' });
      }, 2000);
    } catch (error) {
      toast.error('Erro na revisão da Ada.', { id: 'ada-review' });
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveSnippet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, selectedLanguage, handleRun, handleSaveSnippet]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden pt-16">
      {/* IDE Toolbar — Mobile Optimized */}
      <div className="flex items-center gap-1.5 px-3 h-12 sm:h-14 
                      border-b border-slate-200 dark:border-white/5 
                      bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none shrink-0">
        
        {/* Botão run */}
        <button 
          onClick={handleRun} 
          disabled={isLoading}
          className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg 
                     bg-emerald-500 text-white font-bold text-xs 
                     hover:bg-emerald-600 active:scale-95 transition-all 
                     disabled:opacity-50"
        >
          {isLoading 
            ? <Loader size={14} className="animate-spin" /> 
            : <Play size={14} fill="currentColor" strokeWidth={0} />}
          <span className="hidden sm:inline">Executar</span>
        </button>

        {/* Botão salvar snippet */}
        <button 
          onClick={handleSaveSnippet} 
          title="Salvar snippet"
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center 
                     bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 
                     hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <Save size={14} />
        </button>

        {/* Botão file tree (mobile only) */}
        <button 
          onClick={() => setShowFileTree(!showFileTree)}
          title="Arquivos"
          className="shrink-0 sm:hidden w-8 h-8 rounded-lg flex items-center justify-center 
                     bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <FolderOpen size={14} />
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Seletor de linguagem */}
        <select 
          value={selectedLanguage} 
          onChange={e => handleLanguageChange(e.target.value)}
          className="shrink-0 h-8 px-2 rounded-lg text-xs font-bold 
                     bg-slate-100 dark:bg-slate-800 
                     border border-slate-200 dark:border-slate-700 
                     text-slate-700 dark:text-slate-300 
                     focus:outline-none focus:border-indigo-500"
        >
          {SUPPORTED_LANGUAGES.map(l => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>

        {/* Indicador de status à direita */}
        <div className="ml-auto shrink-0 flex items-center gap-1.5">
          {isLoading && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              Running
            </span>
          )}
          {stderr && !isLoading && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              Error
            </span>
          )}
          {!stderr && !isLoading && output && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              Done
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* File Tree — drawer mobile / fixed desktop */}
        <div className={`
          absolute inset-y-0 left-0 z-20 transition-transform duration-300 
          sm:relative sm:translate-x-0 sm:w-[200px] lg:w-[240px] 
          ${showFileTree ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'} 
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 
          w-[80vw] sm:w-auto
        `}>
          <FileTree 
            snippets={snippets} 
            onSelect={(s) => { handleSelectSnippet(s); if(isMobile) setShowFileTree(false); }} 
            onNew={handleNewSnippet}
            onDelete={handleDeleteSnippet}
            isLoading={isSnippetsLoading}
          />
        </div>

        {/* Overlay escuro quando file tree aberto no mobile */}
        {showFileTree && (
          <div 
            className="absolute inset-0 z-10 bg-black/50 sm:hidden"
            onClick={() => setShowFileTree(false)}
          />
        )}

        {/* Editor + Output Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          
          {/* Editor */}
          <div className={`flex-1 overflow-hidden ${showOutput ? 'min-h-0' : 'flex-1'}`}>
            <CodeEditor
              code={code}
              language={SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage).monacoLanguage}
              onChange={setCode}
              onMount={(editor) => { editorRef.current = editor; }}
              options={{
                fontSize:    isMobile ? 13 : 14,
                lineNumbers: isMobile ? 'off' : 'on',
                minimap:     { enabled: false },
                wordWrap:    'on',
                padding:     { top: 12, bottom: 12 },
              }}
            />
          </div>
          
          {/* Toggle do console mobile */}
          <button 
            onClick={() => setShowOutput(!showOutput)}
            className="shrink-0 flex items-center justify-between px-4 h-9 
                       bg-slate-100 dark:bg-slate-800 
                       border-t border-slate-200 dark:border-white/5 
                       text-xs font-bold text-slate-600 dark:text-slate-400 
                       hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Terminal size={12} />
              <span>Console</span>
              {stderr && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </div>
            <ChevronUp size={12} className={`transition-transform ${showOutput ? '' : 'rotate-180'}`} />
          </button>

          {/* Output Panel — altura adaptativa */}
          <AnimatePresence>
            {showOutput && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: isMobile ? '40%' : 220 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 overflow-hidden border-t border-slate-200 dark:border-white/5"
              >
                <OutputPanel
                  output={output}
                  stderr={stderr}
                  executionStats={executionStats}
                  isLoading={isLoading}
                  adaReview={adaReview}
                  history={history}
                  onClear={() => { setOutput(''); setStderr(''); setExecutionStats(null); }}
                  onToggle={() => setShowOutput(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

IDE.displayName = 'IDEPage';

export default IDE;
