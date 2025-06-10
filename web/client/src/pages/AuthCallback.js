import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, loading } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const code = params.get('code');

                if (!code) {
                    console.error('No authorization code found');
                    throw new Error('Authorization code not found');
                }

                console.log('Processing callback with code:', code);
                const loggedInUser = await login(code);
                console.log('Login successful, user:', loggedInUser);

                if (loggedInUser) {
                    console.log('Navigating to dashboard...');
                    navigate('/dashboard', { replace: true });
                } else {
                    console.error('Login failed - no user returned');
                    throw new Error('Login failed - no user returned');
                }
            } catch (error) {
                console.error('Auth error:', error);
                navigate('/', { replace: true });
            }
        };

        if (!loading && !user) {
            handleCallback();
        }
    }, [location, login, navigate, user, loading]);

    // Eğer user zaten varsa, direkt dashboard'a yönlendir
    useEffect(() => {
        if (user && !loading) {
            console.log('User already exists, navigating to dashboard...');
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: '#18181c'
            }}
        >
            <CircularProgress sx={{ color: '#6366f1', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
                Discord ile giriş yapılıyor...
            </Typography>
        </Box>
    );
};

export default AuthCallback; 