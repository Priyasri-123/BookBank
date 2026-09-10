import api from './axios';

export const bookApi = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

export const bookCopyApi = {
  getForBook: (bookId) => api.get(`/book-copies/book/${bookId}`),
  add: (data) => api.post('/book-copies', data),
  updateStatus: (copyId, status) => api.put(`/book-copies/${copyId}/status`, null, { params: { status } }),
  delete: (copyId) => api.delete(`/book-copies/${copyId}`),
};
