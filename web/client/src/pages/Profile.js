import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
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
  CircularProgress
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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#18181c', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Profil Kartı */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : undefined}
                alt={user?.username}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                {user?.username}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ mt: 2 }}
              >
                Çıkış Yap
              </Button>
            </Paper>
          </Grid>

          {/* Ayarlar */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hesap Ayarları
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <List>
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Bildirimler"
                    secondary="E-posta ve Discord bildirimlerini yönetin"
                  />
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.email}
                          onChange={(e) => handleSettingChange('notifications', {
                            ...settings.notifications,
                            email: e.target.checked
                          })}
                        />
                      }
                      label="E-posta"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.notifications.discord}
                          onChange={(e) => handleSettingChange('notifications', {
                            ...settings.notifications,
                            discord: e.target.checked
                          })}
                        />
                      }
                      label="Discord"
                    />
                  </Box>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <DarkModeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Karanlık Mod"
                    secondary="Arayüz temasını değiştirin"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.darkMode}
                        onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                      />
                    }
                    label=""
                  />
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="İki Faktörlü Doğrulama"
                    secondary="Hesap güvenliğinizi artırın"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.twoFactor}
                        onChange={(e) => handleSettingChange('twoFactor', e.target.checked)}
                      />
                    }
                    label=""
                  />
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dil"
                    secondary="Arayüz dilini değiştirin"
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSettingChange('language', settings.language === 'tr' ? 'en' : 'tr')}
                  >
                    {settings.language === 'tr' ? 'English' : 'Türkçe'}
                  </Button>
                </ListItem>
              </List>
            </Paper>

            {/* Hesap İstatistikleri */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hesap İstatistikleri
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sunucu Sayısı
                  </Typography>
                  <Typography variant="h4">
                    {user?.servers?.length || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Son Giriş
                  </Typography>
                  <Typography variant="h4">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 