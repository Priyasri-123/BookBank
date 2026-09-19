import api from './axios';

export const borrowApi = {
  request: (bookId) => api.post('/borrow-requests', { bookId }),
  getPending: () => api.get('/borrow-requests', { params: { status: 'PENDING' } }),
  getAll: () => api.get('/borrow-requests'),
  approve: (id) => api.put(`/borrow-requests/${id}/approve`),
  reject: (id) => api.put(`/borrow-requests/${id}/reject`),
  returnBook: (id) => api.put(`/borrow-transactions/${id}/return`),
  getOverdue: () => api.get('/borrow-transactions/overdue'),
  getMyHistory: () => api.get('/borrow-transactions/my-history'),
  getMyCurrent: () => api.get('/borrow-transactions/my-current'),
  getMyFines: () => api.get('/borrow-transactions/my-fines'),
  payFine: (id, txnId) => api.put(`/borrow-transactions/${id}/pay-fine`, { txnId }),
};
