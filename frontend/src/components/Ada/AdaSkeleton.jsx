/**
 * ADA SKELETON — Loading state para o Chat da IA
 * Simula a interface carregando com aspecto de "Dev Tool"
 */

import React from 'react';

const AdaSkeleton = () => (
  <div className="flex flex-col gap-6 animate-pulse w-full max-w-4xl mx-auto p-2 sm:p-4">
    
    {/* Esqueleto: Mensagem Curta do Bot (Ada) */}
    <div className="flex items-start gap-3 w-full">
      {/* Avatar Ada (Tons de Ciano/Indigo) */}
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex-shrink-0 mt-1 border border-indigo-200/50 dark:border-indigo-700/30" />
      
      <div className="flex flex-col gap-1.5 w-full max-w-[85%] sm:max-w-[70%]">
        {/* Nome ADA */}
        <div className="h-3 w-10 rounded-full bg-slate-200 dark:bg-slate-700/60 ml-1" />
        
        {/* Balão do Bot com linhas de texto falsas */}
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/30 w-full">
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700/50" />
          <div className="h-2.5 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700/50" />
        </div>
      </div>
    </div>

    {/* Esqueleto: Mensagem do Usuário */}
    <div className="flex items-start gap-3 flex-row-reverse w-full">
      {/* Avatar Usuário */}
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700/50 flex-shrink-0 mt-1" />
      
      {/* Balão do Usuário (Destaque sutil) */}
      <div className="flex flex-col gap-2 p-4 rounded-2xl rounded-tr-sm bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 w-[80%] sm:w-[60%]">
        <div className="h-2.5 w-full rounded-full bg-indigo-200/50 dark:bg-indigo-800/50" />
        <div className="h-2.5 w-2/3 rounded-full bg-indigo-200/50 dark:bg-indigo-800/50" />
      </div>
    </div>

    {/* Esqueleto: Mensagem Longa do Bot (Simulando Bloco de Código/Explicação técnica) */}
    <div className="flex items-start gap-3 w-full">
      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex-shrink-0 mt-1 border border-indigo-200/50 dark:border-indigo-700/30" />
      
      <div className="flex flex-col gap-1.5 w-full max-w-[92%] sm:max-w-[85%]">
        <div className="h-3 w-10 rounded-full bg-slate-200 dark:bg-slate-700/60 ml-1" />
        
        <div className="flex flex-col gap-3 p-4 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/30 w-full">
          <div className="h-2.5 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700/50" />
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700/50" />
          
          {/* Fake Code Block (Área escura simulando código) */}
          <div className="h-24 w-full rounded-lg bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300/50 dark:border-slate-700/30 mt-2 p-3 flex flex-col gap-2">
            <div className="h-2 w-1/3 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="h-2 w-1/2 rounded-full bg-slate-300 dark:bg-slate-700 ml-4" />
            <div className="h-2 w-2/5 rounded-full bg-slate-300 dark:bg-slate-700 ml-4" />
            <div className="h-2 w-1/4 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>
          
          <div className="h-2.5 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700/50 mt-1" />
        </div>
      </div>
    </div>
    
  </div>
);

export default AdaSkeleton;