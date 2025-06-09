import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Grid,
  Avatar,
  Tooltip,
  InputAdornment,
  Popover
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, EmojiEmotions as EmojiIcon, Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ReactionRole() {
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [channelId, setChannelId] = useState('');
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [reactionRoles, setReactionRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEmojiSelector, setOpenEmojiSelector] = useState(false);
  const [selectedReactionIndex, setSelectedReactionIndex] = useState(0);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [newReactionRole, setNewReactionRole] = useState({
    channelId: '',
    message: '',
    reactions: [{ emoji: '', roleId: '' }]
  });
  const [emojis, setEmojis] = useState({ defaultEmojis: [], customEmojis: [] });
  const [loadingEmojis, setLoadingEmojis] = useState(false);
  const [emojiError, setEmojiError] = useState(null);

  console.log('ReactionRole render');

  useEffect(() => {
    console.log('ReactionRole useEffect');
    const fetchData = async () => {
      setLoading(true);
      try {
        // Discord verilerini tek bir endpoint'ten al
        const discordResponse = await fetch(`${API_URL}/api/servers/${guildId}/discord-data`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!discordResponse.ok) {
          const errorData = await discordResponse.json();
          throw new Error(errorData.message || 'Discord verileri yüklenemedi');
        }

        const discordData = await discordResponse.json();
        console.log('Discord Data:', discordData);

        // Tepki rollerini al
        const reactionRolesResponse = await fetch(`${API_URL}/api/servers/${guildId}/reactionroles`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!reactionRolesResponse.ok) {
          const errorData = await reactionRolesResponse.json();
          throw new Error(errorData.message || 'Tepki rolleri yüklenemedi');
        }

        const reactionRolesData = await reactionRolesResponse.json();
        console.log('Reaction Roles:', reactionRolesData);

        // Verileri state'e kaydet
        setChannels(discordData.channels || []);
        setRoles(discordData.roles || []);
        setReactionRoles(reactionRolesData);

        // İlk kanalı seç
        if (discordData.channels?.length > 0) {
          setNewReactionRole(prev => ({
            ...prev,
            channelId: discordData.channels[0].id
          }));
        }
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [guildId]);

  useEffect(() => {
    const fetchEmojis = async () => {
      try {
        setLoadingEmojis(true);
        setEmojiError(null);
        console.log('Emojiler yükleniyor...');
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token bulunamadı');
        }

        const url = `${API_URL}/api/servers/${guildId}/emojis`;
        console.log('Emoji isteği yapılıyor:', {
          url,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const response = await axios.get(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.data) {
          throw new Error('API yanıtı boş');
        }

        console.log('Emojiler yüklendi:', response.data);
        setEmojis(response.data);
      } catch (error) {
        console.error('Emoji yükleme hatası:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });

        let errorMessage = 'Emojiler yüklenirken bir hata oluştu';
        if (error.response?.status === 404) {
          errorMessage = 'Emoji listesi bulunamadı';
        } else if (error.response?.status === 401) {
          errorMessage = 'Oturum süresi dolmuş. Lütfen yeniden giriş yapın';
        } else if (!error.response) {
          errorMessage = 'Sunucuya bağlanılamadı';
        }

        setEmojiError(errorMessage);
      } finally {
        setLoadingEmojis(false);
      }
    };

    if (guildId) {
      fetchEmojis();
    }
  }, [guildId]);

  const fetchReactionRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/servers/${guildId}/reactionroles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Tepki rolleri yüklenemedi');
      const reactionRolesData = await response.json();
      setReactionRoles(reactionRolesData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateReactionRole = async () => {
    try {
      console.log('Tepki rolü oluşturuluyor:', {
        channelId,
        message: newReactionRole.message,
        reactions: newReactionRole.reactions
      });

      // Validasyon
      if (!channelId) {
        throw new Error('Lütfen bir kanal seçin');
      }
      if (!newReactionRole.message) {
        throw new Error('Lütfen bir mesaj girin');
      }
      if (!newReactionRole.reactions.length) {
        throw new Error('En az bir tepki ekleyin');
      }
      if (newReactionRole.reactions.some(r => !r.emoji || !r.roleId)) {
        throw new Error('Tüm tepkiler için emoji ve rol seçin');
      }

      const response = await fetch(`${API_URL}/api/servers/${guildId}/reactionroles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          channelId,
          message: newReactionRole.message,
          reactions: newReactionRole.reactions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Tepki rolü oluşturulamadı');
      }

      const data = await response.json();
      console.log('Tepki rolü oluşturuldu:', data);
      
      setSuccess('Tepki rolü başarıyla oluşturuldu!');
      setOpenDialog(false);
      setNewReactionRole({ channelId: '', message: '', reactions: [{ emoji: '', roleId: '' }] });
      fetchReactionRoles();
    } catch (err) {
      console.error('Tepki rolü oluşturma hatası:', err);
      setError(err.message);
    }
  };

  const handleDeleteReactionRole = async (reactionRoleId) => {
    try {
      const response = await fetch(`${API_URL}/api/servers/${guildId}/reactionroles/${reactionRoleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Tepki rolü silinemedi');
      
      setSuccess('Tepki rolü başarıyla silindi!');
      fetchReactionRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddReaction = () => {
    setNewReactionRole(prev => ({
      ...prev,
      reactions: [...prev.reactions, { emoji: '', roleId: '' }]
    }));
  };

  const handleReactionChange = (index, field, value) => {
    setNewReactionRole(prev => ({
      ...prev,
      reactions: prev.reactions.map((reaction, i) => 
        i === index ? { ...reaction, [field]: value } : reaction
      )
    }));
  };

  const handleRemoveReaction = (index) => {
    setNewReactionRole(prev => ({
      ...prev,
      reactions: prev.reactions.filter((_, i) => i !== index)
    }));
  };

  // Emoji filtreleme fonksiyonu
  const filteredEmojis = useMemo(() => {
    if (!emojiSearch) return emojis;
    
    const searchLower = emojiSearch.toLowerCase();
    return {
      defaultEmojis: emojis.defaultEmojis.filter(emoji => 
        emoji.toLowerCase().includes(searchLower)
      ),
      customEmojis: emojis.customEmojis.filter(emoji => 
        emoji.name.toLowerCase().includes(searchLower)
      )
    };
  }, [emojiSearch, emojis]);

  const handleEmojiFieldClick = (event, index) => {
    setSelectedReactionIndex(index);
    setAnchorEl(event.currentTarget);
    setOpenEmojiSelector(true);
    setEmojiSearch('');
  };

  const handleEmojiSelect = (emoji) => {
    const newReactions = [...newReactionRole.reactions];
    newReactions[selectedReactionIndex] = {
      ...newReactions[selectedReactionIndex],
      emoji: typeof emoji === 'string' ? emoji : emoji.name
    };
    setNewReactionRole(prev => ({
      ...prev,
      reactions: newReactions
    }));
    setOpenEmojiSelector(false);
    setAnchorEl(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '900px', margin: '0 auto', minHeight: '100vh', bgcolor: '#18181c', p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-1px' }}>
        Tepki Rolleri
      </Typography>
      <Typography variant="subtitle1" color="#b3b3c6" sx={{ mb: 3, fontSize: '1.15rem' }}>
        Mesajlara tepki vererek rol alınmasını sağlayın.
      </Typography>
      <Divider sx={{ mb: 3, borderColor: '#23232b' }} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Tepki rolü başarıyla oluşturuldu!</Alert>}
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
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Yeni Tepki Rolü Oluştur
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
            Mesajlara tepki vererek rol alınmasını sağlayan yeni bir sistem oluşturun.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Mesaj Kanalı</InputLabel>
            <Select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              label="Mesaj Kanalı"
            >
              {channels.map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  #{channel.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Mesaj İçeriği"
            value={newReactionRole.message}
            onChange={(e) => setNewReactionRole(prev => ({ ...prev, message: e.target.value }))}
            fullWidth
            multiline
            minRows={3}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              disabled={loading}
            >
              {loading ? 'Oluşturuluyor...' : 'Tepki Rolü Oluştur'}
            </Button>
          </Box>
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
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>
            Mevcut Tepki Rolleri
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
            Sunucunuzdaki aktif tepki rollerini görüntüleyin ve yönetin.
          </Typography>
          <List>
            {reactionRoles.map((role) => (
              <ListItem
                key={role._id}
                sx={{
                  bgcolor: 'rgba(0,0,0,0.2)',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.3)',
                  },
                }}
              >
                <ListItemText
                  primary={role.message}
                  secondary={`Kanal: #${channels.find(c => c.id === role.channelId)?.name || 'Bilinmiyor'}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteReactionRole(role._id)}
                    sx={{ color: '#ef4444' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      </Stack>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Yeni Tepki Rolü Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Kanal"
              select
              value={newReactionRole.channelId || ''}
              onChange={(e) => setNewReactionRole(prev => ({ ...prev, channelId: e.target.value }))}
              sx={{ mb: 2 }}
            >
              {channels.map(channel => (
                <MenuItem key={channel.id} value={channel.id}>
                  #{channel.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Mesaj"
              multiline
              rows={4}
              value={newReactionRole.message}
              onChange={(e) => setNewReactionRole(prev => ({ ...prev, message: e.target.value }))}
              sx={{ mb: 2 }}
            />

            {newReactionRole.reactions.map((reaction, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Emoji"
                  value={reaction.emoji}
                  onClick={(e) => handleEmojiFieldClick(e, index)}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        {reaction.emoji}
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Rol"
                  select
                  value={reaction.roleId}
                  onChange={(e) => {
                    const newReactions = [...newReactionRole.reactions];
                    newReactions[index] = {
                      ...newReactions[index],
                      roleId: e.target.value
                    };
                    setNewReactionRole(prev => ({
                      ...prev,
                      reactions: newReactions
                    }));
                  }}
                >
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: role.color ? `#${role.color.toString(16)}` : 'grey.500'
                          }}
                        />
                        {role.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  onClick={() => {
                    const newReactions = newReactionRole.reactions.filter((_, i) => i !== index);
                    setNewReactionRole(prev => ({
                      ...prev,
                      reactions: newReactions
                    }));
                  }}
                  disabled={newReactionRole.reactions.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={() => {
                setNewReactionRole(prev => ({
                  ...prev,
                  reactions: [...prev.reactions, { emoji: '', roleId: '' }]
                }));
              }}
              sx={{ mt: 1 }}
            >
              Tepki Ekle
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button 
            onClick={handleCreateReactionRole} 
            variant="contained" 
            color="primary"
            disabled={!newReactionRole.channelId || !newReactionRole.message || newReactionRole.reactions.some(r => !r.emoji || !r.roleId)}
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={openEmojiSelector}
        anchorEl={anchorEl}
        onClose={() => {
          setOpenEmojiSelector(false);
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 400,
            p: 2
          }
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Emoji ara..."
          value={emojiSearch}
          onChange={(e) => setEmojiSearch(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        {loadingEmojis ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : emojiError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {emojiError}
          </Alert>
        ) : (
          <Box>
            {filteredEmojis.defaultEmojis.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Varsayılan Emojiler
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  mb: 2,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  p: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1
                }}>
                  {filteredEmojis.defaultEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      sx={{
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
                        p: 0,
                        fontSize: '1.5rem',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </Box>
              </>
            )}

            {filteredEmojis.customEmojis.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Sunucu Emojileri
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  p: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1
                }}>
                  {filteredEmojis.customEmojis.map((emoji) => (
                    <Button
                      key={emoji.id}
                      onClick={() => handleEmojiSelect(emoji)}
                      sx={{
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
                        p: 0,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <img
                        src={emoji.url}
                        alt={emoji.name}
                        style={{ width: '24px', height: '24px' }}
                      />
                    </Button>
                  ))}
                </Box>
              </>
            )}

            {filteredEmojis.defaultEmojis.length === 0 && filteredEmojis.customEmojis.length === 0 && (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                Emoji bulunamadı
              </Typography>
            )}
          </Box>
        )}
      </Popover>
    </Box>
  );
} 