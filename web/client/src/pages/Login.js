import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Login() {
  const { user, loading, error: authError, handleCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processedCodes = useRef(new Set());

  // Callback işleme fonksiyonu
  const processCallback = useCallback(async (code, redirect) => {
    if (!code || isProcessing || processedCodes.current.has(code)) {
      console.log('Code işlenmedi:', { 
        code, 
        isProcessing, 
        alreadyProcessed: processedCodes.current.has(code) 
      });
      return;
    }

    try {
      setIsProcessing(true);
      processedCodes.current.add(code);
      console.log('Discord code işleniyor...', code);
      
      // Code'u token'a çevir
      const response = await fetch(`${API_URL}/api/auth/discord/callback?code=${code}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Sunucu hatası! Durum: ${response.status}`);
      }

      console.log('Token alındı:', data.token);

      if (data.token) {
        const success = await handleCallback(data.token);
        console.log('Token işleme sonucu:', success);
        
        if (success) {
          console.log('Ana sayfaya yönlendiriliyor...');
          if (redirect === 'dashboard') {
            navigate('/dashboard', { replace: true });
          } else {
          navigate('/', { replace: true });
          }
        } else {
          setError('Token işleme başarısız oldu');
          navigate('/login', { replace: true });
        }
      } else {
        throw new Error('Token alınamadı');
      }
    } catch (err) {
      console.error('Callback işleme hatası:', err);
      setError(err.message || 'Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.');
      navigate('/login', { replace: true });
    } finally {
      setIsProcessing(false);
    }
  }, [handleCallback, navigate, isProcessing]);

  // Callback işlemi
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const redirect = searchParams.get('redirect');
    console.log('Callback URL:', location.search);
    console.log('Code:', code);

    if (code) {
      processCallback(code, redirect);
    }
  }, [location.search, processCallback]);

  // Kullanıcı giriş yapmışsa yönlendirme
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirect');
    if (user && !isProcessing) {
      if (redirect === 'dashboard') {
        navigate('/dashboard', { replace: true });
      } else {
      navigate('/', { replace: true });
      }
    }
  }, [user, navigate, isProcessing, location.search]);

  // Login işlemi
  const handleLogin = async () => {
    try {
      setError(null);
      processedCodes.current.clear();
      console.log('Giriş denemesi başlatılıyor...');
      
      const response = await fetch(`${API_URL}/api/auth/discord`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Sunucu hatası! Durum: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Discord URL\'sine yönlendiriliyor:', data.url);
      // Discord'a yönlendir
      window.location.href = data.url;
    } catch (error) {
      console.error('Giriş hatası:', error);
      setError(error.message || 'Giriş başlatılamadı');
    }
  };

  if (loading || isProcessing) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome to AutoPanel
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Manage your Discord server with ease. Login with Discord to get started.
          </Typography>
          {(error || authError) && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error || authError}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            disabled={isProcessing}
            sx={{
              backgroundColor: '#5865F2',
              '&:hover': {
                backgroundColor: '#4752C4',
              },
            }}
          >
            Login with Discord
          </Button>
        </Paper>
      </Box>
    </Container>
  );
} 