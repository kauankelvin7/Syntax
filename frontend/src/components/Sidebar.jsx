/**
 * 🧭 SIDEBAR PREMIUM - Syntax Theme
 * * Dark mode, collapsible, sections organized like an IDE
 * * Foco em hierarquia visual, tipografia tech e active states refinados.
 */

import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  FileCode2, 
  Layers, 
  Cpu,
  Code2,
  PenTool,
  Network,
  Trophy,
  BarChart3,
  History,
  Users,
  Sparkles
} from 'lucide-react';
import Logo from './Logo';
import ProfileModal from './ProfileModal';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext-firebase';
import { useSocial } from '../features/social/context/SocialContext';

const Sidebar = memo(() => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const social = useSocial?.() || {};
  const pendingCount = social.pendingRequestsCount || 0;

  // Organização por seções (Estilo IDE / Cloud Platform)
  const menuGroups = [
    {
      title: 'Workspace',
      links: [
        { to: '/', icon: Home, label: 'Overview' },
        { to: '/amigos', icon: Users, label: 'Devs & Code Review', badge: pendingCount },
      ]
    },
    {
      title: 'Knowledge Base',
      links: [
        { to: '/materias', icon: BookOpen, label: 'Módulos' },
        { to: '/resumos', icon: FileCode2, label: 'Documentação' },
        { to: '/flashcards', icon: Layers, label: 'Code Flashcards' },
      ]
    },
    {
      title: 'Dev Tools',
      links: [
        { to: '/simulado', icon: Cpu, label: 'Testes Técnicos & IA' },
        { to: '/atlas-3d', icon: Network, label: 'System Design' },
        { to: '/consulta-rapida', icon: Code2, label: 'Snippets Rápidos' },
      ]
    },
    {
      title: 'Performance',
      links: [
        { to: '/analytics', icon: BarChart3, label: 'Métricas' },
        { to: '/conquistas', icon: Trophy, label: 'Conquistas' },
        { to: '/historico-simulados', icon: History, label: 'Logs de Testes' },
      ]
    }
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-[264px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col z-50 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        
        {/* Branding Area */}
        <div className="px-6 py-8">
          <Logo size="small" />
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-7 pb-8" role="navigation">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500/80">
                {group.title}
              </h3>
              
              <div className="space-y-1">
                {group.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[13px] font-bold transition-all duration-300 border ${
                        isActive
                          ? 'bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-cyan-400 border-indigo-100/50 dark:border-indigo-800/50 shadow-sm'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Indicador de arquivo ativo estilo IDE */}
                        {isActive && (
                          <motion.div 
                            layoutId="activeSidebarIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-500 dark:bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        <link.icon 
                          size={18} 
                          strokeWidth={isActive ? 2.5 : 2} 
                          className={`shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-cyan-400' : ''}`} 
                        />
                        <span className="flex-1 truncate">{link.label}</span>
                        
                        {/* Badge de Notificações */}
                        {link.badge > 0 && (
                          <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-md bg-rose-500 text-white text-[10px] font-black shadow-lg shadow-rose-500/20">
                            {link.badge > 9 ? '9+' : link.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Profile Section */}
        <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="bg-white dark:bg-slate-800/80 rounded-[18px] p-1 shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
            <UserMenu onOpenProfile={() => setIsProfileOpen(true)} />
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            <Sparkles size={10} className="text-cyan-500" />
            Syntax OS v2.0
          </div>
        </div>
      </aside>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      {/* CSS para a Scrollbar da Sidebar (Mais limpa e fina) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { 
          width: 4px; 
        }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(148, 163, 184, 0.2); 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(148, 163, 184, 0.4); 
        }
      `}</style>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;