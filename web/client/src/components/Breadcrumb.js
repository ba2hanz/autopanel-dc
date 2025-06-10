import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Typography,
  Breadcrumbs,
  Link,
  Avatar,
  Box
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Route -> Breadcrumb mapping
const routeMap = {
  dashboard: 'Ana Sayfa',
  servers: 'Sunucularım',
  settings: 'Ayarlar',
  welcome: 'Karşılama & Veda',
  moderation: 'Otomatik Moderasyon',
  logs: 'Denetim Kaydı',
  autoresponse: 'Otomatik Cevap',
  reactionrole: 'Tepki Rolleri'
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Breadcrumb({ currentPage, compact, sx }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [server, setServer] = useState(null);

  useEffect(() => {
    if (params.guildId) {
      fetch(`${API_URL}/api/servers/${params.guildId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setServer(data))
        .catch(() => setServer(null));
    }
  }, [params.guildId]);

  // Parse the path and build breadcrumb items
  const pathnames = location.pathname.split('/').filter(Boolean);
  const items = [];

  // Always add Ana Sayfa
  items.push({ label: 'Ana Sayfa', to: '/' });

  // If user is in a server context, add Sunucularım
  if (pathnames.includes('server')) {
    items.push({ label: 'Sunucularım', to: '/dashboard' });
  }

  // If in a specific server, add server name + icon
  if (server && params.guildId) {
    items.push({
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={server.icon ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png` : '/default-server.png'}
            alt={server.name}
            sx={{ width: 24, height: 24, mr: 1 }}
          />
          <span>{server.name}</span>
        </Box>
      ),
      to: `/dashboard/server/${server.guildId}/settings`,
    });
  }

  // If in settings or sub-settings
  if (pathnames.includes('settings')) {
    items.push({ label: 'Ayarlar', to: `/dashboard/server/${params.guildId}/settings` });
  }

  // Sub-settings (welcome, moderation, etc.)
  const subSetting = pathnames[pathnames.length - 1];
  if (
    ['welcome', 'moderation', 'logs', 'autoresponse', 'emojirole', 'other'].includes(subSetting)
  ) {
    items.push({ label: routeMap[subSetting] || currentPage, to: null });
  } else if (currentPage && items[items.length - 1]?.label !== currentPage) {
    items.push({ label: currentPage, to: null });
  }

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{
        color: '#fff',
        fontWeight: 500,
        fontSize: compact ? '1rem' : '1.1rem',
        ...sx
      }}
    >
      {items.map((item, idx) =>
        item.to ? (
          <Link
            key={idx}
            component="button"
            variant="body1"
            onClick={() => navigate(item.to)}
            sx={{
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              '&:hover': { color: '#b3b3c6' }
            }}
          >
            {item.label}
          </Link>
        ) : (
          <Typography key={idx} color="#fff" variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
            {item.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
} 