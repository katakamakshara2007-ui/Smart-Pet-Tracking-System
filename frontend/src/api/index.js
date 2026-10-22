import axiosClient from './axiosClient';

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (userData) => axiosClient.post('/auth/register', userData),
  getProfile: () => axiosClient.get('/auth/profile'),
  updateProfile: (userData) => axiosClient.put('/auth/profile', userData),
};

export const petApi = {
  list: () => axiosClient.get('/pets'),
  create: (petData) => axiosClient.post('/pets', petData),
  get: (petId) => axiosClient.get(`/pets/${petId}`),
  update: (petId, petData) => axiosClient.put(`/pets/${petId}`, petData),
  delete: (petId) => axiosClient.delete(`/pets/${petId}`),
};

export const safeZoneApi = {
  get: (petId) => axiosClient.get(`/pets/${petId}/safezone`),
  set: (petId, zoneData) => axiosClient.post(`/pets/${petId}/safezone`, zoneData),
};

export const trackingApi = {
  submitLocation: (petId, locationData) => axiosClient.post(`/pets/${petId}/location`, locationData),
  getLatest: (petId) => axiosClient.get(`/pets/${petId}/location/latest`),
  getHistory: (petId, limit = 100) => axiosClient.get(`/pets/${petId}/location/history?limit=${limit}`),
  clearHistory: (petId) => axiosClient.delete(`/pets/${petId}/location/history`),
};

export const alertApi = {
  list: (params = {}) => axiosClient.get('/alerts', { params }),
  getForPet: (petId) => axiosClient.get(`/alerts/pet/${petId}`),
  markRead: (alertId) => axiosClient.patch(`/alerts/${alertId}/read`),
  markAllRead: () => axiosClient.post('/alerts/mark-all-read'),
  delete: (alertId) => axiosClient.delete(`/alerts/${alertId}`),
};

export const riskApi = {
  getRisk: (petId) => axiosClient.get(`/pets/${petId}/risk`),
};

export const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard/stats'),
};
