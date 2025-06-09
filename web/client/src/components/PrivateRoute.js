import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  if (!user) {
    // Redirect to ana sayfa but save the attempted url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
} 