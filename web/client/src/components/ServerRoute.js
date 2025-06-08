import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Loading from './Loading';
import { Alert, Box } from '@mui/material';

export default function ServerRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { serverId } = useParams();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/servers/${serverId}/access`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setHasAccess(response.data.hasAccess);
        setLoading(false);
      } catch (err) {
        setError('Failed to verify server access. Please try again later.');
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAccess();
    }
  }, [user, authLoading, serverId]);

  if (authLoading || loading) {
    return <Loading message="Checking server access..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
} 