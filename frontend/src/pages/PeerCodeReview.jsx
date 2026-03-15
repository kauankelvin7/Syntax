import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, MessageSquare, Send, User, 
  CheckCircle2, AlertCircle, Zap, 
  ChevronRight, Search, Plus, Filter,
  History, Star, Clock, Info, ExternalLink,
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext-firebase';
import CodeEditor from '../components/ide/CodeEditor';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

const PeerCodeReview = () => {
  const { user } = useAuth();
  const [stage, setStage] = useState('list'); // list, create, session
  const [reviews, setReviewRequests] = useState([
    {
      id: '1',
      title: 'Otimização de Renderização React',
      topic: 'React / Performance',
      description: 'Estou com dificuldades para evitar re-renders em uma lista grande de componentes.',
      language: 'javascript',
      authorName: 'Dev Lucas',
      authorAvatar: '',
      status: 'open',
      createdAt: new Date(),
      code: `const MyList = ({ items }) => {
  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.id} data={item} />
      ))}
    </ul>
  );
};`
    },
    {
      id: '2',
      title: 'Estrutura de API Node/Express',
      topic: 'Backend / Architecture',
      description: 'Gostaria de um review sobre a organização das minhas rotas e controllers.',
      language: 'javascript',
      authorName: 'Dev Marina',
      authorAvatar: '',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000),
      code: `app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});`
    }
  ]);

  const [activeReview, setActiveReview] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  const handleStartReview = (review) => {
    setActiveReview(review);
    setStage('session');
    toast.success(`Iniciando review de: ${review.title}`);
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      userName: user?.displayName || 'Dev Anonymous',
      createdAt: new Date(),
      type: 'general'
    };

    setComments([...comments, newComment]);
    setComment('');
    toast.success('Comentário adicionado!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto overflow-x-hidden">
      <AnimatePresence mode="wait">
        {stage === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
                    <Code2 size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Peer Review</h1>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Requests: {reviews.length} Pendentes</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative group w-full sm:w-64">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Buscar por tecnologia..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                  />
                </div>
                
                <button 
                  onClick={() => toast.info('Funcionalidade de pedir review em breve!')}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-tighter text-sm shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                >
                  <Plus size={18} />
                  <span>Pedir Review</span>
                </button>
              </div>
            </header>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((rev) => (
                <motion.div
                  key={rev.id}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[28px] p-6 flex flex-col h-full shadow-xl hover:shadow-indigo-500/10 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                      {rev.topic}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                      {rev.language}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {rev.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                    {rev.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                        <User size={14} className="text-slate-400 dark:text-slate-500" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{rev.authorName}</span>
                    </div>
                    <button 
                      onClick={() => handleStartReview(rev)}
                      className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group/btn"
                    >
                      <span>Revisar Código</span>
                      <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {stage === 'session' && activeReview && (
          <motion.div
            key="session"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-[calc(100vh-120px)]"
          >
            <header className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStage('list')}
                  className="p-2 rounded-xl bg-white dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/5"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{activeReview.title}</h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Revisando código de {activeReview.authorName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                  Marcar como Revisado
                </button>
              </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
              {/* Code Area */}
              <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl relative flex flex-col">
                <div className="h-12 px-6 flex items-center justify-between bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">
                      {activeReview.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Read-Only</span>
                  </div>
                </div>
                <div className="flex-1">
                  <CodeEditor 
                    code={activeReview.code} 
                    language={activeReview.language}
                    onChange={() => {}} 
                  />
                </div>
              </div>

              {/* Chat/Comments Area */}
              <div className="w-full lg:w-[400px] flex flex-col bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-200 dark:border-white/5">
                  <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-600 dark:text-indigo-400" /> 
                    Feedback & Sugestões
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {/* Author Description */}
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-600/5 border border-indigo-100 dark:border-indigo-500/10">
                    <span className="block text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Contexto do Autor</span>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{activeReview.description}"
                    </p>
                  </div>

                  {comments.map((c) => (
                    <div key={c.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500">{c.userName}</span>
                        <span className="text-[8px] font-medium text-slate-400 dark:text-slate-600">12:45</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600 gap-4 opacity-50">
                      <Zap size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center">
                        Seja o primeiro a sugerir <br/> uma melhoria!
                      </p>
                    </div>
                  )}
                </div>

                <form onSubmit={handlePostComment} className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
                  <div className="relative group">
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Escreva sua análise técnica..."
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-4 pr-12 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all resize-none h-24 placeholder:text-slate-400 dark:placeholder:text-slate-700 font-medium"
                    />
                    <button 
                      type="submit"
                      disabled={!comment.trim()}
                      className="absolute bottom-4 right-4 p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

PeerCodeReview.displayName = 'PeerCodeReviewPage';

export default PeerCodeReview;
