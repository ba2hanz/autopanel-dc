import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CardActionArea,
  CircularProgress
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SecurityIcon from '@mui/icons-material/Security';
import ForumIcon from '@mui/icons-material/Forum';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import TagFacesIcon from '@mui/icons-material/TagFaces';
import PollIcon from '@mui/icons-material/Poll';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const settingsOptions = [
  {
    key: 'welcome',
    title: 'Karşılama & Veda',
    description: 'Bir üye katıldığında veya ayrıldığında olacakları yönetin',
    icon: <EmojiEventsIcon fontSize="large" color="primary" />,
    path: 'welcome',
  },
  {
    key: 'moderation',
    title: 'Otomatik Moderasyon',
    description: 'Sunucu moderasyonunu otomatikleştirir',
    icon: <SecurityIcon fontSize="large" color="primary" />,
    path: 'moderation',
  },
  {
    key: 'logs',
    title: 'Denetim Kaydı',
    description: 'Sunucunuzda olanların kaydını tutar',
    icon: <ListAltIcon fontSize="large" color="primary" />,
    path: 'logs',
  },
  {
    key: 'autoresponse',
    title: 'Otomatik Cevap',
    description: 'Mesaj tetiklemelerini yönetin',
    icon: <ForumIcon fontSize="large" color="primary" />,
    path: 'autoresponse',
  },
  {
    key: 'polls',
    title: 'Anketler',
    description: 'Sunucunuzda anketler oluşturun ve yönetin',
    icon: <PollIcon fontSize="large" color="primary" />,
    path: 'polls',
  },
  {
    key: 'reactionrole',
    title: 'Tepki Rolleri',
    description: 'Mesajlara tepki vererek rol alınmasını sağlayın',
    icon: <HowToVoteIcon fontSize="large" color="primary" />,
    path: 'reactionrole',
  },
  {
    key: 'emojirole',
    title: 'Emoji Rol',
    description: 'Üyelerin mesajlara tepki vererek rol almasını sağlar',
    icon: <TagFacesIcon fontSize="large" color="primary" />,
    path: 'emojirole',
  },
  {
    key: 'other',
    title: 'Diğer Ayarlar',
    description: 'Sunucunuzun diğer ayarlarını yönetin',
    icon: <AutoFixHighIcon fontSize="large" color="primary" />,
    path: 'other',
  },
];

export default function ServerSettings() {
  const navigate = useNavigate();
  const { guildId } = useParams();
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState(null);
  const [error, setError] = useState(null);

  console.log('ServerSettings render');

  useEffect(() => {
    console.log('ServerSettings useEffect');
    const fetchServer = async () => {
      try {
        const response = await fetch(`${API_URL}/api/servers/${guildId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Sunucu bilgileri yüklenemedi');
        const data = await response.json();
        setServer(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServer();
  }, [guildId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', bgcolor: '#18181c', p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={2} sx={{ p: 3, backgroundColor: 'background.paper' }}>
            <Typography variant="h4" gutterBottom>
              Sunucu Ayarları
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Sunucunuzun tüm ayarlarını buradan yönetebilirsiniz. Detaylar için bir ayar kartına tıklayın.
            </Typography>
          </Card>
        </Grid>
        {settingsOptions.map((option) => (
          <Grid item xs={12} sm={6} md={4} key={option.key}>
            <Card sx={{ height: '100%' }} elevation={3}>
              <CardActionArea onClick={() => navigate(`/dashboard/server/${guildId}/settings/${option.path}`)} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {option.icon}
                    <Typography variant="h6" sx={{ ml: 2 }}>
                      {option.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
} 