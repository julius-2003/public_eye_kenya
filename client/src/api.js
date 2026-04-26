import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://public-eye-kenya.onrender.com/api',
  timeout: 15000, // 15 second timeout to avoid hanging requests
});

let navigateToLogin = null;

// Function to set navigate (called from App)
export const setNavigateToLogin = (navigate) => {
  navigateToLogin = navigate;
};

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Handle auth errors
    if (err.response?.status === 401) {
      // Only redirect if not on auth pages
      const isAuthPage = window.location.pathname === '/login' || 
                         window.location.pathname === '/register' ||
                         window.location.pathname === '/forgot-password' ||
                         window.location.pathname === '/verify-email' ||
                         window.location.pathname === '/';
      
      if (!isAuthPage) {
        localStorage.removeItem('pe_token');
        // Use React Router navigation instead of hard refresh
        if (navigateToLogin && window.location.pathname !== '/login') {
          navigateToLogin('/login');
        }
      }
    }
    
    // Handle network errors gracefully
    if (!err.response) {
      // Network error or timeout - don't show alert, let the UI handle it
      console.warn('Network error:', err.message);
    }
    
    return Promise.reject(err);
  }
);

export default api;
