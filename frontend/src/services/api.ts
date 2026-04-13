import axios from 'axios';

const getApiBaseUrl = () => {
  // 1. Check if provided via environment variable (baked in at build time)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Detect if we're on localhost
  const { hostname, origin } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');

  // 3. Smart fallback
  if (!isLocal) {
    // If running on a global URL (e.g. Vercel/Netlify), 
    // default to same-origin /api which is standard for full-stack deployments
    return `${origin}/api`;
  }

  // 4. Development default
  return 'http://localhost:5001/api';
};

export const API_BASE_URL = getApiBaseUrl();

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
