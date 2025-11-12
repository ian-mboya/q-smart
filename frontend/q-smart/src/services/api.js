/* import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Queues API
export const queuesAPI = {
  getAll: () => api.get('/queues'),
  getOne: (id) => api.get(`/queues/${id}`),
  join: (id, studentInfo) => api.post(`/queues/${id}/join`, { studentInfo }),
  callNext: (id) => api.post(`/queues/${id}/call-next`),
  getAnalytics: (id) => api.get(`/queues/${id}/analytics`),
};

// Tickets API
export const ticketsAPI = {
  getMyTickets: () => api.get('/tickets/my-tickets'),
  getMyTicket: (queueId) => api.get(`/tickets/my-ticket?queue=${queueId}`),
  getTicket: (id) => api.get(`/tickets/${id}`),
  cancelTicket: (id) => api.patch(`/tickets/${id}/cancel`),
};

export default api; */