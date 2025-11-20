// services/api.jsx - UPDATED WITH WORKING ENDPOINTS
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  register: (userData) => api.post("/auth/register", userData),
  getCurrentUser: () => api.get("/auth/me"),
};

// Queues API - FIXED ENDPOINTS
export const queuesAPI = {
  getAll: () => api.get("/queues"),
  getById: (id) => api.get(`/queues/${id}`),
  create: (data) => api.post("/queues", data),
  update: (id, data) => api.put(`/queues/${id}`, data),
  delete: (id) => api.delete(`/queues/${id}`),
  join: (queueId, studentInfo) =>
    api.post(`/queues/${queueId}/join`, studentInfo),
};

// Tickets API - FIXED ENDPOINTS
export const ticketsAPI = {
  getMyTickets: () => api.get("/tickets/my-tickets"),
  getTicket: (id) => api.get(`/tickets/${id}`),
  getQueueTickets: (queueId) => api.get(`/tickets/queue/${queueId}`),
  createTicket: (data) => api.post("/tickets", data),
  cancelTicket: (id) => api.put(`/tickets/${id}/cancel`),
  callNext: (queueId) => api.post(`/tickets/queue/${queueId}/call-next`),
  completeTicket: (ticketId, notes) =>
    api.put(`/tickets/${ticketId}/complete`, { notes }),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get("/admin/dashboard-stats"),
  getUsers: () => api.get("/admin/users"),
  createUser: (userData) => api.post("/admin/users", userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// teacher endpoints (ensure path matches backend)
export const teacherAPI = {
  // backend route: GET /api/queues/teacher/my-queues
  getMyQueues: (isActive = true) =>
    api.get("/queues/teacher/my-queues", {
      params: { isActive: String(isActive) },
    }),
  getPausedQueues: () =>
    api.get("/queues/teacher/my-queues", { params: { isActive: "false" } }),
  callNextTicket: (queueId) => api.post(`/queues/${queueId}/call-next`),
  // add more teacher-specific endpoints if needed
};

// analytics endpoints (add missing methods)
export const analyticsAPI = {
  getTeacherAnalytics: () => api.get("/analytics/teacher"),
  getStudentAnalytics: () => api.get("/analytics/student"),
  getParentAnalytics: () => api.get("/analytics/parent"),
  getQueueAnalytics: (queueId) => api.get(`/queues/${queueId}/analytics`),
  getSystemAnalytics: () => api.get("/admin/analytics/system"),
};

// Parent-specific API
export const parentAPI = {
  getFamilyAnalytics: () => api.get("/parent/analytics"),
  getFamilyTickets: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    return api.get(`/parent/family-tickets?${params}`);
  },
  getMyChildren: () => api.get("/parent/my-children"),
  addChild: (childData) => api.post("/parent/add-child", childData),
  joinQueueForChild: (childId, queueId) => api.post(`/parent/children/${childId}/join-queue/${queueId}`),
};

export default api;
