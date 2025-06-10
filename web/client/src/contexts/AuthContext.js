import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// API URL'yi en başta tanımlayalım
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Context'i oluşturalım
const AuthContext = createContext(null);

// Hook'u tanımlayalım
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      console.log('Checking auth with token:', token);
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Auth check response:', response.data);
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (code) => {
    try {
      setLoading(true);
      console.log('Attempting login with code:', code);
      
      const response = await axios.post(`${API_URL}/api/auth/discord/callback`, { code });
      console.log('Login response:', response.data);
      
      if (!response.data || !response.data.token) {
        throw new Error('No token in response');
      }

      const { token, user } = response.data;
      console.log('Setting token and user:', { token, user });
      
      // Önce token'ı kaydet
      localStorage.setItem('token', token);
      
      // Sonra user'ı set et
      setUser(user);
      
      // Axios için default header'ı ayarla
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setError(null);
      window.location.href = '/';
    }
  };

  // Context değerini oluşturalım
  const value = {
    user,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 