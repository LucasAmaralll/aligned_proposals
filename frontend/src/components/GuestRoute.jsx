import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const GuestRoute = ({ children }) => {
  const { signed, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  return signed ? <Navigate to="/dashboard" replace /> : children;
};

export default GuestRoute;
