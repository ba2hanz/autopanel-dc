import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
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
  CircularProgress,
  CardActions,
  Stack,
  Alert,
  Paper
} from '@mui/material';
import {
  People as PeopleIcon,
  Chat as ChatIcon,
  EmojiEvents as EmojiEventsIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Star as StarIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../components/Breadcrumb';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Dashboard() {
  const { user, loading: userLoading } = useAuth();
  const { sendMessage } = useWebSocket();
  const navigate = useNavigate();
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    welcomeChannel: '',
    welcomeMessage: '',
    enableWelcome: false,
    logChannel: '',
    enableLogs: false,
    autoRole: '',
    enableAutoRole: false
  });
  const [stats, setStats] = useState({
    totalServers: 0,
    adminServers: 0,
    totalMembers: 0,
    totalChannels: 0,
    totalRoles: 0
  });

  console.log('Dashboard render');

  useEffect(() => {
    console.log('Dashboard useEffect');
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
        console.log('Server Data:', data);
        setServers(data);

        // Her sunucu için kanal ve rol sayılarını çek
        const serversWithDetails = await Promise.all(data.map(async (server) => {
          try {
            const discordResponse = await fetch(`${API_URL}/api/servers/${server.guildId}/discord-data`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            if (!discordResponse.ok) throw new Error('Discord verileri yüklenemedi');
            const discordData = await discordResponse.json();
            return {
              ...server,
              channels: discordData.channels || [],
              roles: discordData.roles || []
            };
          } catch (error) {
            console.error(`Error fetching details for server ${server.guildId}:`, error);
            return server;
          }
        }));

        // İstatistikleri hesapla
        const totalMembers = serversWithDetails.reduce((sum, server) => sum + (server.memberCount || 0), 0);
        const totalChannels = serversWithDetails.reduce((sum, server) => sum + (server.channels?.length || 0), 0);
        const totalRoles = serversWithDetails.reduce((sum, server) => sum + (server.roles?.length || 0), 0);
        const adminServers = serversWithDetails.length;

        console.log('Stats:', { totalMembers, totalChannels, totalRoles, adminServers });

        setStats({
          totalServers: adminServers,
          adminServers,
          totalMembers,
          totalChannels,
          totalRoles
        });

        setServers(serversWithDetails);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServers();
  }, []);

  const handleSettingsChange = async (newSettings) => {
    try {
      // API'ye gönder
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/servers/${selectedServer.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        throw new Error('Ayarlar güncellenirken bir hata oluştu');
      }

      // WebSocket üzerinden bot'a bildir
      sendMessage({
        type: 'settings_update',
        guildId: selectedServer.id,
        settings: newSettings
      });

      // Local state'i güncelle
      setSettings(newSettings);
      
      // Sunucu listesini güncelle
      setServers(prevServers => 
        prevServers.map(server => 
          server.id === selectedServer.id 
            ? { ...server, settings: newSettings }
            : server
        )
      );

      toast.success('Ayarlar başarıyla güncellendi!');
    } catch (error) {
      console.error('Ayar güncelleme hatası:', error);
      toast.error('Ayarlar güncellenirken bir hata oluştu');
    }
  };

  const handleSettingsClick = (server) => {
    setSelectedServer(server);
    setSettings(server.settings || {
      welcomeChannel: '',
      welcomeMessage: '',
      enableWelcome: false,
      logChannel: '',
      enableLogs: false,
      autoRole: '',
      enableAutoRole: false
    });
    navigate(`/dashboard/server/${server.guildId}/settings`);
  };

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
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', bgcolor: '#18181c', p: 3 }}>
      <Breadcrumb currentPage="Ana Sayfa" />
      
      {/* Hoşgeldiniz Kartı */}
            <Paper 
        elevation={0}
              sx={{ 
          bgcolor: 'rgba(44,47,51,0.85)',
          borderRadius: 2,
          p: 3,
          mb: 4,
          border: '1px solid #23232b',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(124,58,237,0.1) 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
            src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : '/default-avatar.png'}
                alt={user?.username}
            sx={{ width: 64, height: 64, border: '2px solid #6366f1' }}
          />
          <Box>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mb: 1 }}>
              Hoş Geldiniz, {user?.username}!
            </Typography>
            <Typography variant="body1" color="#b3b3c6">
              Discord sunucularınızı yönetmek için hazır mısınız?
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* İstatistik Kartları */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
                sx={{ 
              bgcolor: 'rgba(44,47,51,0.85)',
              borderRadius: 2,
              p: 2,
              border: '1px solid #23232b',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(99,102,241,0.1)',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DashboardIcon sx={{ color: '#6366f1', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                  {stats.totalServers}
                </Typography>
                <Typography variant="body2" color="#b3b3c6">
                  Toplam Sunucu
                </Typography>
              </Box>
              </Box>
            </Paper>
          </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(44,47,51,0.85)',
              borderRadius: 2,
              p: 2,
              border: '1px solid #23232b',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(99,102,241,0.1)',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <StarIcon sx={{ color: '#6366f1', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                  {stats.adminServers}
                </Typography>
                <Typography variant="body2" color="#b3b3c6">
                  Yönetici Olduğunuz
                </Typography>
              </Box>
            </Box>
          </Paper>
          </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(44,47,51,0.85)',
              borderRadius: 2,
              p: 2,
              border: '1px solid #23232b',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(99,102,241,0.1)',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <PeopleIcon sx={{ color: '#6366f1', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                  {stats.totalMembers}
                </Typography>
                <Typography variant="body2" color="#b3b3c6">
                  Toplam Üye
                </Typography>
              </Box>
            </Box>
          </Paper>
          </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'rgba(44,47,51,0.85)',
              borderRadius: 2,
              p: 2,
              border: '1px solid #23232b',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(99,102,241,0.1)',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldIcon sx={{ color: '#6366f1', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                  {stats.totalChannels}
                </Typography>
                <Typography variant="body2" color="#b3b3c6">
                  Toplam Kanal
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
          </Grid>

      <Typography variant="h3" gutterBottom sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-1px' }}>
        Sunucularım
      </Typography>
      <Typography variant="subtitle1" color="#b3b3c6" sx={{ mb: 3, fontSize: '1.15rem' }}>
        Yönetebileceğiniz Discord sunucularınızı görüntüleyin ve ayarlarını yapın.
              </Typography>
      <Divider sx={{ mb: 3, borderColor: '#23232b' }} />
      <Grid container spacing={3}>
        {servers.map((server) => (
          <Grid item xs={12} sm={6} md={4} key={server.guildId}>
            <Paper
              elevation={0}
                      sx={{
                bgcolor: 'rgba(44,47,51,0.85)',
                        borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #23232b',
                transition: 'all 0.2s',
                        '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  border: '1px solid #6366f1'
                }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={server.icon ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png` : '/default-server.png'}
                  alt={server.name}
                  sx={{ width: 48, height: 48, border: '2px solid #23232b' }}
                />
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                    {server.name}
                  </Typography>
                  <Typography variant="body2" color="#b3b3c6">
                    {server.owner ? 'Sunucu Sahibi' : 'Yönetici'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#23232b' }} />

              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="#b3b3c6">
                          Üyeler
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                          {server.memberCount || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChatIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="#b3b3c6">
                          Kanallar
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                          {server.channels?.length || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEventsIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="#b3b3c6">
                          Roller
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                          {server.roles?.length || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                      <Box>
                        <Typography variant="body2" color="#b3b3c6">
                          Moderasyon
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                          {server.moderationEnabled ? 'Aktif' : 'Pasif'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ borderColor: '#23232b' }} />

              <Box sx={{ p: 2 }}>
                        <Button
                  fullWidth
                          variant="contained"
                          startIcon={<SettingsIcon />}
                          onClick={() => handleSettingsClick(server)}
                          sx={{
                            background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                            color: '#fff',
                    borderRadius: 2,
                    fontWeight: 600,
                    py: 1,
                            '&:hover': {
                      background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
                      opacity: 0.95,
                    },
                          }}
                        >
                  Ayarları Yönet
                        </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
        </Grid>
    </Box>
  );
} 