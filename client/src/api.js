import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally - but not on login/register pages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Only redirect if not on auth pages
      const isAuthPage = window.location.pathname === '/login' || 
                         window.location.pathname === '/register' ||
                         window.location.pathname === '/forgot-password';
      
      if (!isAuthPage) {
        localStorage.removeItem('pe_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
