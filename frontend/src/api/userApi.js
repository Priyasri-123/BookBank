import api from './axios';

export const userApi = {
  getMyProfile: () => api.get('/users/me'),
  updateMyProfile: (data) => api.put('/users/me', data),
  getAll: (keyword) => api.get('/users', { params: keyword ? { keyword } : {} }),
  getById: (id) => api.get(`/users/${id}`),
  updateStatus: (id, active) => api.put(`/users/${id}/status`, null, { params: { active } }),
  changeRole: (id, role) => api.put(`/users/${id}/role`, null, { params: { role } }),
  delete: (id) => api.delete(`/users/${id}`),
};
