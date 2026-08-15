import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

const RequirePermission = ({ permission, children }) => {
  const { can } = useCompany();
  if (!can(permission)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default RequirePermission;
