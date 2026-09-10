import api from './axios';

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  librarian: () => api.get('/dashboard/librarian'),
  student: () => api.get('/dashboard/student'),
};
