import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    notifications: {
      email: false,
      discord: true
    },
    darkMode: true,
    language: 'tr',
    twoFactor: false
  });

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_URL}/api/auth/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load settings');
        }

        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Settings fetch error:', err);
        setError(err.message);
        if (err.message.includes('token')) {
          // Token hatası varsa kullanıcıyı login sayfasına yönlendir
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [navigate]);

  const handleSettingChange = async (setting, value) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/api/auth/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [setting]: value })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const data = await response.json();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Settings update error:', err);
      setError(err.message);
      if (err.message.includes('token')) {
        navigate('/login');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#18181c' }}>
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '900px', margin: '0 auto', minHeight: '100vh', bgcolor: '#18181c', p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-1px' }}>
        Profil Ayarları
      </Typography>
      <Typography variant="subtitle1" color="#b3b3c6" sx={{ mb: 3, fontSize: '1.15rem' }}>
        Hesap ayarlarınızı yönetin ve tercihlerinizi özelleştirin.
      </Typography>
      <Divider sx={{ mb: 3, borderColor: '#23232b' }} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={3}>
        <Box sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'rgba(44,47,51,0.85)',
          boxShadow: '0 4px 24px 0 rgba(99,102,241,0.18)',
          border: '1px solid #23232b',
          mb: 2,
          transition: 'box-shadow 0.2s, border 0.2s',
          '&:hover': {
            boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18)',
            border: '1.5px solid #6366f1',
          },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : undefined}
              alt={user?.username}
              sx={{ width: 80, height: 80, mr: 3 }}
            />
            <Box>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                {user?.username}
              </Typography>
              <Typography variant="body2" color="#b3b3c6">
                Discord ID: {user?.discordId}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 3, borderColor: '#23232b' }} />
          <List>
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon sx={{ color: '#6366f1' }} />
              </ListItemIcon>
              <ListItemText
                primary="Bildirimler"
                secondary="E-posta ve Discord bildirimlerini yönetin"
              />
              <Switch
                checked={settings.notifications.email}
                onChange={(e) => handleSettingChange('notifications.email', e.target.checked)}
                color="primary"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DarkModeIcon sx={{ color: '#6366f1' }} />
              </ListItemIcon>
              <ListItemText
                primary="Karanlık Mod"
                secondary="Arayüz temasını değiştirin"
              />
              <Switch
                checked={settings.darkMode}
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                color="primary"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <LanguageIcon sx={{ color: '#6366f1' }} />
              </ListItemIcon>
              <ListItemText
                primary="Dil"
                secondary="Arayüz dilini değiştirin"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.language === 'en'}
                    onChange={(e) => handleSettingChange('language', e.target.checked ? 'en' : 'tr')}
                    color="primary"
                  />
                }
                label={settings.language === 'en' ? 'English' : 'Türkçe'}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon sx={{ color: '#6366f1' }} />
              </ListItemIcon>
              <ListItemText
                primary="İki Faktörlü Doğrulama"
                secondary="Hesap güvenliğinizi artırın"
              />
              <Switch
                checked={settings.twoFactor}
                onChange={(e) => handleSettingChange('twoFactor', e.target.checked)}
                color="primary"
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'rgba(44,47,51,0.85)',
          boxShadow: '0 4px 24px 0 rgba(99,102,241,0.18)',
          border: '1px solid #23232b',
          mb: 2,
          transition: 'box-shadow 0.2s, border 0.2s',
          '&:hover': {
            boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18)',
            border: '1.5px solid #6366f1',
          },
        }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
            Hesap İşlemleri
          </Typography>
          <Button
            variant="contained"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              borderRadius: 2,
              fontWeight: 600,
              px: 3,
              py: 1.2,
              boxShadow: '0 2px 8px rgba(239,68,68,0.18)',
              '&:hover': {
                background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                opacity: 0.95,
              },
            }}
          >
            Çıkış Yap
          </Button>
        </Box>
      </Stack>
    </Box>
  );
} 