import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerPanel from './pages/ServerPanel';
import Settings from './pages/Settings';
import Upgrade from './pages/Upgrade';
import Profile from './pages/Profile';

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
      default: '#36393f', // Discord arka plan
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

// Korumalı route bileşeni
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigation />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="server/:guildId" element={<ServerPanel />} />
              <Route path="server/:guildId/settings" element={<Settings />} />
              <Route path="server/:guildId/upgrade" element={<Upgrade />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 