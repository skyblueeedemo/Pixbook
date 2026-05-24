import axios from 'axios';
import router from '@/router';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Request interceptor — inject JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      const redirect = router.currentRoute.value.fullPath;
      router.push({ name: 'Login', query: { redirect } });
    }
    return Promise.reject(err);
  },
);

export default api;
