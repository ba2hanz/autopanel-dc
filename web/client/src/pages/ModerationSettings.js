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
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const punishmentOptions = [
  { value: 'warn', label: 'Uyarı' },
  { value: 'delete_warn', label: 'Mesajı Sil + Uyarı' },
  { value: 'timeout', label: 'Timeout (Susturma)' },
  { value: 'kick', label: 'Kick (Sunucudan At)' },
  { value: 'ban', label: 'Ban (Yasakla)' },
];

export default function ModerationSettings() {
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    enableBadwordsFilter: false,
    enableSpamFilter: false,
    enableLinkFilter: false,
    enableCapsFilter: false,
    enableFloodFilter: false,
    blacklistWords: [],
    badwordsList: [],
    badwordsPunishment: 'delete_warn',
    spamPunishment: 'delete_warn',
    linkPunishment: 'delete_warn',
    capsPunishment: 'delete_warn',
    floodPunishment: 'delete_warn',
    linkIgnoredChannels: [],
    linkIgnoredRoles: [],
    badwordsIgnoredChannels: [],
    badwordsIgnoredRoles: [],
    blacklistIgnoredChannels: [],
    blacklistIgnoredRoles: [],
    capsIgnoredChannels: [],
    capsIgnoredRoles: [],
    floodIgnoredChannels: [],
    floodIgnoredRoles: [],
    spamIgnoredChannels: [],
    spamIgnoredRoles: [],
  });
  const [discordData, setDiscordData] = useState({ channels: [], roles: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/api/servers/${guildId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Sunucu ayarları yüklenemedi');
        const serverData = await response.json();
        if (serverData.settings) {
          setSettings({
            enableBadwordsFilter: serverData.settings.enableBadwordsFilter || false,
            enableSpamFilter: serverData.settings.enableSpamFilter || false,
            enableLinkFilter: serverData.settings.enableLinkFilter || false,
            enableCapsFilter: serverData.settings.enableCapsFilter || false,
            enableFloodFilter: serverData.settings.enableFloodFilter || false,
            blacklistWords: serverData.settings.blacklistWords || [],
            badwordsList: serverData.settings.badwordsList || [],
            badwordsPunishment: serverData.settings.badwordsPunishment || 'delete_warn',
            spamPunishment: serverData.settings.spamPunishment || 'delete_warn',
            linkPunishment: serverData.settings.linkPunishment || 'delete_warn',
            capsPunishment: serverData.settings.capsPunishment || 'delete_warn',
            floodPunishment: serverData.settings.floodPunishment || 'delete_warn',
            linkIgnoredChannels: serverData.settings.linkIgnoredChannels || [],
            linkIgnoredRoles: serverData.settings.linkIgnoredRoles || [],
            badwordsIgnoredChannels: serverData.settings.badwordsIgnoredChannels || [],
            badwordsIgnoredRoles: serverData.settings.badwordsIgnoredRoles || [],
            blacklistIgnoredChannels: serverData.settings.blacklistIgnoredChannels || [],
            blacklistIgnoredRoles: serverData.settings.blacklistIgnoredRoles || [],
            capsIgnoredChannels: serverData.settings.capsIgnoredChannels || [],
            capsIgnoredRoles: serverData.settings.capsIgnoredRoles || [],
            floodIgnoredChannels: serverData.settings.floodIgnoredChannels || [],
            floodIgnoredRoles: serverData.settings.floodIgnoredRoles || [],
            spamIgnoredChannels: serverData.settings.spamIgnoredChannels || [],
            spamIgnoredRoles: serverData.settings.spamIgnoredRoles || [],
          });
        }
        // Discord kanal ve rol listesini çek
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

  const handleListChange = (field, value) => {
    // Virgülle ayrılmış kelimeleri diziye çevir
    setSettings(prev => ({ ...prev, [field]: value.split(',').map(w => w.trim()).filter(Boolean) }));
  };

  const handlePunishmentChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const serverSettings = {
        enableBadwordsFilter: settings.enableBadwordsFilter,
        enableSpamFilter: settings.enableSpamFilter,
        enableLinkFilter: settings.enableLinkFilter,
        enableCapsFilter: settings.enableCapsFilter,
        enableFloodFilter: settings.enableFloodFilter,
        blacklistWords: settings.blacklistWords,
        badwordsList: settings.badwordsList,
        badwordsPunishment: settings.badwordsPunishment,
        spamPunishment: settings.spamPunishment,
        linkPunishment: settings.linkPunishment,
        capsPunishment: settings.capsPunishment,
        floodPunishment: settings.floodPunishment,
        linkIgnoredChannels: settings.linkIgnoredChannels,
        linkIgnoredRoles: settings.linkIgnoredRoles,
        badwordsIgnoredChannels: settings.badwordsIgnoredChannels,
        badwordsIgnoredRoles: settings.badwordsIgnoredRoles,
        blacklistIgnoredChannels: settings.blacklistIgnoredChannels,
        blacklistIgnoredRoles: settings.blacklistIgnoredRoles,
        capsIgnoredChannels: settings.capsIgnoredChannels,
        capsIgnoredRoles: settings.capsIgnoredRoles,
        floodIgnoredChannels: settings.floodIgnoredChannels,
        floodIgnoredRoles: settings.floodIgnoredRoles,
        spamIgnoredChannels: settings.spamIgnoredChannels,
        spamIgnoredRoles: settings.spamIgnoredRoles,
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
    <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto', minHeight: '100vh', bgcolor: '#18181c' }}>
      <Typography variant="h4" gutterBottom>Otomatik Moderasyon</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Sunucu moderasyonunu otomatikleştirir
      </Typography>
      <Stack spacing={4}>
        {/* Link/Davet Filtresi */}
        <Card elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableLinkFilter} onChange={e => handleChange('enableLinkFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" gutterBottom>Link/Davet Filtresi</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Link veya davet içeren mesajları engeller.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Eylem</InputLabel>
            <Select
              value={settings.linkPunishment}
              label="Eylem"
              onChange={e => handlePunishmentChange('linkPunishment', e.target.value)}
            >
              {punishmentOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Kanallar</InputLabel>
            <Select
              multiple
              value={settings.linkIgnoredChannels}
              onChange={e => handleMultiSelect('linkIgnoredChannels', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Kanallar" />}
              renderValue={selected => selected.map(id => {
                const ch = discordData.channels.find(c => c.id === id);
                return ch ? `#${ch.name}` : id;
              }).join(', ')}
            >
              {discordData.channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  <Checkbox checked={settings.linkIgnoredChannels.indexOf(channel.id) > -1} />
                  <ListItemText primary={`#${channel.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Roller</InputLabel>
            <Select
              multiple
              value={settings.linkIgnoredRoles}
              onChange={e => handleMultiSelect('linkIgnoredRoles', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Roller" />}
              renderValue={selected => selected.map(id => {
                const role = discordData.roles.find(r => r.id === id);
                return role ? `@${role.name}` : id;
              }).join(', ')}
            >
              {discordData.roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.linkIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
        {/* Küfür/Argo Filtresi */}
        <Card elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableBadwordsFilter} onChange={e => handleChange('enableBadwordsFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" gutterBottom>Küfür/Argo Filtresi</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Küfür veya argo içeren mesajları engeller.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Eylem</InputLabel>
            <Select
              value={settings.badwordsPunishment}
              label="Eylem"
              onChange={e => handlePunishmentChange('badwordsPunishment', e.target.value)}
            >
              {punishmentOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Küfür/Argo Listesi (Badwords)"
            value={settings.badwordsList.join(', ')}
            onChange={e => handleListChange('badwordsList', e.target.value)}
            fullWidth
            helperText="Virgül ile ayırın. (örn: küfür1, küfür2)"
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Kanallar</InputLabel>
            <Select
              multiple
              value={settings.badwordsIgnoredChannels}
              onChange={e => handleMultiSelect('badwordsIgnoredChannels', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Kanallar" />}
              renderValue={selected => selected.map(id => {
                const ch = discordData.channels.find(c => c.id === id);
                return ch ? `#${ch.name}` : id;
              }).join(', ')}
            >
              {discordData.channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  <Checkbox checked={settings.badwordsIgnoredChannels.indexOf(channel.id) > -1} />
                  <ListItemText primary={`#${channel.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Roller</InputLabel>
            <Select
              multiple
              value={settings.badwordsIgnoredRoles}
              onChange={e => handleMultiSelect('badwordsIgnoredRoles', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Roller" />}
              renderValue={selected => selected.map(id => {
                const role = discordData.roles.find(r => r.id === id);
                return role ? `@${role.name}` : id;
              }).join(', ')}
            >
              {discordData.roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.badwordsIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
        {/* Blacklist (Yasaklı Kelime) Filtresi */}
        <Card elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Typography variant="h6" gutterBottom>Yasaklı Kelime Filtresi</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Belirlediğiniz kelimeleri içeren mesajları engeller.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Eylem</InputLabel>
            <Select
              value={settings.badwordsPunishment}
              label="Eylem"
              onChange={e => handlePunishmentChange('badwordsPunishment', e.target.value)}
            >
              {punishmentOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Yasaklı Kelimeler (Blacklist)"
            value={settings.blacklistWords.join(', ')}
            onChange={e => handleListChange('blacklistWords', e.target.value)}
            fullWidth
            helperText="Virgül ile ayırın. (örn: kelime1, kelime2)"
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Kanallar</InputLabel>
            <Select
              multiple
              value={settings.blacklistIgnoredChannels}
              onChange={e => handleMultiSelect('blacklistIgnoredChannels', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Kanallar" />}
              renderValue={selected => selected.map(id => {
                const ch = discordData.channels.find(c => c.id === id);
                return ch ? `#${ch.name}` : id;
              }).join(', ')}
            >
              {discordData.channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  <Checkbox checked={settings.blacklistIgnoredChannels.indexOf(channel.id) > -1} />
                  <ListItemText primary={`#${channel.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Roller</InputLabel>
            <Select
              multiple
              value={settings.blacklistIgnoredRoles}
              onChange={e => handleMultiSelect('blacklistIgnoredRoles', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Roller" />}
              renderValue={selected => selected.map(id => {
                const role = discordData.roles.find(r => r.id === id);
                return role ? `@${role.name}` : id;
              }).join(', ')}
            >
              {discordData.roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.blacklistIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
        {/* Büyük Harf (Caps) Filtresi */}
        <Card elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableCapsFilter} onChange={e => handleChange('enableCapsFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" gutterBottom>Büyük Harf (Caps) Filtresi</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Tamamı büyük harf olan mesajları engeller.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Eylem</InputLabel>
            <Select
              value={settings.capsPunishment}
              label="Eylem"
              onChange={e => handlePunishmentChange('capsPunishment', e.target.value)}
            >
              {punishmentOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Kanallar</InputLabel>
            <Select
              multiple
              value={settings.capsIgnoredChannels}
              onChange={e => handleMultiSelect('capsIgnoredChannels', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Kanallar" />}
              renderValue={selected => selected.map(id => {
                const ch = discordData.channels.find(c => c.id === id);
                return ch ? `#${ch.name}` : id;
              }).join(', ')}
            >
              {discordData.channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  <Checkbox checked={settings.capsIgnoredChannels.indexOf(channel.id) > -1} />
                  <ListItemText primary={`#${channel.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Roller</InputLabel>
            <Select
              multiple
              value={settings.capsIgnoredRoles}
              onChange={e => handleMultiSelect('capsIgnoredRoles', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Roller" />}
              renderValue={selected => selected.map(id => {
                const role = discordData.roles.find(r => r.id === id);
                return role ? `@${role.name}` : id;
              }).join(', ')}
            >
              {discordData.roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.capsIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
        {/* Flood (Çok Hızlı Mesaj) Filtresi */}
        <Card elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableFloodFilter} onChange={e => handleChange('enableFloodFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" gutterBottom>Flood (Çok Hızlı Mesaj) Filtresi</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Çok kısa sürede tekrar tekrar mesaj atanları engeller.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Eylem</InputLabel>
            <Select
              value={settings.floodPunishment}
              label="Eylem"
              onChange={e => handlePunishmentChange('floodPunishment', e.target.value)}
            >
              {punishmentOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Kanallar</InputLabel>
            <Select
              multiple
              value={settings.floodIgnoredChannels}
              onChange={e => handleMultiSelect('floodIgnoredChannels', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Kanallar" />}
              renderValue={selected => selected.map(id => {
                const ch = discordData.channels.find(c => c.id === id);
                return ch ? `#${ch.name}` : id;
              }).join(', ')}
            >
              {discordData.channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  <Checkbox checked={settings.floodIgnoredChannels.indexOf(channel.id) > -1} />
                  <ListItemText primary={`#${channel.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Roller</InputLabel>
            <Select
              multiple
              value={settings.floodIgnoredRoles}
              onChange={e => handleMultiSelect('floodIgnoredRoles', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Roller" />}
              renderValue={selected => selected.map(id => {
                const role = discordData.roles.find(r => r.id === id);
                return role ? `@${role.name}` : id;
              }).join(', ')}
            >
              {discordData.roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.floodIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
        {/* Spam Filtresi */}
        <Card elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableSpamFilter} onChange={e => handleChange('enableSpamFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" gutterBottom>Spam Filtresi</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Aynı mesajı tekrar tekrar atanları engeller.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Eylem</InputLabel>
            <Select
              value={settings.spamPunishment}
              label="Eylem"
              onChange={e => handlePunishmentChange('spamPunishment', e.target.value)}
            >
              {punishmentOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Kanallar</InputLabel>
            <Select
              multiple
              value={settings.spamIgnoredChannels}
              onChange={e => handleMultiSelect('spamIgnoredChannels', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Kanallar" />}
              renderValue={selected => selected.map(id => {
                const ch = discordData.channels.find(c => c.id === id);
                return ch ? `#${ch.name}` : id;
              }).join(', ')}
            >
              {discordData.channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  <Checkbox checked={settings.spamIgnoredChannels.indexOf(channel.id) > -1} />
                  <ListItemText primary={`#${channel.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Roller</InputLabel>
            <Select
              multiple
              value={settings.spamIgnoredRoles}
              onChange={e => handleMultiSelect('spamIgnoredRoles', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Roller" />}
              renderValue={selected => selected.map(id => {
                const role = discordData.roles.find(r => r.id === id);
                return role ? `@${role.name}` : id;
              }).join(', ')}
            >
              {discordData.roles.map(role => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.spamIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>
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
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>Ayarlar başarıyla kaydedildi!</Alert>}
      </Stack>
    </Box>
  );
} 