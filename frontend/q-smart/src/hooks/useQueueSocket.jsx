import { useEffect } from 'react';
import useSocket from './useSocket';
import api from '../services/api';

/**
 * useQueueSocket
 * - joins/leaves a queue room
 * - attaches common ticket/queue event handlers
 *
 * handlers: {
 *   onTicketCreated, onTicketUpdated, onTicketCalled, onQueueUpdated
 * }
 */
export default function useQueueSocket(queueId, handlers = {}, opts = {}) {
  const token = localStorage.getItem('token') || null;
  const { socket, connected, emit, on, off } = useSocket({ token, options: opts });

  useEffect(() => {
    if (!socket || !queueId) return;

    // Attempt to join queue room - adapt event name to backend (joinQueue/join-room ...)
    emit('joinQueue', { queueId });

    const ticketCreated = (payload) => handlers.onTicketCreated?.(payload);
    const ticketUpdated = (payload) => handlers.onTicketUpdated?.(payload);
    const ticketCalled = (payload) => handlers.onTicketCalled?.(payload);
    const queueUpdated = (payload) => handlers.onQueueUpdated?.(payload);

    on('ticket-created', ticketCreated);
    on('ticket-updated', ticketUpdated);
    on('ticket-called', ticketCalled);
    on('queue-updated', queueUpdated);

    return () => {
      off('ticket-created', ticketCreated);
      off('ticket-updated', ticketUpdated);
      off('ticket-called', ticketCalled);
      off('queue-updated', queueUpdated);
      // leave room
      emit('leaveQueue', { queueId });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, queueId]);

  return { socket, connected, emit, on, off };
}