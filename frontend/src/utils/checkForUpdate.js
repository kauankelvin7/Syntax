/**
 * checkForUpdate.js — Verifica se há uma nova versão do Service Worker disponível.
 */

export const checkForUpdate = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.update().catch(() => {}));
    });
  }
};
