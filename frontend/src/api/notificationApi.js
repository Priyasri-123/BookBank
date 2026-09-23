import api from './axios';

export const notificationApi = {
  getMyNotifications: (type) => api.get('/notifications', { params: type ? { type } : {} }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};