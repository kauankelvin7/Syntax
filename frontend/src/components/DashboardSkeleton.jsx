/**
 * 💀 DASHBOARD SKELETON - Loading State Premium v2.0
 * Theme: Syntax (Software Engineering)
 * * Skeleton screens refinados para combinar com a nova UI tech e arredondada.
 * Evita o "pulo" visual e mantém a identidade Syntax durante o load.
 */

import React from 'react';

const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 rounded-[24px] p-6 shadow-sm ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {/* Título do Card */}
          <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded-full w-20 mb-4"></div>
          {/* Número Grande */}
          <div className="h-10 bg-slate-200 dark:bg-slate-700/80 rounded-[12px] w-16"></div>
        </div>
        {/* Ícone */}
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-[14px]"></div>
      </div>
      {/* Progress Bar ou Subtítulo */}
      <div className="h-2 bg-slate-100 dark:bg-slate-700/40 rounded-full w-full mt-2"></div>
    </div>
  </div>
);

const SkeletonMateriaCard = () => (
  <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40 rounded-[20px] p-5 relative overflow-hidden">
    {/* Faixa lateral brilhante simulada */}
    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-slate-200 dark:bg-slate-700/50 animate-pulse"></div>
    
    <div className="animate-pulse pl-2">
      <div className="flex items-center gap-4 mb-4">
        {/* Ícone da Matéria */}
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/80 rounded-[14px]"></div>
        <div className="flex-1">
          {/* Nome da Matéria */}
          <div className="h-5 bg-slate-200 dark:bg-slate-700/80 rounded-lg w-3/4 mb-3"></div>
          {/* Tags/Pílulas (ex: 20 cards) */}
          <div className="flex gap-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded-full w-16"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded-full w-20"></div>
          </div>
        </div>
      </div>
      {/* Progress Bar da Matéria */}
      <div className="w-full bg-slate-100 dark:bg-slate-700/40 rounded-full h-1.5 mt-2"></div>
    </div>
  </div>
);

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen pb-32 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500">
      {/* Header Skeleton Premium */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-5 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4 animate-pulse">
              {/* Avatar do Usuário */}
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-full border-2 border-white dark:border-slate-800"></div>
              <div className="flex-1">
                {/* Saudação ("Bom dia, Dev") */}
                <div className="h-8 bg-slate-200 dark:bg-slate-700/80 rounded-[10px] w-56 mb-2"></div>
                {/* Frase motivacional tech */}
                <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full w-80"></div>
              </div>
            </div>
            {/* Botão de Ação / Streak */}
            <div className="w-36 h-12 bg-slate-100 dark:bg-slate-800/80 rounded-[16px] animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton Area */}
      <div className="max-w-[1280px] mx-auto px-5 py-8 sm:py-10">
        
        {/* Quick Stats Grid (Cards de KPI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Left Area: Matérias / Módulos List */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[28px] p-6 sm:p-8 shadow-sm">
              <div className="animate-pulse mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-[10px]"></div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-700/80 rounded-md w-32"></div>
                </div>
                <div className="h-6 bg-slate-100 dark:bg-slate-700/50 rounded-full w-20"></div>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonMateriaCard key={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Area: Sidebar Widgets (Agenda / Ada) */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* Widget 1 (Ex: Agenda) */}
            <div className="bg-white/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-[28px] p-6 sm:p-8 shadow-sm">
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-[10px]"></div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-700/80 rounded-md w-28"></div>
                </div>
                
                {/* Linhas simulando os eventos da agenda */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700/50 rounded-[10px]"></div>
                      <div className="flex-1">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-700/80 rounded-md w-full mb-2"></div>
                        <div className="h-2.5 bg-slate-100 dark:bg-slate-700/40 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Widget 2 (Ex: Produção Mensal / Dica) */}
            <div className="h-44 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30 rounded-[28px] animate-pulse p-6 flex flex-col justify-between">
              <div className="h-5 bg-slate-200 dark:bg-slate-700/80 rounded-md w-1/2"></div>
              <div className="flex items-end justify-between">
                <div className="h-12 bg-slate-200 dark:bg-slate-700/80 rounded-xl w-1/3"></div>
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700/60 rounded-full"></div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;