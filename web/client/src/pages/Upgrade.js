import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Star as StarIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Announcement as AnnouncementIcon,
  CardGiftcard as GiveawayIcon,
  Search as WordWatchIcon,
  Timer as TempRoleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme, premium }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  border: premium ? `2px solid ${theme.palette.secondary.main}` : 'none',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)'
  }
}));

const PremiumBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  backgroundColor: theme.palette.secondary.main,
  color: 'white',
  padding: theme.spacing(0.5, 2),
  borderBottomLeftRadius: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5)
}));

const features = [
  {
    name: 'Announcements',
    icon: <AnnouncementIcon />,
    free: 'Limited to 5 per month',
    premium: 'Unlimited announcements'
  },
  {
    name: 'Giveaways',
    icon: <GiveawayIcon />,
    free: 'Limited to 3 per month',
    premium: 'Unlimited giveaways'
  },
  {
    name: 'Word Watches',
    icon: <SecurityIcon />,
    free: 'Limited to 5 words',
    premium: 'Unlimited word watches'
  },
  {
    name: 'Temporary Roles',
    icon: <StarIcon />,
    free: 'Not available',
    premium: 'Available'
  },
  {
    name: 'Priority Support',
    icon: <SupportIcon />,
    free: 'Community support',
    premium: 'Priority support'
  },
  {
    name: 'Advanced Security',
    icon: <SecurityIcon />,
    free: 'Basic protection',
    premium: 'Advanced protection'
  },
  {
    name: 'Performance',
    icon: <SpeedIcon />,
    free: 'Standard',
    premium: 'Enhanced'
  }
];

function Upgrade() {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        setSnackbar({
          open: true,
          message: 'Error loading server information',
          severity: 'error'
        });
      }
    };

    fetchServer();
  }, [guildId]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/premium/server/${guildId}/upgrade`, {
        plan: 'premium',
        duration: 1 // 1 month
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbar({
        open: true,
        message: 'Successfully upgraded to premium!',
        severity: 'success'
      });
      // Refresh server data
      const response = await axios.get(`http://localhost:5000/api/servers/${guildId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServer(response.data);
      navigate(`/servers/${guildId}/settings`);
    } catch (error) {
      console.error('Error upgrading server:', error);
      setError('Failed to upgrade server. Please try again later.');
      setUpgrading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!server) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Server not found</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upgrade to Premium
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Unlock all features and get unlimited access to AutoPanel's powerful tools.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {/* Free Plan */}
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Free Plan
                </Typography>
                <Typography variant="h3" component="div" gutterBottom>
                  $0
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Perfect for small communities
                </Typography>
                <List>
                  {features.map((feature) => (
                    <ListItem key={feature.name}>
                      <ListItemIcon>
                        {feature.free === 'Not available' ? (
                          <CloseIcon color="error" />
                        ) : (
                          <CheckIcon color="primary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.name}
                        secondary={feature.free}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="outlined"
                  disabled={!server.premium}
                >
                  Current Plan
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>

          {/* Premium Plan */}
          <Grid item xs={12} md={6}>
            <StyledCard premium>
              <PremiumBadge>
                <StarIcon fontSize="small" />
                Premium
              </PremiumBadge>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Premium Plan
                </Typography>
                <Typography variant="h3" component="div" gutterBottom>
                  $9.99
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Best for growing communities
                </Typography>
                <List>
                  {features.map((feature) => (
                    <ListItem key={feature.name}>
                      <ListItemIcon>
                        <CheckIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature.name}
                        secondary={feature.premium}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={handleUpgrade}
                  disabled={upgrading || server.premium}
                >
                  {upgrading ? 'Upgrading...' : server.premium ? 'Already Premium' : 'Upgrade Now'}
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Upgrade; 