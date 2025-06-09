import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Stack, AppBar, Toolbar } from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import LogoIcon from '@mui/icons-material/Apps';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Discord bot davet linki
const DISCORD_CLIENT_ID = process.env.REACT_APP_DISCORD_CLIENT_ID || 'BOT_CLIENT_ID';
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  // Şimşek animasyonları için state
  const [lightnings, setLightnings] = useState([]);
  const lightningId = useRef(0);

  // Mouse tıklamasında şimşek ekle
  const handleLightning = (e) => {
    // Sadece ana kutuya tıklanırsa çalışsın
    if (e.target.id !== 'lightning-bg') return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = lightningId.current++;
    setLightnings((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setLightnings((prev) => prev.filter((l) => l.id !== id));
    }, 400);
  };

  // Şimşek SVG'si (basit yıldırım şekli)
  const LightningSVG = ({ x, y }) => (
    <svg
      style={{
        position: 'absolute',
        left: x - 16,
        top: y - 32,
        pointerEvents: 'none',
        zIndex: 10,
        filter: 'drop-shadow(0 0 8px #fff) drop-shadow(0 0 16px #facc15) drop-shadow(0 0 32px #fbbf24)'
      }}
      width="32"
      height="64"
      viewBox="0 0 32 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline
        points="16,0 12,28 20,28 8,64 24,36 14,36 20,0"
        stroke="#facc15"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <polyline
        points="16,0 12,28 20,28 8,64 24,36 14,36 20,0"
        stroke="#fffbe6"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  // Sağ üstteki Giriş Yap butonu için
  const handleLoginClick = async () => {
    if (loading) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/discord`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = `${API_URL}/api/auth/discord`;
      }
    } catch {
      window.location.href = `${API_URL}/api/auth/discord`;
    }
  };

  // Kontrol Paneli butonu için
  const handlePanelClick = async () => {
    if (loading) return;
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      try {
        const response = await fetch(`${API_URL}/api/auth/discord?redirect=dashboard`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.url) {
          // redirect=dashboard parametresi yoksa ekle
          const url = data.url.includes('redirect=dashboard')
            ? data.url
            : data.url + (data.url.includes('?') ? '&' : '?') + 'redirect=dashboard';
          window.location.href = url;
        } else {
          window.location.href = `${API_URL}/api/auth/discord?redirect=dashboard`;
        }
      } catch {
        window.location.href = `${API_URL}/api/auth/discord?redirect=dashboard`;
      }
    }
  };

  return (
    <Box
      id="lightning-bg"
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(24, 24, 28, 0.9) 0%, rgba(35, 35, 43, 0.9) 100%)'
      }}
      onClick={handleLightning}
    >
      {/* Şimşek SVG'leri */}
      {lightnings.map((l) => (
        <LightningSVG key={l.id} x={l.x} y={l.y} />
      ))}
      {/* Diğer içerikler ve gradient arka plan */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 1, 
        minHeight: '100vh', 
        background: 'transparent',
      }}>
        {/* Üst bar */}
        <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none', pt: 2 }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LogoIcon sx={{ fontSize: 36, color: '#fff', mr: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-1px', color: '#fff' }}>
                AutoPanel
              </Typography>
            </Box>
            {/* Sağ üstte giriş yap veya profil */}
            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                <img
                  src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={user?.username || 'Profil'}
                  style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 8, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(99,102,241,0.18)' }}
                />
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>{user?.username}</Typography>
              </Box>
            ) : (
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
                onClick={handleLoginClick}
                disabled={loading}
              >
                Giriş Yap
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ pt: 12, pb: 8 }}>
          <Stack spacing={4} alignItems="center">
            <Typography variant="h2" align="center" sx={{ color: '#fff', fontWeight: 900, letterSpacing: '-2px', mb: 2 }}>
              Discord için ihtiyacınız olan tek botla tanışın
            </Typography>
            <Typography variant="h5" align="center" sx={{ color: '#b3b3c6', fontWeight: 400, mb: 2 }}>
              Birçok özellik barındıran ve her geçen gün daha da gelişen AutoPanel ile sunucunuzu renklendirin.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                startIcon={<ForumIcon />}
                sx={{
                  background: 'linear-gradient(90deg, #5865F2 0%, #7c3aed 100%)',
                  color: '#fff',
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  boxShadow: '0 2px 8px rgba(99,102,241,0.18)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #7c3aed 0%, #5865F2 100%)',
                    opacity: 0.95,
                  },
                }}
                href={BOT_INVITE_URL}
                target="_blank"
              >
                Discord'a Ekle
              </Button>
              <Button
                variant="outlined"
                sx={{
                  color: '#fff',
                  borderColor: '#6366f1',
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  '&:hover': {
                    borderColor: '#7c3aed',
                    background: 'rgba(99,102,241,0.08)'
                  },
                }}
                onClick={handlePanelClick}
                disabled={loading}
              >
                Kontrol Paneli
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
} 