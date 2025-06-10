import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
    IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    Chip,
    Alert,
    Popover,
    Tab,
    Tabs,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SearchIcon from '@mui/icons-material/Search';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ReactionRole() {
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [reactionRoles, setReactionRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newReactionRole, setNewReactionRole] = useState({
        channelId: '',
    message: '',
        reactions: []
    });
    const [newReaction, setNewReaction] = useState({
        emoji: '',
        roleId: ''
    });
    const [emojis, setEmojis] = useState({ custom: [], default: [] });
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [emojiTab, setEmojiTab] = useState(0);
    const [emojiSearch, setEmojiSearch] = useState('');

  console.log('ReactionRole render');

  useEffect(() => {
    console.log('ReactionRole useEffect');
    const fetchData = async () => {
      try {
            const [channelsRes, rolesRes, reactionRolesRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/servers/${guildId}/discord-data`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
                axios.get(`${process.env.REACT_APP_API_URL}/api/servers/${guildId}/roles`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
                axios.get(`${process.env.REACT_APP_API_URL}/api/servers/${guildId}/reactionroles`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

            const channelsData = channelsRes.data.channels || [];
            const rolesData = rolesRes.data;
            const reactionRolesData = reactionRolesRes.data;

        setChannels(channelsData);
        setRoles(rolesData);
        setReactionRoles(reactionRolesData);
        } catch (error) {
            setError('Veriler yüklenirken bir hata oluştu');
      }
    };

    fetchData();
  }, [guildId]);

  const fetchReactionRoles = async () => {
    try {
            const response = await axios.get(`${API_URL}/api/servers/${guildId}/reactionroles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
            setReactionRoles(response.data);
        } catch (error) {
            console.error('Error fetching reaction roles:', error);
        }
    };

    const fetchChannels = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/servers/${guildId}/channels`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setChannels(response.data);
        } catch (error) {
            console.error('Error fetching channels:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/servers/${guildId}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const handleCreate = async () => {
        try {
            const reactionsWithRoleNames = newReactionRole.reactions.map(reaction => {
                const role = roles.find(r => r.id === reaction.roleId);
                return {
                    ...reaction,
                    roleName: role?.name || 'Bilinmeyen Rol',
                    // Emoji ID'si varsa (custom emoji) <:name:id> formatında, yoksa direkt emoji
                    emoji: reaction.emoji.includes(':') 
                        ? `<${reaction.emoji.includes('a:') ? 'a' : ''}:${reaction.emoji.split(':')[1]}:${reaction.emoji.split(':')[2]}>`
                        : reaction.emoji
                };
            });

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/servers/${guildId}/reactionroles`,
                {
                    ...newReactionRole,
                    reactions: reactionsWithRoleNames
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setReactionRoles(prev => [...prev, response.data]);
            handleClose();
      setSuccess('Tepki rolü başarıyla oluşturuldu!');
        } catch (error) {
            setError(error.response?.data?.error || 'Tepki rolü oluşturulurken bir hata oluştu');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/servers/${guildId}/reactionroles/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
            setReactionRoles(prev => prev.filter(role => role._id !== id));
      setSuccess('Tepki rolü başarıyla silindi!');
        } catch (error) {
            setError(error.response?.data?.error || 'Tepki rolü silinirken bir hata oluştu');
    }
  };

  const handleAddReaction = () => {
        if (newReaction.emoji && newReaction.roleId) {
    setNewReactionRole(prev => ({
      ...prev,
                reactions: [...prev.reactions, newReaction]
            }));
            setNewReaction({ emoji: '', roleId: '' });
        }
    };

    const handleRemoveReaction = async (reactionRoleId, emoji) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/servers/${guildId}/reactionroles/${reactionRoleId}/reactions/${emoji}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setReactionRoles(prev => prev.map(role => {
                if (role._id === reactionRoleId) {
                    return {
                        ...role,
                        reactions: role.reactions.filter(r => r.emoji !== emoji)
                    };
                }
                return role;
            }));
            setSuccess('Tepki başarıyla kaldırıldı!');
        } catch (error) {
            setError(error.response?.data?.error || 'Tepki kaldırılırken bir hata oluştu');
        }
    };

    const handleOpen = () => {
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setNewReactionRole({
            channelId: '',
            message: '',
            reactions: []
        });
        setNewReaction({
            emoji: '',
            roleId: ''
        });
    };

    const handleEmojiClick = (event) => {
        setEmojiAnchorEl(event.currentTarget);
    };

    const handleEmojiClose = () => {
        setEmojiAnchorEl(null);
    };

    const handleEmojiSelect = (emoji) => {
        setNewReaction(prev => ({ ...prev, emoji }));
        handleEmojiClose();
    };

    const filteredEmojis = {
        custom: emojis.custom.filter(emoji => 
            emoji.name.toLowerCase().includes(emojiSearch.toLowerCase())
        ),
        default: emojis.default.filter(emoji => 
            emoji.name.toLowerCase().includes(emojiSearch.toLowerCase())
        )
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Tepki Rolleri
          </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                    onClick={handleOpen}
                    sx={{
                        background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                        '&:hover': {
                            background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
                            opacity: 0.9
                        },
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(99,102,241,0.18)'
                    }}
                >
                    Yeni Tepki Rolü
              </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <List>
              {reactionRoles.map((reactionRole) => (
                    <Paper
                        key={reactionRole._id}
                        sx={{
                            mb: 2,
                            p: 2,
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2
                        }}
                    >
                        <ListItem>
                  <ListItemText
                                primary={
                                    <Typography component="div" variant="subtitle1" sx={{ fontWeight: 500, color: '#fff' }}>
                                        {reactionRole.message}
                                    </Typography>
                                }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                                        <Typography component="div" variant="body2" sx={{ color: '#b9bbbe', mb: 1 }}>
                                            Kanal: {channels.find(c => c.id === reactionRole.channelId)?.name || 'Bilinmeyen Kanal'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {reactionRole.reactions.map((reaction, index) => (
                          <Chip
                            key={index}
                                                    label={`${reaction.emoji} - ${roles.find(r => r.id === reaction.roleId)?.name || 'Bilinmeyen Rol'}`}
                                                    onDelete={() => handleRemoveReaction(reactionRole._id, reaction.emoji)}
                                                    sx={{
                                                        bgcolor: '#2f3136',
                                                        color: '#fff',
                                                        '& .MuiChip-deleteIcon': {
                                                            color: '#b9bbbe',
                                                            '&:hover': {
                                                                color: '#fff'
                                                            }
                                                        }
                                                    }}
                          />
                        ))}
                                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                                    onClick={() => handleDelete(reactionRole._id)}
                                    sx={{
                                        color: '#ef4444',
                                        '&:hover': {
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                        }
                                    }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                    </Paper>
              ))}
            </List>

            <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Yeni Tepki Rolü</DialogTitle>
        <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                Kanal
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {channels.map((channel) => (
                                    <Chip
                                        key={channel.id}
                                        label={`#${channel.name}`}
                                        onClick={() => setNewReactionRole(prev => ({ ...prev, channelId: channel.id }))}
                                        color={newReactionRole.channelId === channel.id ? 'primary' : 'default'}
                                        sx={{
                                            background: newReactionRole.channelId === channel.id 
                                                ? 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)'
                                                : 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: newReactionRole.channelId === channel.id ? '#fff' : '#6366f1',
                                            '&:hover': {
                                                background: newReactionRole.channelId === channel.id
                                                    ? 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)'
                                                    : 'rgba(99, 102, 241, 0.1)'
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mesaj"
                                multiline
                                rows={4}
              value={newReactionRole.message}
              onChange={(e) => setNewReactionRole(prev => ({ ...prev, message: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                Tepkiler
            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Emoji"
                                    value={newReaction.emoji}
                                    onClick={handleEmojiClick}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <EmojiEmotionsIcon sx={{ cursor: 'pointer' }} />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ minWidth: 200 }}
                                />
                                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                                        value={newReaction.roleId}
                                        onChange={(e) => setNewReaction(prev => ({ ...prev, roleId: e.target.value }))}
                    label="Rol"
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
            <Button
                                    variant="contained"
              onClick={handleAddReaction}
                                    disabled={!newReaction.emoji || !newReaction.roleId}
                                    sx={{
                                        background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                                        '&:hover': {
                                            background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
                                            opacity: 0.9
                                        }
                                    }}
                                >
                                    Ekle
            </Button>
          </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {newReactionRole.reactions.map((reaction, index) => (
                                    <Chip
                                        key={index}
                                        label={`${reaction.emoji} → ${roles.find(r => r.id === reaction.roleId)?.name || 'Bilinmeyen Rol'}`}
                                        onDelete={() => {
                                            setNewReactionRole(prev => ({
                                                ...prev,
                                                reactions: prev.reactions.filter((_, i) => i !== index)
                                            }));
                                        }}
                                        sx={{
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            color: '#6366f1'
                                        }}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
        </DialogContent>
        <DialogActions>
                    <Button onClick={handleClose}>İptal</Button>
          <Button
                        onClick={handleCreate}
            variant="contained"
                        disabled={!newReactionRole.channelId || !newReactionRole.message || newReactionRole.reactions.length === 0}
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
                                opacity: 0.9
                            }
                        }}
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

            <Popover
                open={Boolean(emojiAnchorEl)}
                anchorEl={emojiAnchorEl}
                onClose={handleEmojiClose}
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
                        width: 352,
                        maxHeight: 435,
                        bgcolor: '#36393f',
                        color: '#fff',
                        borderRadius: '4px',
                        boxShadow: '0 0 0 1px rgba(4,4,5,0.15), 0 2px 10px 0 rgba(0,0,0,0.2)',
                        '& .MuiTab-root': {
                            color: '#b9bbbe',
                            textTransform: 'none',
                            minWidth: 0,
                            padding: '0 16px',
                            fontSize: '14px',
                            fontWeight: 500,
                            '&.Mui-selected': {
                                color: '#fff'
                            }
                        }
                    }
                }}
            >
                <Box sx={{ p: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Emoji ara..."
                        value={emojiSearch}
                        onChange={(e) => setEmojiSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#b9bbbe', fontSize: '20px' }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            mb: 1,
                            '& .MuiOutlinedInput-root': {
                                color: '#dcddde',
                                bgcolor: '#202225',
                                borderRadius: '4px',
                                '& fieldset': {
                                    borderColor: 'transparent'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'transparent'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#5865f2'
                                }
                            },
                            '& .MuiInputBase-input': {
                                padding: '8px 8px 8px 0',
                                fontSize: '14px'
                            }
                        }}
                    />
                    <Tabs
                        value={emojiTab}
                        onChange={(e, newValue) => setEmojiTab(newValue)}
                        sx={{
                            minHeight: '36px',
                            borderBottom: 1,
                            borderColor: '#2f3136',
                            mb: 1,
                            '& .MuiTabs-indicator': {
                                backgroundColor: '#5865f2',
                                height: '2px'
                            }
                        }}
                    >
                        <Tab label="Varsayılan Emojiler" />
                    </Tabs>
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: '4px',
                        maxHeight: 300,
                        overflowY: 'auto',
                        p: '4px',
                        '&::-webkit-scrollbar': {
                            width: '8px'
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#202225',
                            borderRadius: '4px',
                            '&:hover': {
                                background: '#2f3136'
                            }
                        }
                    }}>
                        {filteredEmojis.default.map((emoji) => (
                            <Box
                                key={emoji.name}
                                onClick={() => handleEmojiSelect(emoji.url)}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '24px',
                                    transition: 'background-color 0.1s ease',
                                    '&:hover': {
                                        bgcolor: '#2f3136'
                                    }
                                }}
                            >
                                {emoji.url}
                            </Box>
                        ))}
                    </Box>
                    {emojiSearch && filteredEmojis.custom.length === 0 && filteredEmojis.default.length === 0 && (
                        <Box sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            color: '#b9bbbe',
                            fontSize: '14px'
                        }}>
                            Emoji bulunamadı
                        </Box>
                    )}
                </Box>
            </Popover>
    </Box>
  );
} 