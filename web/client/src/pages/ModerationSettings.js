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
  OutlinedInput,
  Container,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText as MuiListItemText,
  Chip,
  IconButton,
  Paper,
  FormHelperText
} from '@mui/material';
import { Save as SaveIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
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
    enableFloodFilter: false,
    enableCapsFilter: false,
    enableLinkFilter: false,
    badwordsList: [],
    badwordsIgnoredChannels: [],
    badwordsIgnoredRoles: [],
    spamIgnoredChannels: [],
    spamIgnoredRoles: [],
    floodIgnoredChannels: [],
    floodIgnoredRoles: [],
    capsIgnoredChannels: [],
    capsIgnoredRoles: [],
    linkIgnoredChannels: [],
    linkIgnoredRoles: [],
    badwordsPunishment: 'delete_warn',
    spamPunishment: 'delete_warn',
    floodPunishment: 'delete_warn',
    capsPunishment: 'delete_warn',
    linkPunishment: 'delete_warn',
    warningSystem: {
      enabled: false,
      punishments: [
        { warnings: 3, punishment: 'timeout', duration: 3600000 },
        { warnings: 5, punishment: 'kick' },
        { warnings: 7, punishment: 'ban' }
      ],
      warningExpiry: 86400000
    }
  });
  const [discordData, setDiscordData] = useState({ channels: [], roles: [] });
  const [server, setServer] = useState(null);
  const [newWord, setNewWord] = useState('');

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
        setServer(serverData);
        if (serverData.settings) {
          setSettings({
            enableBadwordsFilter: serverData.settings.enableBadwordsFilter || false,
            enableSpamFilter: serverData.settings.enableSpamFilter || false,
            enableFloodFilter: serverData.settings.enableFloodFilter || false,
            enableCapsFilter: serverData.settings.enableCapsFilter || false,
            enableLinkFilter: serverData.settings.enableLinkFilter || false,
            badwordsList: serverData.settings.badwordsList || [],
            badwordsIgnoredChannels: serverData.settings.badwordsIgnoredChannels || [],
            badwordsIgnoredRoles: serverData.settings.badwordsIgnoredRoles || [],
            spamIgnoredChannels: serverData.settings.spamIgnoredChannels || [],
            spamIgnoredRoles: serverData.settings.spamIgnoredRoles || [],
            floodIgnoredChannels: serverData.settings.floodIgnoredChannels || [],
            floodIgnoredRoles: serverData.settings.floodIgnoredRoles || [],
            capsIgnoredChannels: serverData.settings.capsIgnoredChannels || [],
            capsIgnoredRoles: serverData.settings.capsIgnoredRoles || [],
            linkIgnoredChannels: serverData.settings.linkIgnoredChannels || [],
            linkIgnoredRoles: serverData.settings.linkIgnoredRoles || [],
            badwordsPunishment: serverData.settings.badwordsPunishment || 'delete_warn',
            spamPunishment: serverData.settings.spamPunishment || 'delete_warn',
            floodPunishment: serverData.settings.floodPunishment || 'delete_warn',
            capsPunishment: serverData.settings.capsPunishment || 'delete_warn',
            linkPunishment: serverData.settings.linkPunishment || 'delete_warn',
            warningSystem: serverData.settings.warningSystem || {
              enabled: false,
              punishments: [
                { warnings: 3, punishment: 'timeout', duration: 3600000 },
                { warnings: 5, punishment: 'kick' },
                { warnings: 7, punishment: 'ban' }
              ],
              warningExpiry: 86400000
            }
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
    setSettings(prev => {
      // Eğer field nokta içeriyorsa (nested object), o şekilde güncelle
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      // Normal field güncelleme
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleListChange = (field, value) => {
    // Virgülle ayrılmış kelimeleri diziye çevir
    setSettings(prev => ({ ...prev, [field]: value.split(',').map(w => w.trim()).filter(Boolean) }));
  };

  const handlePunishmentChange = (index, field, value) => {
    setSettings(prev => {
      const newPunishments = [...prev.warningSystem.punishments];
      newPunishments[index] = { ...newPunishments[index], [field]: value };
      if (field === 'punishment' && value === 'timeout') {
        newPunishments[index].duration = 3600000; // 1 saat
      }
      return {
        ...prev,
        warningSystem: {
          ...prev.warningSystem,
          punishments: newPunishments
        }
      };
    });
  };

  const handleMultiSelect = (field, value) => {
    setSettings(prev => {
      // Eğer field nokta içeriyorsa (nested object), o şekilde güncelle
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      // Normal field güncelleme
      return {
        ...prev,
        [field]: value
      };
    });
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
        badwordsList: settings.badwordsList,
        badwordsIgnoredChannels: settings.badwordsIgnoredChannels,
        badwordsIgnoredRoles: settings.badwordsIgnoredRoles,
        spamIgnoredChannels: settings.spamIgnoredChannels,
        spamIgnoredRoles: settings.spamIgnoredRoles,
        floodIgnoredChannels: settings.floodIgnoredChannels,
        floodIgnoredRoles: settings.floodIgnoredRoles,
        capsIgnoredChannels: settings.capsIgnoredChannels,
        capsIgnoredRoles: settings.capsIgnoredRoles,
        linkIgnoredChannels: settings.linkIgnoredChannels,
        linkIgnoredRoles: settings.linkIgnoredRoles,
        warningSystem: settings.warningSystem,
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

  const handleAddWord = () => {
    if (newWord.trim()) {
      const words = newWord.split(',').map(word => word.trim()).filter(Boolean);
      setSettings(prev => ({
        ...prev,
        badwordsList: [...prev.badwordsList, ...words]
      }));
      setNewWord('');
    }
  };

  const handleDeleteWord = (wordToDelete) => {
    setSettings(prev => ({
      ...prev,
      badwordsList: prev.badwordsList.filter(word => word !== wordToDelete)
    }));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleAddWord();
    }
  };

  const handleBlur = () => {
    handleAddWord();
  };

  const handleAddPunishment = () => {
    setSettings(prev => ({
      ...prev,
      warningSystem: {
        ...prev.warningSystem,
        punishments: [...prev.warningSystem.punishments, { warnings: 3, punishment: 'timeout', duration: 3600000 }]
      }
    }));
  };

  const handleRemovePunishment = (index) => {
    setSettings(prev => ({
      ...prev,
      warningSystem: {
        ...prev.warningSystem,
        punishments: prev.warningSystem.punishments.filter((_, i) => i !== index)
      }
    }));
  };

  const handleWarningSystemChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      warningSystem: {
        ...prev.warningSystem,
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '900px', margin: '0 auto', minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #23232b 0%, #18181c 100%)' }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-1px' }}>
        Otomatik Moderasyon
      </Typography>
      <Typography variant="subtitle1" color="#b3b3c6" sx={{ mb: 3, fontSize: '1.15rem' }}>
        Sunucu moderasyonunu otomatikleştirir
      </Typography>
      <Divider sx={{ mb: 3, borderColor: '#23232b' }} />
      <Stack spacing={4}>
        {/* Link/Davet Filtresi */}
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
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableLinkFilter} onChange={e => handleChange('enableLinkFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Reklamları Engelle
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
            Reklam içeren mesajları siler
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const channel = discordData.channels.find(c => c.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`#${channel?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.channels.map((channel) => (
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const role = discordData.roles.find(r => r.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`@${role?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.linkIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        {/* Yasaklı Kelime Filtresi */}
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
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableBadwordsFilter} onChange={e => handleChange('enableBadwordsFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Yasaklı Kelime Filtresi
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
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
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Yasaklı Kelime Ekle"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={handleKeyPress}
              onBlur={handleBlur}
              fullWidth
              helperText="Virgül ile ayırarak birden fazla kelime ekleyebilirsiniz"
              sx={{ mb: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {settings.badwordsList.map((word) => (
              <Chip
                key={word}
                label={word}
                onDelete={() => handleDeleteWord(word)}
                sx={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#fff',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  '& .MuiChip-deleteIcon': {
                    color: '#fff',
                    '&:hover': {
                      color: '#ff4444',
                    },
                  },
                }}
              />
            ))}
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Etkilenmeyen Kanallar</InputLabel>
            <Select
              multiple
              value={settings.badwordsIgnoredChannels}
              onChange={e => handleMultiSelect('badwordsIgnoredChannels', e.target.value)}
              input={<OutlinedInput label="Etkilenmeyen Kanallar" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const channel = discordData.channels.find(c => c.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`#${channel?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.channels.map((channel) => (
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const role = discordData.roles.find(r => r.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`@${role?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.badwordsIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                color: '#fff',
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
        {/* Caps Filtresi */}
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
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableCapsFilter} onChange={e => handleChange('enableCapsFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Büyük Harf (Caps) Filtresi
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const channel = discordData.channels.find(c => c.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`#${channel?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.channels.map((channel) => (
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const role = discordData.roles.find(r => r.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`@${role?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.capsIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        {/* Flood (Çok Hızlı Mesaj) Filtresi */}
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
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableFloodFilter} onChange={e => handleChange('enableFloodFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Flood (Çok Hızlı Mesaj) Filtresi
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const channel = discordData.channels.find(c => c.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`#${channel?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.channels.map((channel) => (
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const role = discordData.roles.find(r => r.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`@${role?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.floodIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        {/* Spam Filtresi */}
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
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch checked={settings.enableSpamFilter} onChange={e => handleChange('enableSpamFilter', e.target.checked)} color="primary" />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Spam Filtresi
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const channel = discordData.channels.find(c => c.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`#${channel?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.channels.map((channel) => (
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
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const role = discordData.roles.find(r => r.id === value);
                    return (
                      <Chip
                        key={value}
                        label={`@${role?.name || value}`}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#fff',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          '& .MuiChip-deleteIcon': {
                            color: '#fff',
                            '&:hover': {
                              color: '#6366f1'
                            }
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {discordData.roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Checkbox checked={settings.spamIgnoredRoles.indexOf(role.id) > -1} />
                  <ListItemText primary={`@${role.name}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        {/* Uyarı Sistemi */}
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
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Switch 
              checked={settings.warningSystem.enabled} 
              onChange={(e) => handleWarningSystemChange('enabled', e.target.checked)} 
              color="primary" 
            />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Uyarı Sistemi
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
            Kullanıcıların uyarılarını ve cezalarını yönetin.
          </Typography>

          {settings.warningSystem.enabled && (
            <>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1 }}>
                  Ceza Aşamaları
                </Typography>
                {settings.warningSystem.punishments.map((punishment, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel sx={{ color: '#b3b3c6' }}>Uyarı Sayısı</InputLabel>
                      <Select
                        value={punishment.warnings}
                        label="Uyarı Sayısı"
                        onChange={(e) => handlePunishmentChange(index, 'warnings', e.target.value)}
                        sx={{
                          color: '#fff',
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1',
                          },
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <MenuItem key={num} value={num}>{num}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel sx={{ color: '#b3b3c6' }}>Ceza Türü</InputLabel>
                      <Select
                        value={punishment.punishment}
                        label="Ceza Türü"
                        onChange={(e) => handlePunishmentChange(index, 'punishment', e.target.value)}
                        sx={{
                          color: '#fff',
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.23)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1',
                          },
                        }}
                      >
                        <MenuItem value="timeout">Geçici Susturma</MenuItem>
                        <MenuItem value="kick">Sunucudan Atma</MenuItem>
                        <MenuItem value="ban">Sunucudan Yasaklama</MenuItem>
                      </Select>
                    </FormControl>

                    {punishment.punishment === 'timeout' && (
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel sx={{ color: '#b3b3c6' }}>Süre</InputLabel>
                        <Select
                          value={punishment.duration / 3600000}
                          label="Süre"
                          onChange={(e) => handlePunishmentChange(index, 'duration', e.target.value * 3600000)}
                          sx={{
                            color: '#fff',
                            '.MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.23)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            },
                          }}
                        >
                          {[1, 2, 3, 4, 6, 8, 12, 24].map((hours) => (
                            <MenuItem key={hours} value={hours}>{hours} saat</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <IconButton 
                      onClick={() => handleRemovePunishment(index)}
                      sx={{ color: '#ff4444' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddPunishment}
                  sx={{
                    color: '#6366f1',
                    borderColor: '#6366f1',
                    '&:hover': {
                      borderColor: '#7c3aed',
                      color: '#7c3aed',
                    },
                  }}
                >
                  Yeni Ceza Aşaması Ekle
                </Button>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel sx={{ color: '#b3b3c6' }}>Uyarı Geçerlilik Süresi</InputLabel>
                  <Select
                    value={settings.warningSystem.warningExpiry / 3600000}
                    label="Uyarı Geçerlilik Süresi"
                    onChange={(e) => handleWarningSystemChange('warningExpiry', e.target.value * 3600000)}
                    sx={{
                      color: '#fff',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366f1',
                      },
                    }}
                  >
                    {[1, 2, 3, 6, 12, 24, 48, 72].map((hours) => (
                      <MenuItem key={hours} value={hours}>{hours} saat</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText sx={{ color: '#b3b3c6' }}>
                    Bu süre sonunda uyarılar otomatik olarak silinir
                  </FormHelperText>
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={<SaveIcon />}
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
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>Ayarlar başarıyla kaydedildi!</Alert>}
      </Stack>
    </Box>
  );
} 