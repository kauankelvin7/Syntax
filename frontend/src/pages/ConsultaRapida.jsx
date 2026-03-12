/**
 * 📚 SYNTAX HANDBOOK (Consulta Rápida) — Syntax Theme
 * * Centro de Referência Tática para Engenharia de Software.
 * - Dados: HTTP Status, Git Pro-tips, Complexity, API Standards.
 * - UI: IDE-Like Expansion (Squircles & Glassmorphism).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Terminal,
  Activity,
  Cpu,
  ChevronDown,
  ChevronRight,
  Search,
  BookOpen,
  Lightbulb,
  Code2,
  GitBranch,
  Globe,
  Shield,
  Layers,
  Zap,
  Box,
  Braces
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   DATA STRUCTURE (Handbooks de Engenharia)
═══════════════════════════════════════════════════════ */

const HANDBOOK_DATA = {
  httpStatus: {
    titulo: 'HTTP_Status_Codes',
    icon: Globe,
    cor: 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50',
    headers: ['Code', 'Type', 'Meaning'],
    dados: [
      { code: '200', type: 'Success', meaning: 'OK: A requisição foi bem-sucedida.' },
      { code: '201', type: 'Success', meaning: 'Created: Recurso criado com sucesso.' },
      { code: '400', type: 'Client Error', meaning: 'Bad Request: Sintaxe inválida no cliente.' },
      { code: '401', type: 'Client Error', meaning: 'Unauthorized: Falha na autenticação.' },
      { code: '403', type: 'Client Error', meaning: 'Forbidden: Acesso negado pelo servidor.' },
      { code: '404', type: 'Client Error', meaning: 'Not Found: Recurso não localizado.' },
      { code: '500', type: 'Server Error', meaning: 'Internal Error: Falha interna no servidor.' },
      { code: '503', type: 'Server Error', meaning: 'Service Unavailable: Servidor sobrecarregado.' },
    ]
  },
  gitFlow: {
    titulo: 'Git_Commands_Hub',
    icon: GitBranch,
    cor: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
    headers: ['Command', 'Action'],
    dados: [
      { cmd: 'git checkout -b <name>', action: 'Cria e muda para uma nova branch.' },
      { cmd: 'git commit --amend', action: 'Modifica o último commit local.' },
      { cmd: 'git rebase main', action: 'Reaplica commits da branch atual sobre a main.' },
      { cmd: 'git reset --soft HEAD~1', action: 'Desfaz o commit mantendo as alterações.' },
      { cmd: 'git stash pop', action: 'Recupera alterações salvas temporariamente.' },
    ]
  },
  complexity: {
    titulo: 'Algorithm_Complexity (Big O)',
    icon: Activity,
    cor: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    headers: ['Notation', 'Name', 'Performance'],
    dados: [
      { bigo: 'O(1)', name: 'Constant', perf: 'Excellent (Instant)' },
      { bigo: 'O(log n)', name: 'Logarithmic', perf: 'Great (Efficient search)' },
      { bigo: 'O(n)', name: 'Linear', perf: 'Fair (Iterative loops)' },
      { bigo: 'O(n log n)', name: 'Linearithmic', perf: 'Normal (Fast sorting)' },
      { bigo: 'O(n²)', name: 'Quadratic', perf: 'Poor (Nested loops)' },
    ]
  },
  cleanCode: {
    titulo: 'Clean_Code_Principles',
    icon: Shield,
    cor: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    headers: ['Concept', 'Best Practice'],
    dados: [
      { concept: 'KISS', best: 'Keep It Simple, Stupid (Evite complexidade desnecessária).' },
      { concept: 'DRY', best: 'Don\'t Repeat Yourself (Extraia lógica repetida em funções).' },
      { concept: 'YAGNI', best: 'You Ain\'t Gonna Need It (Não implemente o que não usará agora).' },
      { concept: 'SoC', best: 'Separation of Concerns (Separe responsabilidades de classes).' },
    ]
  }
};

// ===================== UI COMPONENTS =====================

const AccordionItem = ({ item, isOpen, onToggle, children }) => {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[28px] border-2 border-slate-100 dark:border-slate-800 overflow-hidden mb-4 transition-all"
    >
      <button onClick={onToggle} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border shadow-sm ${item.cor}`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase italic">{item.titulo}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Table = ({ headers, children }) => (
  <div className="overflow-hidden rounded-[18px] border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-inner">
    <table className="w-full text-sm border-collapse">
      <thead className="bg-slate-50 dark:bg-slate-900">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-5 py-4 text-left font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
        {children}
      </tbody>
    </table>
  </div>
);

// ===================== MAIN COMPONENT =====================

export default function ConsultaRapida() {
  const [openSections, setOpenSections] = useState(['httpStatus']);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (id) => setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const filteredData = (key) => {
    const section = HANDBOOK_DATA[key];
    const q = searchTerm.toLowerCase();
    return section.dados.filter(d => 
      Object.values(d).some(v => v.toString().toLowerCase().includes(q))
    );
  };

  return (
    <div className="min-h-screen pb-32 pt-10 px-4 bg-slate-50/30 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Premium */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-[22px] flex items-center justify-center shadow-2xl shrink-0 border-2 border-white/20">
              <Terminal size={32} className="text-white dark:text-slate-900" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-1">Handbook_v2.0</h1>
              <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center sm:justify-start gap-2">
                <Braces size={14} className="text-indigo-500" /> API Standards & Code References
              </p>
            </div>
          </div>

          <div className="mt-8 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
            <input
              type="text" placeholder="Probe system references... (Ex: git, 404, Big O)"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 h-16 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[22px] text-slate-900 dark:text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-sm group-hover:border-slate-200 dark:group-hover:border-slate-700"
            />
          </div>
        </motion.div>

        {/* Accordions */}
        <div className="space-y-4">
          {Object.keys(HANDBOOK_DATA).map(key => {
            const section = HANDBOOK_DATA[key];
            const data = filteredData(key);
            if (searchTerm && data.length === 0) return null;

            return (
              <AccordionItem 
                key={key} item={section} 
                isOpen={openSections.includes(key) || (searchTerm && data.length > 0)}
                onToggle={() => toggleSection(key)}
              >
                <Table headers={section.headers}>
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                      {Object.values(row).map((val, idx) => (
                        <td key={idx} className={`px-5 py-4 ${idx === 0 ? 'font-black font-mono text-cyan-600 dark:text-cyan-400 text-[14px]' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Table>
              </AccordionItem>
            );
          })}
        </div>

        {/* Tip Hub */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-12 p-6 bg-indigo-600 rounded-[28px] text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Zap size={80} strokeWidth={1} /></div>
          <div className="flex items-start gap-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0"><Lightbulb size={24} /></div>
            <div>
              <p className="font-black uppercase tracking-widest text-[11px] mb-2 opacity-80">Software_Architect_ProTip</p>
              <p className="text-[14px] font-bold leading-relaxed">
                Utilize o comando <code className="bg-black/20 px-1.5 py-0.5 rounded font-mono">CTRL + K</code> (ou use a barra de busca acima) para localizar telemetrias e códigos de status instantaneamente durante o desenvolvimento.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}