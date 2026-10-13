import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send HttpOnly cookies automatically
});

// Intercept requests to add Bearer token if stored in localStorage as fallback
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
      // If unauthorized and not already on auth pages
      if (
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
