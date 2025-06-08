import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/servers`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Sunucular yüklenemedi');
        }
        const data = await response.json();
        setServers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#18181c' }}>
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#18181c', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Hoşgeldin Kartı */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #23232b 0%, #23232b 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              <Avatar
                src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : undefined}
                alt={user?.username}
                sx={{ 
                  width: 64, 
                  height: 64, 
                  mr: 2,
                  border: '2px solid #23232b',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                }}
              />
              <Box>
                <Typography variant="h4" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                  Hoş Geldin, {user?.username}!
                </Typography>
                <Typography variant="body1" sx={{ color: '#b3b3c6' }}>
                  Discord sunucularınızı yönetmeye başlayın
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* İstatistik Kartları */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 3,
              bgcolor: '#23232b',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
              }
            }}>
              <CardContent>
                <Typography color="#b3b3c6" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Toplam Sunucu
                </Typography>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                  {servers.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 3,
              bgcolor: '#23232b',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
              }
            }}>
              <CardContent>
                <Typography color="#b3b3c6" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Toplam Üye
                </Typography>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                  {servers.reduce((acc, server) => acc + (server.memberCount || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 3,
              bgcolor: '#23232b',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
              }
            }}>
              <CardContent>
                <Typography color="#b3b3c6" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Aktif Bot
                </Typography>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 600 }}>
                  {servers.filter(server => server.hasBot).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Sunucu Listesi */}
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 2,
              borderRadius: 3,
              bgcolor: '#23232b',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)'
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                Sunucularınız
              </Typography>
              <List>
                {servers.map((server, index) => (
                  <React.Fragment key={server._id || server.id}>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'rgba(99,102,241,0.06)'
                        }
                      }}
                      secondaryAction={
                        <Button
                          variant="contained"
                          startIcon={<SettingsIcon />}
                          onClick={() => navigate(`/server/${server.guildId}/settings`)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            boxShadow: 'none',
                            bgcolor: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                            background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                            color: '#fff',
                            '&:hover': {
                              boxShadow: 'none',
                              bgcolor: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                              background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                              opacity: 0.95
                            }
                          }}
                        >
                          Yönet
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={server.icon ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png` : undefined}
                          alt={server.name}
                          sx={{
                            border: '2px solid #23232b',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                          }}
                        >
                          {server.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 500, color: '#fff' }}>
                            {server.name}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: '#b3b3c6', fontSize: '0.875rem' }}>
                            {server.memberCount || 0} üye
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < servers.length - 1 && <Divider sx={{ my: 1, borderColor: '#23232b' }} />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 