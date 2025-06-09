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
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useParams } from 'react-router-dom';

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
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Anket Oluştur
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
                Yeni Anket Oluştur
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Mevcut Anketler
          </Typography>
          {polls.length === 0 ? (
            <Typography color="text.secondary">
              Henüz hiç anket oluşturulmamış.
            </Typography>
          ) : (
            <List>
              {polls.map((poll) => (
                <ListItem key={poll.id}>
                  <ListItemText
                    primary={poll.question}
                    secondary={`Süre: ${poll.duration} saat`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeletePoll(poll.id)}
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