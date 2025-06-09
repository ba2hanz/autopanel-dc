import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  AutoFixHigh as AutoFixHighIcon,
  EmojiEvents as EmojiEventsIcon,
  Forum as ForumIcon,
  HowToVote as HowToVoteIcon,
  Poll as PollIcon
} from '@mui/icons-material';

const DISCORD_CLIENT_ID = '1380428201406369862';
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&scope=bot+applications.commands`;

const features = [
  {
    icon: <SecurityIcon sx={{ fontSize: 40, color: '#6366f1' }} />,
    title: 'Otomatik Moderasyon',
    description: 'Sunucunuzu otomatik olarak yönetin ve kötüye kullanımı engelleyin.'
  },
  {
    icon: <AutoFixHighIcon sx={{ fontSize: 40, color: '#6366f1' }} />,
    title: 'Otomatik Cevap',
    description: 'Belirli mesajlara otomatik cevaplar verin ve sunucunuzu daha interaktif hale getirin.'
  },
  {
    icon: <EmojiEventsIcon sx={{ fontSize: 40, color: '#6366f1' }} />,
    title: 'Karşılama & Veda',
    description: 'Yeni üyelere hoş geldin mesajları gönderin ve ayrılan üyeleri uğurlayın.'
  },
  {
    icon: <ForumIcon sx={{ fontSize: 40, color: '#6366f1' }} />,
    title: 'Denetim Kaydı',
    description: 'Sunucunuzda gerçekleşen önemli olayların kaydını tutun.'
  },
  {
    icon: <PollIcon sx={{ fontSize: 40, color: '#6366f1' }} />,
    title: 'Anketler',
    description: 'Sunucunuzda anketler oluşturun ve üyelerinizin görüşlerini alın.'
  },
  {
    icon: <HowToVoteIcon sx={{ fontSize: 40, color: '#6366f1' }} />,
    title: 'Tepki Rolleri',
    description: 'Mesajlara tepki vererek rol alınmasını sağlayın.'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#18181c' }}>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #23232b 0%, #18181c 100%)',
        py: 8,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ color: '#fff', fontWeight: 800, mb: 2, letterSpacing: '-1px' }}>
                Discord Sunucunuzu Güçlendirin
              </Typography>
              <Typography variant="h5" sx={{ color: '#b3b3c6', mb: 4, lineHeight: 1.5 }}>
                Otomatik moderasyon, anketler, tepki rolleri ve daha fazlası ile sunucunuzu yönetin.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                    color: '#fff',
                    borderRadius: 2,
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 2px 8px rgba(99,102,241,0.18)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
                      opacity: 0.95,
                    },
                  }}
                >
                  Giriş Yap
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  href={BOT_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderColor: '#6366f1',
                    color: '#6366f1',
                    borderRadius: 2,
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: '#7c3aed',
                      color: '#7c3aed',
                      bgcolor: 'rgba(99,102,241,0.08)',
                    },
                  }}
                >
                  Discord'a Ekle
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
                  borderRadius: '50%',
                  zIndex: 0
                }
              }}>
                <Avatar
                  src="/bot-avatar.png"
                  alt="Bot Avatar"
                  sx={{
                    width: 300,
                    height: 300,
                    mx: 'auto',
                    border: '4px solid #23232b',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" sx={{ color: '#fff', fontWeight: 800, mb: 6, letterSpacing: '-1px' }}>
          Özellikler
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{
                height: '100%',
                bgcolor: 'rgba(44,47,51,0.85)',
                boxShadow: '0 4px 24px 0 rgba(99,102,241,0.18)',
                border: '1px solid #23232b',
                transition: 'box-shadow 0.2s, border 0.2s',
                '&:hover': {
                  boxShadow: '0 8px 32px 0 rgba(99,102,241,0.18)',
                  border: '1.5px solid #6366f1',
                },
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {feature.icon}
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, ml: 2 }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="#b3b3c6">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#23232b', py: 4, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                AutoPanel Bot
              </Typography>
              <Typography variant="body2" color="#b3b3c6">
                Discord sunucunuzu yönetmek için ihtiyacınız olan her şey.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  href={BOT_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderColor: '#6366f1',
                    color: '#6366f1',
                    '&:hover': {
                      borderColor: '#7c3aed',
                      color: '#7c3aed',
                      bgcolor: 'rgba(99,102,241,0.08)',
                    },
                  }}
                >
                  Discord'a Ekle
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={{
                    background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                    color: '#fff',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
                      opacity: 0.95,
                    },
                  }}
                >
                  Giriş Yap
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: '#23232b' }} />
          <Typography variant="body2" color="#b3b3c6" align="center">
            © 2024 AutoPanel Bot. Tüm hakları saklıdır.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
} 