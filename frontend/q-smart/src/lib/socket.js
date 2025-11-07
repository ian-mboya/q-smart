/* import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, { withCredentials: true });
  }
  return socket;
}

export function joinQueueRoom(queueId) {
  const s = getSocket();
  s.emit('join-room', `queue:${queueId}`);
}
 */