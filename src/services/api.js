import axios from 'axios';

// Detect whether we are running in localhost or production
const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // If window is defined and running on non-localhost, point to production Render backend
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://danzason-backend.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Send HttpOnly cookies automatically
});

// Intercept requests to add Bearer token from localStorage as reliable cross-domain fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dzs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        localStorage.removeItem('dzs_token');
        localStorage.removeItem('dzs_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
