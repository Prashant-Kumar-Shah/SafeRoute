import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (rawUrl && !rawUrl.endsWith('/api') && !rawUrl.endsWith('/api/')) {
  rawUrl = rawUrl.endsWith('/') ? `${rawUrl}api` : `${rawUrl}/api`;
}
const BASE_URL = rawUrl;

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 75000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — Attach Access Token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor — Auto-Refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login', data),
  me:     ()     => api.get('/auth/me'),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};

// ─── Routes ───────────────────────────────────────────────────────────────────
export const routesAPI = {
  getRoutes:  (data) => api.post('/routes', data),
  geocode:    (q)    => api.get('/routes/geocode', { params: { q } }),
};

// ─── Incidents ────────────────────────────────────────────────────────────────
export const incidentsAPI = {
  getAll:   (lat, lng, radius) => api.get('/incidents', { params: { lat, lng, radius } }),
  create:   (data)             => api.post('/incidents', data),
  confirm:  (id)               => api.post(`/incidents/${id}/confirm`),
  remove:   (id)               => api.delete(`/incidents/${id}`),
  getTypes: ()                 => api.get('/incidents/types'),
};

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const contactsAPI = {
  getAll: ()      => api.get('/contacts'),
  create: (data)  => api.post('/contacts', data),
  update: (id, d) => api.put(`/contacts/${id}`, d),
  remove: (id)    => api.delete(`/contacts/${id}`),
};

// ─── SOS ──────────────────────────────────────────────────────────────────────
export const sosAPI = {
  trigger:    (data) => api.post('/sos', data),
  getHistory: ()     => api.get('/sos/history'),
};

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
};

// ─── Safe Havens ──────────────────────────────────────────────────────────────
export const safeHavensAPI = {
  getNearby: (lat, lng) => api.get('/safe-havens', { params: { lat, lng } }),
};

export default api;
