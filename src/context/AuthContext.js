import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('dzs_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user from /api/auth/me
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.data) {
        setUser(response.data.data);
        localStorage.setItem('dzs_user', JSON.stringify(response.data.data));
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('dzs_user');
      localStorage.removeItem('dzs_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Login handler
  const login = async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success && response.data?.data) {
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('dzs_user', JSON.stringify(userData));
      if (userData.token) {
        localStorage.setItem('dzs_token', userData.token);
      }
      if (rememberMe) {
        localStorage.setItem('dzs_remember_email', email);
      } else {
        localStorage.removeItem('dzs_remember_email');
      }
      return userData;
    }
  };

  // Register handler
  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    if (response.data?.success && response.data?.data) {
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('dzs_user', JSON.stringify(userData));
      if (userData.token) {
        localStorage.setItem('dzs_token', userData.token);
      }
      return userData;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      setUser(null);
      localStorage.removeItem('dzs_user');
      localStorage.removeItem('dzs_token');
    }
  };

  // Permission check helper for module and action
  const hasPermission = (moduleName, action = 'view') => {
    if (!user) return false;
    if (user.role === 'Main Admin' || user.role === 'CEO') return true;
    if (user.role === 'Employee') {
      return Boolean(user.permissions?.[moduleName]?.[action]);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        hasPermission,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
