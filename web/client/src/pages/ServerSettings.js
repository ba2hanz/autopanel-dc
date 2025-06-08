import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import axios from 'axios';

export default function ServerSettings() {
  const { serverId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    prefix: '!',
    logging: {
      enabled: false,
      channel: ''
    },
    welcome: {
      enabled: false,
      channel: '',
      message: 'Welcome {user} to {server}!'
    },
    roles: {
      autoRole: '',
      moderatorRole: ''
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/servers/${serverId}/settings`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setSettings(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch server settings. Please try again later.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, [serverId]);

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/servers/${serverId}/settings`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSuccess(true);
    } catch (err) {
      setError('Failed to save settings. Please try again later.');
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Server Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              <TextField
                label="Command Prefix"
                value={settings.prefix}
                onChange={(e) => setSettings(prev => ({ ...prev, prefix: e.target.value }))}
                fullWidth
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Logging Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Logging Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.logging.enabled}
                    onChange={(e) => handleChange('logging', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Logging"
              />
              {settings.logging.enabled && (
                <TextField
                  label="Log Channel ID"
                  value={settings.logging.channel}
                  onChange={(e) => handleChange('logging', 'channel', e.target.value)}
                  fullWidth
                  margin="normal"
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Welcome Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Welcome Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.welcome.enabled}
                    onChange={(e) => handleChange('welcome', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Welcome Messages"
              />
              {settings.welcome.enabled && (
                <>
                  <TextField
                    label="Welcome Channel ID"
                    value={settings.welcome.channel}
                    onChange={(e) => handleChange('welcome', 'channel', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Welcome Message"
                    value={settings.welcome.message}
                    onChange={(e) => handleChange('welcome', 'message', e.target.value)}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={2}
                    helperText="Use {user} for username and {server} for server name"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Role Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Settings
              </Typography>
              <TextField
                label="Auto-Role ID"
                value={settings.roles.autoRole}
                onChange={(e) => handleChange('roles', 'autoRole', e.target.value)}
                fullWidth
                margin="normal"
                helperText="Role to automatically assign to new members"
              />
              <TextField
                label="Moderator Role ID"
                value={settings.roles.moderatorRole}
                onChange={(e) => handleChange('roles', 'moderatorRole', e.target.value)}
                fullWidth
                margin="normal"
                helperText="Role that can use moderation commands"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
} 