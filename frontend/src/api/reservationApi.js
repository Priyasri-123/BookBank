import api from './axios';

export const reservationApi = {
  reserve: (bookId) => api.post('/reservations', { bookId }),
  getAll: () => api.get('/reservations'),
  cancel: (id) => api.delete(`/reservations/${id}`),
};
