import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const PrivateRoute = ({ children }) => {
  const { signed, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  return signed ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
