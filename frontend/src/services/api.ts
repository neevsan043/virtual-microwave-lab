import axios from 'axios';

const getApiBaseUrl = () => {
  // 1. Check if we're on localhost
  const { hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // 2. Priority: Environment variable (if set at build time)
  if (import.meta.env.VITE_API_URL && !isLocal) {
    return import.meta.env.VITE_API_URL;
  }

  // 3. Detect if we're on an Antigravity tunnel or local dev
  if (isLocal || hostname.includes('antigravity.dev')) {
    // If on localhost OR antigravity tunnel but want to hit local dev server
    // Note: If you want to use the global API even in the tunnel, 
    // you should visit the Vercel URL instead.
    return 'http://localhost:5001/api';
  }

  // 4. Production default: use relative path for Vercel rewrites
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('🌐 [API] Base URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
