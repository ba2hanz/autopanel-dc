import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerPanel from './pages/ServerPanel';
import ServerSettings from './pages/ServerSettings';
import WelcomeSettings from './pages/WelcomeSettings';
import LogSettings from './pages/LogSettings';
import ModerationSettings from './pages/ModerationSettings';
import Polls from './pages/settings/Polls';
import ReactionRole from './pages/settings/ReactionRole';
import Upgrade from './pages/Upgrade';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import { Toaster } from 'react-hot-toast';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Discord benzeri koyu tema
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7289da', // Discord mavi
    },
    secondary: {
      main: '#43b581', // Discord yeşil
    },
    background: {
      default: '#18181c', // Tüm sayfa için koyu arka plan
      paper: '#2f3136',   // Discord kart arka planı
    },
  },
  typography: {
    fontFamily: '"Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#2f3136',
        },
      },
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="server/:guildId" element={<ServerPanel />} />
                <Route path="server/:guildId/settings" element={<ServerSettings />} />
                <Route path="server/:guildId/settings/logs" element={<LogSettings />} />
                <Route path="server/:guildId/settings/welcome" element={<WelcomeSettings />} />
                <Route path="server/:guildId/settings/moderation" element={<ModerationSettings />} />
                <Route path="server/:guildId/settings/polls" element={<Polls />} />
                <Route path="server/:guildId/settings/reactionrole" element={<ReactionRole />} />
                <Route path="server/:guildId/upgrade" element={<Upgrade />} />
              </Route>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 