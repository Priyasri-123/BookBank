import api from './axios';

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (key, value) => api.put(`/settings/${key}`, null, { params: { value } }),
};
