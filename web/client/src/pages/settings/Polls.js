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
  Divider,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Polls() {
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [channelId, setChannelId] = useState('');
  const [channels, setChannels] = useState([]);
  const [polls, setPolls] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: [''],
    duration: 24 // Default 24 hours
  });

  console.log('Polls render');

  useEffect(() => {
    console.log('Polls useEffect');
    const fetchData = async () => {
      setLoading(true);
      try {
        // Paralel olarak tüm verileri yükle
        const [channelsResponse, pollsResponse] = await Promise.all([
          fetch(`${API_URL}/api/servers/${guildId}/discord-data`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`${API_URL}/api/servers/${guildId}/polls`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        if (!channelsResponse.ok) throw new Error('Kanallar yüklenemedi');
        if (!pollsResponse.ok) throw new Error('Anketler yüklenemedi');

        const [channelsDataRaw, pollsData] = await Promise.all([
          channelsResponse.json(),
          pollsResponse.json()
        ]);
        const channelsData = Array.isArray(channelsDataRaw) ? channelsDataRaw : channelsDataRaw.channels || [];

        setChannels(channelsData);
        setPolls(pollsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [guildId]);

  const fetchPolls = async () => {
    try {
      const response = await fetch(`${API_URL}/api/servers/${guildId}/polls`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Anketler yüklenemedi');
      const pollsData = await response.json();
      setPolls(pollsData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePoll = async () => {
    try {
      const response = await fetch(`${API_URL}/api/servers/${guildId}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          channelId,
          ...newPoll
        })
      });

      if (!response.ok) throw new Error('Anket oluşturulamadı');
      
      setSuccess('Anket başarıyla oluşturuldu!');
      setOpenDialog(false);
      setNewPoll({ question: '', options: [''], duration: 24 });
      fetchPolls();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePoll = async (pollId) => {
    try {
      const response = await fetch(`${API_URL}/api/servers/${guildId}/polls/${pollId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Anket silinemedi');
      
      setSuccess('Anket başarıyla silindi!');
      fetchPolls();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleOptionChange = (index, value) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleRemoveOption = (index) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
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
    <Box sx={{ maxWidth: '900px', margin: '0 auto', minHeight: '100vh', bgcolor: '#18181c', p: 3 }}>
      <Typography variant="h3" gutterBottom sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-1px' }}>
        Anket Ayarları
      </Typography>
      <Typography variant="subtitle1" color="#b3b3c6" sx={{ mb: 3, fontSize: '1.15rem' }}>
        Sunucunuzda anketler oluşturun ve yönetin.
      </Typography>
      <Divider sx={{ mb: 3, borderColor: '#23232b' }} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Anket başarıyla oluşturuldu!</Alert>}
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
            Yeni Anket Oluştur
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
            Sunucunuzda yeni bir anket oluşturun.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Anket Kanalı</InputLabel>
            <Select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              label="Anket Kanalı"
            >
              {channels.map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  #{channel.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Anket Sorusu"
            value={newPoll.question}
            onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Seçenekler (Her satıra bir seçenek)"
            value={newPoll.options.join('\n')}
            onChange={(e) => setNewPoll(prev => ({ ...prev, options: e.target.value.split('\n').filter(Boolean) }))}
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
              {loading ? 'Oluşturuluyor...' : 'Anket Oluştur'}
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
            Mevcut Anketler
          </Typography>
          <Typography variant="body2" sx={{ color: '#b3b3c6', mb: 2 }}>
            Sunucunuzdaki aktif anketleri görüntüleyin ve yönetin.
          </Typography>
          <List>
            {polls.map((poll) => (
              <ListItem
                key={poll._id}
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
                  primary={poll.question}
                  secondary={`Kanal: #${channels.find(c => c.id === poll.channelId)?.name || 'Bilinmiyor'}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeletePoll(poll._id)}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Anket Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Anket Sorusu"
              value={newPoll.question}
              onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Süre (Saat)"
              type="number"
              value={newPoll.duration}
              onChange={(e) => setNewPoll(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              margin="normal"
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Seçenekler
            </Typography>
            {newPoll.options.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label={`Seçenek ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                {index > 0 && (
                  <IconButton onClick={() => handleRemoveOption(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddOption}
              sx={{ mt: 1 }}
            >
              Seçenek Ekle
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button
            onClick={handleCreatePoll}
            variant="contained"
            disabled={!newPoll.question || newPoll.options.some(opt => !opt) || !channelId}
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 