/**
 * 🚀 MAIN BOOTLOADER (Entry Point) — Syntax Theme
 * * Inicialização do Kernel da aplicação e gerenciamento de Service Workers.
 * - Features: Environment Validation, PWA Auto-Update, Splash-Exit logic.
 * - Design: High-Fidelity Performance Boot.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './utils/deviceLayout.js';
import { validateEnv } from './utils/validateEnv';
import { registerSW } from 'virtual:pwa-register';

/* ═══════════════════════════════════════════
   PWA_SERVICE_WORKER_PROTOCOL
   ═══════════════════════════════════════════ */
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Protocolo de Hot-Reload quando novos módulos são detectados
    updateSW(true);
  },
  onOfflineReady() {
    console.log('🛰️ SYSTEM_STATUS: Local_Node_Ready (Offline Mode Enabled)');
  }
});

/* ═══════════════════════════════════════════
   PRE-FLIGHT_CHECKLIST
   ═══════════════════════════════════════════ */

// Valida variáveis de ambiente (API Keys, Endpoints) antes do Mount
validateEnv();

// Verificação periódica de patches (Updates) a cada 30s
import { checkForUpdate } from './utils/checkForUpdate';
setInterval(() => {
  checkForUpdate();
}, 30000);

/* ═══════════════════════════════════════════
   MOUNT_APPLICATION_KERNEL
   ═══════════════════════════════════════════ */

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/* ═══════════════════════════════════════════
   SPLASH_EXIT_SEQUENCE
   ═══════════════════════════════════════════ */
// Aguarda o frame de renderização do React para remover a camada de boot
window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    const splash = document.getElementById('pwa-splash');
    if (splash) {
      // Efeito de fade-out tático
      splash.style.transition = 'opacity 500ms cubic-bezier(0.23, 1, 0.32, 1), visibility 500ms';
      splash.style.opacity = '0';
      splash.style.visibility = 'hidden';
      
      setTimeout(() => {
        splash.remove();
        console.log('⚡ SYSTEM_BOOT: UI_Layer_Injected_Successfully');
      }, 500); 
    }
  });
});