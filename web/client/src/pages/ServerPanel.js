import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Star as StarIcon,
  Announcement as AnnouncementIcon,
  CardGiftcard as GiveawayIcon,
  Search as WordWatchIcon,
  Timer as TempRoleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    cursor: 'pointer'
  }
}));

const PremiumBanner = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.secondary.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function ServerPanel() {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  console.log('ServerPanel render');

  useEffect(() => {
    console.log('ServerPanel useEffect');
    const fetchServer = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/servers/${guildId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setServer(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching server:', error);
        setLoading(false);
      }
    };

    fetchServer();
  }, [guildId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUpgradeClick = () => {
    navigate(`/dashboard/server/${guildId}/upgrade`);
  };

  const handleSettingsClick = () => {
    navigate(`/dashboard/server/${guildId}/settings`);
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!server) {
    return (
      <Container>
        <Alert severity="error">Server not found</Alert>
      </Container>
    );
  }

  const features = [
    {
      title: 'Announcements',
      icon: <AnnouncementIcon />,
      description: 'Create and manage server announcements',
      usage: server.usage.announcements,
      limit: server.features.maxAnnouncements,
      premium: server.premium
    },
    {
      title: 'Giveaways',
      icon: <GiveawayIcon />,
      description: 'Host and manage giveaways',
      usage: server.usage.giveaways,
      limit: server.features.maxGiveaways,
      premium: server.premium
    },
    {
      title: 'Word Watches',
      icon: <WordWatchIcon />,
      description: 'Monitor specific words in channels',
      usage: server.usage.wordWatches,
      limit: server.features.maxWordWatches,
      premium: server.premium
    },
    {
      title: 'Temporary Roles',
      icon: <TempRoleIcon />,
      description: 'Assign temporary roles to users',
      usage: server.usage.tempRoles,
      limit: server.features.maxTempRoles,
      premium: server.premium
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <img
            src={server.icon ? `https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png` : '/default-server.png'}
            alt={server.name}
            style={{ width: 64, height: 64, borderRadius: '50%', marginRight: 16 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1">
              {server.name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Server ID: {server.guildId}
            </Typography>
          </Box>
          <Tooltip title="Server Settings">
            <IconButton onClick={handleSettingsClick} size="large">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {!server.premium && (
          <PremiumBanner>
            <Box>
              <Typography variant="h6">
                Upgrade to Premium
              </Typography>
              <Typography variant="body2">
                Get unlimited access to all features
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpgradeClick}
              startIcon={<StarIcon />}
            >
              Upgrade Now
            </Button>
          </PremiumBanner>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Features" />
            <Tab label="Settings" />
            <Tab label="Logs" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {features.map((feature) => (
                <Grid item xs={12} sm={6} md={3} key={feature.title}>
                  <FeatureCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {feature.icon}
                        <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                          {feature.title}
                        </Typography>
                        {feature.premium && (
                          <Chip
                            icon={<StarIcon />}
                            label="Premium"
                            size="small"
                            color="secondary"
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {feature.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          Usage:
                        </Typography>
                        <Chip
                          size="small"
                          label={`${feature.usage}/${feature.limit}`}
                          color={feature.usage >= feature.limit ? 'error' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </CardContent>
                  </FeatureCard>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography>Server settings will be implemented here</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography>Server logs will be implemented here</Typography>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

export default ServerPanel; 