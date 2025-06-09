import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function WelcomeSettings() {
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [discordData, setDiscordData] = useState({ channels: [] });
  const [server, setServer] = useState(null);
  const [settings, setSettings] = useState({
    enabled: false,
    channel: '',
    message: 'Welcome {user} to {server}!'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch server settings
        const settingsResponse = await fetch(`${API_URL}/api/servers/${guildId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!settingsResponse.ok) throw new Error('Sunucu ayarları yüklenemedi');
        const serverData = await settingsResponse.json();
        setServer(serverData);
        if (serverData.settings) {
          setSettings({
            enabled: serverData.settings.enableWelcome || false,
            channel: serverData.settings.welcomeChannel || '',
            message: serverData.settings.welcomeMessage || 'Welcome {user} to {server}!'
          });
        }
        // Fetch Discord data (channels)
        const discordResponse = await fetch(`${API_URL}/api/servers/${guildId}/discord-data`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!discordResponse.ok) throw new Error('Discord verileri yüklenemedi');
        const discordData = await discordResponse.json();
        setDiscordData(discordData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [guildId]);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const serverSettings = {
        enableWelcome: settings.enabled,
        welcomeChannel: settings.channel,
        welcomeMessage: settings.message
      };
      const response = await fetch(`${API_URL}/api/servers/${guildId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ settings: serverSettings })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ayarlar kaydedilirken bir hata oluştu');
      }
      toast.success('Ayarlar başarıyla kaydedildi!');
      setSuccess(true);
    } catch (error) {
      toast.error(error.message || 'Ayarlar kaydedilirken bir hata oluştu');
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '900px', margin: '0 auto', minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #23232b 0%, #18181c 100%)', p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-1px' }}>
        Hoş Geldin Mesajı Ayarları
      </Typography>
      <Typography variant="subtitle1" color="#b3b3c6" sx={{ mb: 3, fontSize: '1.15rem' }}>
        Sunucuya katılan veya ayrılan üyeler için otomatik mesajlar ayarlayın.
      </Typography>
      <Divider sx={{ mb: 3, borderColor: '#23232b' }} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Ayarlar başarıyla kaydedildi!</Alert>}
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
          position: 'relative',
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={e => handleChange('enabled', e.target.checked)}
                color="primary"
              />
            }
            label="Hoş Geldin Mesajını Etkinleştir"
          />
          {settings.enabled && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Mesaj Kanalı</InputLabel>
                <Select
                  value={settings.channel}
                  onChange={e => handleChange('channel', e.target.value)}
                  label="Mesaj Kanalı"
                >
                  {discordData.channels.map((channel) => (
                    <MenuItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Hoş Geldin Mesajı"
                value={settings.message}
                onChange={e => handleChange('message', e.target.value)}
                fullWidth
                multiline
                minRows={2}
                sx={{ mt: 2 }}
                helperText="{user} ve {server} değişkenlerini kullanabilirsiniz."
              />
            </>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                color: '#fff',
                borderRadius: 2,
                fontWeight: 600,
                px: 3,
                py: 1.2,
                boxShadow: '0 2px 8px rgba(99,102,241,0.18)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
                  opacity: 0.95,
                },
              }}
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
} 