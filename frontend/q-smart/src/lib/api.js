/* const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const Queues = {
  create: (name) => api('/api/queues', { method: 'POST', body: JSON.stringify({ name }) }),
  get: (id) => api(`/api/queues/${id}`),
  join: (id, userId) => api(`/api/queues/${id}/join`, { method: 'POST', body: JSON.stringify({ userId }) }),
  next: (id) => api(`/api/queues/${id}/next`, { method: 'POST' }),
};
 */