import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Fallback timeout - if loading takes too long, redirect to homepage
    let fallbackTimeout = setTimeout(() => {
      console.warn('Auth loading timeout - redirecting to homepage');
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      // Redirect to homepage
      window.location.href = '/university';
    }, 3000); // 3 second timeout, then redirect to homepage
    
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        clearTimeout(fallbackTimeout); // Clear timeout on success
        setUser(response.data.user);
        setLoading(false);
      } catch (error) {
        // If API fails, clear token and redirect to homepage
        console.error('Failed to fetch user:', error);
        clearTimeout(fallbackTimeout); // Clear timeout on error
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        // Redirect to homepage on error (unless already on public pages)
        const currentPath = window.location.pathname;
        if (currentPath !== '/university' && currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          window.location.href = '/university';
        }
      }
    };
    
    if (token) {
      fetchUser();
    } else {
      clearTimeout(fallbackTimeout);
      setLoading(false);
    }
    
    return () => clearTimeout(fallbackTimeout);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name, universityId) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
      universityId,
    });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

