import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function AuthCallback() {
  const { handleCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const redirect = searchParams.get('redirect');
    if (code) {
      fetch(`${API_URL}/api/auth/discord/callback?code=${code}`, { credentials: 'include' })
        .then(res => res.json())
        .then(async data => {
          if (data.token) {
            await handleCallback(data.token);
            if (redirect === 'dashboard') {
              navigate('/dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          } else {
            navigate('/', { replace: true });
          }
        });
    } else {
      navigate('/', { replace: true });
    }
  }, [handleCallback, navigate, location.search]);

  return null;
} 