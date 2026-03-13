/**
 * @file AuthContext-firebase.jsx
 * @description Contexto de autenticação do sistema. Provê o estado do usuário logado
 * e métodos de login/logout para toda a aplicação via React Context.
 *
 * @dependencies
 *  - Firebase Auth (onAuthStateChanged, signInWithEmailAndPassword, etc.)
 *  - firebase-config.js — instâncias `auth` e `googleProvider`
 *
 * @sideEffects
 *  - Persiste dados do usuário no localStorage (chave: 'user') para restaurar sessão após refresh
 *  - Ouve `onAuthStateChanged` continuamente enquanto o app estiver montado
 *
 * @notes
 *  - O JWT token do Firebase é refreshado automaticamente pelo SDK quando expira (~1h)
 *  - O campo `user.uid` (ou `user.id`) é o identificador principal usado em todas as queries Firestore
 *  - `loading: true` enquanto o estado inicial de auth não foi determinado — use para evitar flicker
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase-config';

const AuthContext = createContext(null);

/**
 * Hook de acesso ao contexto de autenticação.
 * WARN: deve ser usado dentro de um `<AuthProvider>` — lança erro se chamado fora.
 *
 * @returns {object} { user, token, loading, login, register, loginWithGoogle, logout, isAuthenticated }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Ouve mudanças de estado de autenticação do Firebase (login, logout, expiração de token)
    // NOTE: `onAuthStateChanged` é disparado também no carregamento inicial da página
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário está logado — busca o JWT mais recente
        const idToken = await firebaseUser.getIdToken();

        // Normaliza o objeto de usuário exposto pelo contexto
        // NOTE: `id` e `uid` são sinônimos aqui — ambos expostos para compatibilidade com código legado
        const userData = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        };
        
        setUser(userData);
        setToken(idToken);
        // Persiste localmente para restaurar UI instantâneamente no próximo carregamento
        // WARN: o localStorage não substitui o estado real do Firebase — use apenas para UI inicial
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Usuário deslogado ou sessão expirada
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    // Listener para eventos customizados de recarga de perfil (ex: após updateProfile)
    const handleReload = () => {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    };

    window.addEventListener('cinesia:user:reload', handleReload);

    return () => {
      unsubscribe();
      window.removeEventListener('cinesia:user:reload', handleReload);
    };
  }, []);

  // Timeout de segurança — se o Firebase não responder em 10s,
  // força loading false para não travar o app eternamente
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          // eslint-disable-next-line no-console
          console.warn('[AUTH] Timeout de segurança ativado — Firebase não respondeu em 10s');
          return false;
        }
        return prev;
      });
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);

  /**
   * Autentica o usuário com email e senha.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    }
  };

  /**
   * Cria uma nova conta e autentica o usuário.
   * Atualiza o displayName do perfil Firebase após o cadastro.
   *
   * @param {string} nome     - Nome exibido no perfil
   * @param {string} email
   * @param {string} password - Mínimo 6 caracteres (regra do Firebase Auth)
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const register = async (nome, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualiza o perfil com o nome
      await updateProfile(userCredential.user, {
        displayName: nome
      });
      
      const idToken = await userCredential.user.getIdToken();
      
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    }
  };

  /**
   * Autentica com conta Google via popup OAuth2.
   * NOTE: usa `googleProvider` configurado com `prompt: 'select_account'`
   *       para sempre exibir o seletor de conta, mesmo com sessão já ativa.
   *
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Erro no login com Google:', error);
      return { 
        success: false, 
        error: getErrorMessage(error.code) 
      };
    }
  };

  /**
   * Encerra a sessão do usuário e navega para /login.
   * O `onAuthStateChanged` acima limpa automaticamente o estado após o signOut.
   */
  const logout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  /**
   * Traduz códigos de erro do Firebase Auth para mensagens amigáveis em português.
   *
   * @param {string} errorCode - Código de erro no formato 'auth/codigo-do-erro'
   * @returns {string} Mensagem de erro legivel pelo usuário
   */
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'Auth_Error: Este email já está cadastrado no sistema.',
      'auth/invalid-email': 'Protocol_Fault: Email inválido ou malformado.',
      'auth/operation-not-allowed': 'Access_Denied: Operação não permitida pelo servidor.',
      'auth/weak-password': 'Security_Warning: A senha deve ter pelo menos 6 caracteres.',
      'auth/user-disabled': 'Account_Locked: Esta conta foi desabilitada pelo administrador.',
      'auth/user-not-found': 'Credential_Mismatch: Email ou senha incorretos.',
      'auth/wrong-password': 'Credential_Mismatch: Email ou senha incorretos.',
      'auth/invalid-credential': 'Handshake_Failed: Credenciais inválidas.',
      'auth/too-many-requests': 'Rate_Limit: Muitas tentativas. Tente novamente mais tarde.',
      'auth/popup-closed-by-user': 'Session_Aborted: Login cancelado pelo usuário.',
      'auth/cancelled-popup-request': 'Session_Aborted: Login cancelado.',
      'auth/unauthorized-domain': 'Domain_Error: Domínio não autorizado no Firebase Auth.'
    };

    return errorMessages[errorCode] || 'System_Error: Falha na autenticação. Tente novamente.';
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
