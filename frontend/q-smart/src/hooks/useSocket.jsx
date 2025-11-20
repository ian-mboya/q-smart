import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// SOCKET URL resolution: prefer explicit VITE_WS_URL, fall back to API host or current origin
const SOCKET_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : window.location.origin);

/**
 * useSocket
 * - Connects once, keeps socket in ref
 * - Accepts optional token to send as auth
 * - Returns helpers: socketRef.current, connected, on, off, emit
 */
export default function useSocket({ token = null, options = {} } = {}) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // create socket with auth token (if available)
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: token ? { token } : undefined,
      ...options,
    });

    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', (err) => {
      // you can log or surface errors as needed
      console.warn('Socket connect_error', err);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // reconnect when token changes

  const emit = useCallback((event, ...args) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, ...args);
  }, []);

  const on = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
    off,
  };
}