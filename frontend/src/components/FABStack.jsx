/**
 * FAB Stack — Wrapper para Floating Action Buttons
 * Theme: Syntax (Premium Tech)
 * Fix: Previne bloqueio de cliques invisíveis no fundo da página
 */

import React from 'react';
import { motion } from 'framer-motion';

import { Z } from '../constants/zIndex';

const FABStack = ({ children }) => (
  <motion.div 
    className="fixed flex flex-col-reverse gap-3 items-end pointer-events-none"
    style={{ 
      zIndex: Z.pomodoro,
      // bottom-20 (80px) no mobile por causa da tab bar, bottom-6 (24px) no desktop
      bottom: 'max(5rem, calc(1.5rem + env(safe-area-inset-bottom)))',
      right: 'max(1rem, env(safe-area-inset-right))',
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {/* A div interna reativa os pointer-events apenas nos botões.
      Assim, o espaço vazio entre/ao lado dos botões não bloqueia o clique no resto do app!
    */}
    <div className="flex flex-col-reverse gap-3.5 items-end pointer-events-auto">
      {children}
    </div>
  </motion.div>
);

export default FABStack;