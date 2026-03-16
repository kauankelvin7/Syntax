/**
 * validateEnv.js — Valida variáveis de ambiente obrigatórias antes do mount.
 */

const REQUIRED_VARS = [
  'VITE_GEMINI_API_KEY',
  'VITE_FIREBASE_API_KEY',
];

export const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.warn(
      `[validateEnv] Variáveis de ambiente ausentes: ${missing.join(', ')}\n` +
      'Verifique seu arquivo .env'
    );
  }
};
