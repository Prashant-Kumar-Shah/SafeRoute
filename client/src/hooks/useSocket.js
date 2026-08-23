import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const useSocket = (userId) => {
  const connected = useRef(false);

  useEffect(() => {
    if (!userId) return;

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      connected.current = true;
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      connected.current = false;
    });

    return () => {
      socket?.disconnect();
      socket = null;
      connected.current = false;
    };
  }, [userId]);

  const emitPosition = useCallback((lat, lng) => {
    if (socket?.connected && userId) {
      socket.emit('position:update', { userId, lat, lng });
    }
  }, [userId]);

  return { emitPosition, socket };
};
