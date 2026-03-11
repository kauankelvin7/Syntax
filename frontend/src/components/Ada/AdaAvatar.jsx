/**
 * ADA AVATAR — Assistente de IA do Sistema Syntax
 * Design System: Tech / Cyber / Minimalist
 */

import React from 'react';
import { Cpu } from 'lucide-react'; // Alterado de Dna para Cpu (Cérebro Digital / Hardware)
import { motion } from 'framer-motion';

const sizes = {
  sm: { container: 'w-8 h-8', icon: 16, status: 'w-2.5 h-2.5' },
  md: { container: 'w-11 h-11', icon: 20, status: 'w-3 h-3' },
  lg: { container: 'w-[58px] h-[58px]', icon: 26, status: 'w-3.5 h-3.5' },
};

const AdaAvatar = ({ size = 'md', speaking = false, showStatus = false }) => {
  const s = sizes[size];

  return (
    <div className={`relative flex-shrink-0 ${s.container}`}>
      {/* Anel pulsante estilo "Processamento de IA" quando a Ada está respondendo */}
      {speaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          animate={{ 
            scale: [1, 1.35, 1], 
            opacity: [0.5, 0, 0.5] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
      )}

      {/* Avatar Principal - Tema Deep Tech (Indigo + Cyan) */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center shadow-lg relative z-10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #06b6d4 100%)',
          border: size === 'md' 
            ? '1.5px solid rgba(255,255,255,0.2)' 
            : '1px solid rgba(255,255,255,0.15)',
          boxShadow: 'inset 0 0 12px rgba(6, 182, 212, 0.5), 0 4px 10px rgba(79, 70, 229, 0.3)',
        }}
      >
        <Cpu size={s.icon} color="#fff" strokeWidth={2} className="drop-shadow-md" />
      </div>

      {/* Bolinha de status online (Verde Neon vibrante ajustado ao tamanho) */}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 border-2 border-white dark:border-slate-900 rounded-full bg-emerald-400 z-20 ${s.status}`}
          style={{ 
            boxShadow: '0 0 10px rgba(52,211,153,0.8)' 
          }}
        />
      )}
    </div>
  );
};

export default AdaAvatar;