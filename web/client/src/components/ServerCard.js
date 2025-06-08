import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Upgrade as UpgradeIcon,
  Star as StarIcon
} from '@mui/icons-material';

export default function ServerCard({ server }) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={server.icon}
            alt={server.name}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div" noWrap>
              {server.name}
            </Typography>
            <Chip
              icon={server.premium ? <StarIcon /> : null}
              label={server.premium ? 'Premium' : 'Free'}
              color={server.premium ? 'primary' : 'default'}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {server.memberCount} members
        </Typography>

        {server.features && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Features:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                size="small"
                label={`Announcements: ${server.usage?.announcements || 0}/${server.features?.maxAnnouncements || 0}`}
                color={server.usage?.announcements >= server.features?.maxAnnouncements ? 'error' : 'default'}
              />
              <Chip
                size="small"
                label={`Giveaways: ${server.usage?.giveaways || 0}/${server.features?.maxGiveaways || 0}`}
                color={server.usage?.giveaways >= server.features?.maxGiveaways ? 'error' : 'default'}
              />
              <Chip
                size="small"
                label={`Word Watches: ${server.usage?.wordWatches || 0}/${server.features?.maxWordWatches || 0}`}
                color={server.usage?.wordWatches >= server.features?.maxWordWatches ? 'error' : 'default'}
              />
            </Box>
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Tooltip title="Server Settings">
          <IconButton
            onClick={() => navigate(`/servers/${server.id}/settings`)}
            size="small"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        {!server.premium && (
          <Button
            startIcon={<UpgradeIcon />}
            color="primary"
            onClick={() => navigate(`/servers/${server.id}/upgrade`)}
            size="small"
          >
            Upgrade
          </Button>
        )}
      </CardActions>
    </Card>
  );
} 