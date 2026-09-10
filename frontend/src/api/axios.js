import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach the JWT token to every outgoing request, if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bookbank_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, the API returns 401 - log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('bookbank_token');
      localStorage.removeItem('bookbank_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Small helper to pull a readable message out of our backend's ErrorResponse shape.
export function getErrorMessage(error) {
  console.error('API Error Details:', {
    message: error?.message,
    code: error?.code,
    status: error?.response?.status,
    data: error?.response?.data,
    url: error?.config?.url,
    baseURL: error?.config?.baseURL,
  });
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.validationErrors) {
    const errors = error.response.data.validationErrors;
    return Object.values(errors)[0] || 'Validation failed';
  }
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
}
