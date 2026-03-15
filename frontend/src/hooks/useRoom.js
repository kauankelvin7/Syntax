import { useState, useEffect } from 'react';
import { subscribeToRoom, subscribeToMessages } from '../services/roomService';

/**
 * Hook para gerenciar o estado em tempo real de uma sala de estudo.
 */
export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Listener da Sala
    const unsubRoom = subscribeToRoom(
      roomId,
      (data) => {
        setRoom(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Listener das Mensagens
    const unsubMsgs = subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
    });

    // ✅ CLEANUP OBRIGATÓRIO
    return () => {
      unsubRoom();
      unsubMsgs();
    };
  }, [roomId]);

  return { room, messages, isLoading, error };
}
