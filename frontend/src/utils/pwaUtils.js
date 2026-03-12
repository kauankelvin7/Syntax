/**
 * 🛰️ PWA_PROTOCOL_UTILITIES — Syntax Theme
 * * Gerenciamento de ciclo de vida do Progressive Web App.
 * - Features: Service Worker Sync, Install_Prompt Capture, Network_Telemetry.
 * - Design: High-Fidelity Logic (Silent background operations).
 */

/**
 * 🛠️ DETECT_INSTALLED_NODE
 * Verifica se o sistema está rodando como um Node dedicado (PWA Instalado).
 */
export const isInstalledPWA = () => {
  // Protocolo iOS
  if (window.navigator.standalone === true) return true;
  
  // Protocolo Android & Desktop (Standard API)
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  
  // Handshake via Referrer
  if (document.referrer.includes('android-app://')) return true;
  
  return false;
};

/**
 * 📡 NETWORK_TELEMETRY
 * Detecta se o canal de dados está offline.
 */
export const isOffline = () => !navigator.onLine;

/**
 * 🔄 ON_NETWORK_STATE_CHANGE
 * Monitora transições de estado da rede em tempo real.
 */
export const onNetworkChange = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Cleanup: Termina o listener para evitar memory leaks
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Global Buffer para evento de instalação
let deferredPrompt = null;

/**
 * 📥 CAPTURE_INSTALL_TRIGGER
 * Intercepta o evento de instalação para controle manual pela UI.
 */
export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o popup padrão do browser (Interrupt_Flag)
    e.preventDefault();
    deferredPrompt = e;
    
    // Broadcast customizado para a UI (Syntax_Dispatch)
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });
  
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
};

/**
 * 🚀 EXECUTE_INSTALL_SEQUENCE
 * Dispara o prompt de instalação do Node local.
 */
export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.warn('🛰️ PWA_PROTOCOL: Install_Prompt_Unavailable');
    return { outcome: 'unavailable' };
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  deferredPrompt = null;
  return { outcome };
};

export const canInstall = () => deferredPrompt !== null;

/**
 * ⚡ FORCE_PATCH_UPDATE
 * Força o Service Worker a buscar novos módulos no servidor.
 */
export const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
  }
  return false;
};

/**
 * 🧹 PURGE_LOCAL_CACHE
 * Limpa todos os assets cacheados (útil para Reset de Emergência).
 */
export const clearPWACache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    return true;
  }
  return false;
};

/**
 * 📊 GET_SERVICE_WORKER_TELEMETRY
 * Retorna o status atual do Kernel do PWA.
 */
export const getServiceWorkerInfo = async () => {
  if (!('serviceWorker' in navigator)) {
    return { supported: false };
  }
  
  const registration = await navigator.serviceWorker.getRegistration();
  
  if (!registration) {
    return { supported: true, registered: false };
  }
  
  return {
    supported: true,
    registered: true,
    scope: registration.scope,
    active: !!registration.active,
    waiting: !!registration.waiting,
    installing: !!registration.installing
  };
};

/**
 * 📱 OS_RECOGNITION
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

/**
 * 💡 IOS_PROMPT_CONTROL
 * Verifica se deve alertar o usuário Safari sobre a instalação manual.
 */
export const shouldShowIOSInstallBanner = () => {
  if (!isIOS() || !isSafari()) return false;
  if (isInstalledPWA()) return false;
  
  const dismissed = localStorage.getItem('ios-install-banner-dismissed');
  if (dismissed) {
    const dismissedDate = new Date(dismissed);
    const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
    // Intervalo de re-sincronização de 7 dias
    if (daysSinceDismissed < 7) return false;
  }
  
  return true;
};

export const dismissIOSInstallBanner = () => {
  localStorage.setItem('ios-install-banner-dismissed', new Date().toISOString());
};

/**
 * 🚀 INITIALIZE_PWA_SERVICES
 */
export const initPWA = () => {
  initInstallPrompt();
};

export default {
  isInstalledPWA,
  isOffline,
  onNetworkChange,
  initInstallPrompt,
  showInstallPrompt,
  canInstall,
  updateServiceWorker,
  clearPWACache,
  getServiceWorkerInfo,
  isIOS,
  isSafari,
  shouldShowIOSInstallBanner,
  dismissIOSInstallBanner,
  initPWA
};