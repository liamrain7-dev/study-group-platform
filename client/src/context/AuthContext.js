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
    
    // Safety timeout - always stop loading after 5 seconds
    const fallbackTimeout = setTimeout(() => {
      console.warn('AuthContext: Loading timeout - forcing render');
      setLoading(false);
    }, 5000);
    
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setLoading(false);
        clearTimeout(fallbackTimeout);
      } catch (error) {
        // If API fails, clear token
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        clearTimeout(fallbackTimeout);
      }
    };
    
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
      clearTimeout(fallbackTimeout);
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

