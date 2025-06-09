import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';

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
  const [newReactionRole, setNewReactionRole] = useState({
    message: '',
    reactions: [{ emoji: '', roleId: '' }]
  });

  console.log('ReactionRole render');

  useEffect(() => {
    console.log('ReactionRole useEffect');
    const fetchData = async () => {
      setLoading(true);
      try {
        const [channelsResponse, rolesResponse, reactionRolesResponse] = await Promise.all([
          fetch(`${API_URL}/api/servers/${guildId}/discord-data`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`${API_URL}/api/servers/${guildId}/roles`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`${API_URL}/api/servers/${guildId}/reactionroles`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        if (!channelsResponse.ok) throw new Error('Kanallar yüklenemedi');
        if (!rolesResponse.ok) throw new Error('Roller yüklenemedi');
        if (!reactionRolesResponse.ok) throw new Error('Tepki rolleri yüklenemedi');

        const [channelsDataRaw, rolesData, reactionRolesData] = await Promise.all([
          channelsResponse.json(),
          rolesResponse.json(),
          reactionRolesResponse.json()
        ]);
        const channelsData = Array.isArray(channelsDataRaw) ? channelsDataRaw : channelsDataRaw.channels || [];

        setChannels(channelsData);
        setRoles(rolesData);
        setReactionRoles(reactionRolesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      const response = await fetch(`${API_URL}/api/servers/${guildId}/reactionroles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          channelId,
          ...newReactionRole
        })
      });

      if (!response.ok) throw new Error('Tepki rolü oluşturulamadı');
      
      setSuccess('Tepki rolü başarıyla oluşturuldu!');
      setOpenDialog(false);
      setNewReactionRole({ message: '', reactions: [{ emoji: '', roleId: '' }] });
      fetchReactionRoles();
    } catch (err) {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Tepki Rolü Oluştur
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Kanal Seçin</InputLabel>
                <Select
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  label="Kanal Seçin"
                >
                  {channels.map((channel) => (
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
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                fullWidth
              >
                Yeni Tepki Rolü Oluştur
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Mevcut Tepki Rolleri
          </Typography>
          {reactionRoles.length === 0 ? (
            <Typography color="text.secondary">
              Henüz hiç tepki rolü oluşturulmamış.
            </Typography>
          ) : (
            <List>
              {reactionRoles.map((reactionRole) => (
                <ListItem key={reactionRole.id}>
                  <ListItemText
                    primary={reactionRole.message}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {reactionRole.reactions.map((reaction, index) => (
                          <Chip
                            key={index}
                            label={`${reaction.emoji} → ${roles.find(r => r.id === reaction.roleId)?.name || 'Bilinmeyen Rol'}`}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteReactionRole(reactionRole.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Tepki Rolü Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Mesaj"
              value={newReactionRole.message}
              onChange={(e) => setNewReactionRole(prev => ({ ...prev, message: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Tepkiler ve Roller
            </Typography>
            {newReactionRole.reactions.map((reaction, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Emoji"
                  value={reaction.emoji}
                  onChange={(e) => handleReactionChange(index, 'emoji', e.target.value)}
                  sx={{ width: '30%' }}
                />
                <FormControl sx={{ width: '70%' }}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={reaction.roleId}
                    onChange={(e) => handleReactionChange(index, 'roleId', e.target.value)}
                    label="Rol"
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {index > 0 && (
                  <IconButton onClick={() => handleRemoveReaction(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddReaction}
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
            disabled={
              !newReactionRole.message ||
              newReactionRole.reactions.some(r => !r.emoji || !r.roleId) ||
              !channelId
            }
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
} 