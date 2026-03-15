import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext-firebase';
import { getGitHubConnection, connectGitHub, disconnectGitHub } from '../services/githubService';

export function useGitHub() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [connection, setConnection] = useState(null); // { token, username }
  const [isLoading, setIsLoading]   = useState(true);

  // Carregar conexão ao montar
  useEffect(() => {
    if (!uid) { setIsLoading(false); return; }
    getGitHubConnection(uid)
      .then(conn => setConnection(conn))
      .finally(() => setIsLoading(false));
  }, [uid]);

  const connect = useCallback(async () => {
    if (!uid) return;
    setIsLoading(true);
    try {
      const conn = await connectGitHub(uid);
      setConnection(conn);
      return conn;
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  const disconnect = useCallback(async () => {
    if (!uid) return;
    await disconnectGitHub(uid);
    setConnection(null);
  }, [uid]);

  return {
    isConnected: !!connection,
    username:    connection?.username,
    token:       connection?.token,
    isLoading,
    connect,
    disconnect,
  };
}
