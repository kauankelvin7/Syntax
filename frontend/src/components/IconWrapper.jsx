/**
 * 🔍 IconWrapper Premium - Componente seguro e animado para ícones
 * Theme: Syntax (Software Engineering)
 * * Previne erros de renderização e padroniza o visual do sistema.
 * * Fallback atualizado para o tema Dev (Terminal).
 */

import React from 'react';
import { Terminal } from 'lucide-react'; // Trocado de BookOpen para Terminal
import { motion } from 'framer-motion';

const IconWrapper = ({ 
  icon: Icon, 
  fallbackIcon: FallbackIcon = Terminal, // Fallback tech
  className = '', 
  size = 20, 
  strokeWidth = 2,
  animate = false, // Ativa animações de entrada/interação
  ...props 
}) => {
  
  // Lógica de renderização segura (Graceful Degradation)
  const renderIcon = (Component) => {
    try {
      return (
        <Component 
          className={className} 
          size={size} 
          strokeWidth={strokeWidth} 
          {...props} 
        />
      );
    } catch (error) {
      console.warn('Erro ao renderizar ícone:', error);
      return (
        <FallbackIcon 
          className={className} 
          size={size} 
          strokeWidth={strokeWidth} 
          {...props} 
        />
      );
    }
  };

  // Se o ícone não for válido, retorna o fallback imediatamente
  if (!Icon || typeof Icon !== 'function') {
    return renderIcon(FallbackIcon);
  }

  // Se 'animate' for true, envolvemos em motion para efeitos premium
  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }} // Animação elástica Premium
        className="inline-flex items-center justify-center cursor-pointer"
      >
        {renderIcon(Icon)}
      </motion.div>
    );
  }

  return renderIcon(Icon);
};

export default IconWrapper;