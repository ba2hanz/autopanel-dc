import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Settings() {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [server, setServer] = useState(null);
  const [discordData, setDiscordData] = useState({ channels: [], roles: [] });
  const [settings, setSettings] = useState({
    welcomeChannel: '',
    welcomeMessage: 'Welcome {user} to {server}!',
    autoRole: '',
    logChannel: '',
    prefix: '!',
    enableWelcome: true,
    enableAutoRole: false,
    enableLogging: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch server settings
      const settingsResponse = await fetch(`${API_URL}/api/servers/${guildId}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!settingsResponse.ok) {
        throw new Error('Sunucu ayarları yüklenemedi');
      }

      const serverData = await settingsResponse.json();
      setServer(serverData);
      setSettings(serverData.settings || {
        welcomeChannel: '',
        welcomeMessage: 'Welcome {user} to {server}!',
        autoRole: '',
        logChannel: '',
        prefix: '!',
        enableWelcome: true,
        enableAutoRole: false,
        enableLogging: false
      });

      // Fetch Discord data (channels and roles)
      const discordResponse = await fetch(`${API_URL}/api/servers/${guildId}/discord-data`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!discordResponse.ok) {
        throw new Error('Discord verileri yüklenemedi');
      }

      const discordData = await discordResponse.json();
      setDiscordData(discordData);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [guildId]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`${API_URL}/api/servers/${guildId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ayarlar kaydedilemedi');
      }

      // After saving, fetch the latest data
      await fetchData();
      setSuccess(true);
    } catch (err) {
      console.error('Ayarlar kaydetme hatası:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!server) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Sunucu bulunamadı
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Sunucu Bilgileri */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" gutterBottom>
                {server.name} - Ayarlar
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sunucu ayarlarınızı buradan yönetebilirsiniz
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Ayarlar Formu */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Genel Ayarlar
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Ayarlar başarıyla kaydedildi
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bot Prefix"
                  name="prefix"
                  value={settings.prefix}
                  onChange={handleChange}
                  helperText="Bot komutlarını başlatmak için kullanılacak karakter"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Hoş Geldin Mesajı
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.enableWelcome}
                      onChange={handleChange}
                      name="enableWelcome"
                    />
                  }
                  label="Hoş Geldin Mesajını Etkinleştir"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={!settings.enableWelcome}>
                  <InputLabel>Hoş Geldin Kanalı</InputLabel>
                  <Select
                    name="welcomeChannel"
                    value={settings.welcomeChannel}
                    onChange={handleChange}
                    label="Hoş Geldin Kanalı"
                  >
                    {discordData.channels.map(channel => (
                      <MenuItem key={channel.id} value={channel.id}>
                        #{channel.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Hoş Geldin Mesajı"
                  name="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={handleChange}
                  disabled={!settings.enableWelcome}
                  helperText="Kullanılabilir değişkenler: {user}, {server}"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Otomatik Rol
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.enableAutoRole}
                      onChange={handleChange}
                      name="enableAutoRole"
                    />
                  }
                  label="Otomatik Rolü Etkinleştir"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={!settings.enableAutoRole}>
                  <InputLabel>Otomatik Rol</InputLabel>
                  <Select
                    name="autoRole"
                    value={settings.autoRole}
                    onChange={handleChange}
                    label="Otomatik Rol"
                  >
                    {discordData.roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Log Sistemi
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!settings.enableLogging}
                      onChange={handleChange}
                      name="enableLogging"
                    />
                  }
                  label="Log Sistemini Etkinleştir"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={!settings.enableLogging}>
                  <InputLabel>Log Kanalı</InputLabel>
                  <Select
                    name="logChannel"
                    value={settings.logChannel}
                    onChange={handleChange}
                    label="Log Kanalı"
                  >
                    {discordData.channels.map(channel => (
                      <MenuItem key={channel.id} value={channel.id}>
                        #{channel.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ mt: 2 }}
                >
                  {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Bilgi Kartı */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Yardım
              </Typography>
              <Typography variant="body2" paragraph>
                • Hoş geldin mesajında {`{user}`} ve {`{server}`} değişkenlerini kullanabilirsiniz.
              </Typography>
              <Typography variant="body2" paragraph>
                • Otomatik rol, yeni üyeler sunucuya katıldığında otomatik olarak verilecektir.
              </Typography>
              <Typography variant="body2">
                • Log sistemi, sunucudaki önemli olayları seçtiğiniz kanala kaydeder.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
} 