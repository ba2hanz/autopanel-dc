import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// API URL'yi en başta tanımlayalım
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Context'i oluşturalım
const AuthContext = createContext(null);

// Hook'u tanımlayalım
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Token kontrolü
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      console.log('Token kontrol ediliyor...');
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      if (response.data) {
        console.log('Kullanıcı bilgileri alındı:', response.data);
        setUser(response.data);
      } else {
        console.log('Kullanıcı bulunamadı, token siliniyor');
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Token kontrol hatası:', err);
      localStorage.removeItem('token');
      setUser(null);
      setError(err.response?.data?.message || 'Kimlik doğrulama hatası');
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede token kontrolü
  useEffect(() => {
    checkAuth();
  }, []);

  // Callback işlemi
  const handleCallback = async (token) => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('Token bulunamadı');
      }

      console.log('Token kaydediliyor...');
      localStorage.setItem('token', token);
      
      console.log('Kullanıcı bilgileri alınıyor...');
      await checkAuth();
      
      return true;
    } catch (err) {
      console.error('Callback hatası:', err);
      setError(err.response?.data?.message || 'Kimlik doğrulama başarısız oldu. Lütfen tekrar deneyin.');
      localStorage.removeItem('token');
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış işlemi
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  // Context değerini oluşturalım
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    handleCallback,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 