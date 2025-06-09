import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function LogSettings() {
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [discordData, setDiscordData] = useState({ channels: [] });
  const [settings, setSettings] = useState({
    enabled: false,
    channel: ''
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
        if (serverData.settings) {
          setSettings({
            enabled: serverData.settings.enableLogging || false,
            channel: serverData.settings.logChannel || ''
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
        enableLogging: settings.enabled,
        logChannel: settings.channel
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
    <Box sx={{ p: 3, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', bgcolor: '#18181c' }}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="primary">
            Denetim Kaydı Ayarları
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Ayarlar başarıyla kaydedildi!</Alert>}
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={e => handleChange('enabled', e.target.checked)}
                  color="primary"
                />
              }
              label="Log Kanalını Etkinleştir"
            />
            {settings.enabled && (
              <FormControl fullWidth>
                <InputLabel>Log Kanalı</InputLabel>
                <Select
                  value={settings.channel}
                  onChange={e => handleChange('channel', e.target.value)}
                  label="Log Kanalı"
                >
                  {discordData.channels.map((channel) => (
                    <MenuItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
} 