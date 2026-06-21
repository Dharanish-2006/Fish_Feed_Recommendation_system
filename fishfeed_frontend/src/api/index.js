import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }
      original._retry = true;
      isRefreshing = true;
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh,
        });
        localStorage.setItem('access_token', data.access);
        api.defaults.headers.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

export const speciesApi = {
  list: (params) => api.get('/species/', { params }),
  detail: (id) => api.get(`/species/${id}/`),
  create: (data) => api.post('/species/admin/create/', data),
  update: (id, data) => api.patch(`/species/admin/${id}/`, data),
  delete: (id) => api.delete(`/species/admin/${id}/`),
};

export const feedsApi = {
  list: (params) => api.get('/feeds/', { params }),
  detail: (id) => api.get(`/feeds/${id}/`),
  myFeeds: (params) => api.get('/feeds/my/', { params }),
  create: (data) => api.post('/feeds/my/', data),
  update: (id, data) => api.patch(`/feeds/my/${id}/`, data),
  delete: (id) => api.delete(`/feeds/my/${id}/`),
  updateInventory: (id, data) => api.post(`/feeds/my/${id}/inventory/`, data),
  inventoryLogs: (id) => api.get(`/feeds/my/${id}/inventory/logs/`),
};

export const farmsApi = {
  list: () => api.get('/farms/'),
  create: (data) => api.post('/farms/', data),
  update: (id, data) => api.patch(`/farms/${id}/`, data),
  delete: (id) => api.delete(`/farms/${id}/`),
  stocks: (farmId) => api.get(`/farms/${farmId}/stocks/`),
  createStock: (farmId, data) => api.post(`/farms/${farmId}/stocks/`, data),
  updateStock: (id, data) => api.patch(`/farms/stocks/${id}/`, data),
  deleteStock: (id) => api.delete(`/farms/stocks/${id}/`),
  feedingHistory: (params) => api.get('/farms/feeding-history/', { params }),
  addFeeding: (data) => api.post('/farms/feeding-history/', data),
};

export const recommendationsApi = {
  generate: (fish_stock_id) =>
    api.post('/recommendations/generate/', { fish_stock_id }),
  list: (params) => api.get('/recommendations/', { params }),
  detail: (id) => api.get(`/recommendations/${id}/`),
  latestForStock: (stockId) =>
    api.get(`/recommendations/stock/${stockId}/latest/`),
};

export const analyticsApi = {
  farmerDashboard: () => api.get('/analytics/farmer/dashboard/'),
  supplierDashboard: () => api.get('/analytics/supplier/dashboard/'),
  adminDashboard: () => api.get('/analytics/admin/dashboard/'),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications/', { params }),
  unreadCount: () => api.get('/notifications/unread-count/'),
  markRead: (id) =>
    id
      ? api.post(`/notifications/${id}/mark-read/`)
      : api.post('/notifications/mark-read/'),
};

export const adminApi = {
  users: (params) => api.get('/auth/users/', { params }),
  userDetail: (id) => api.get(`/auth/users/${id}/`),
  updateUser: (id, data) => api.patch(`/auth/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}/`),
};

export default api;
