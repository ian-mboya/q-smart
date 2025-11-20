import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ allowed = [], children, redirectTo = '/signin' }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or spinner
  if (!user) return <Navigate to={redirectTo} replace />;
  if (allowed.length > 0 && !allowed.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}