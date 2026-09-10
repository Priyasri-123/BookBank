import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a page that requires login. Optionally restrict to specific roles
 * via `roles={['ADMIN','LIBRARIAN']}`. If the user isn't logged in they're
 * sent to /login; if logged in but wrong role, sent to their own dashboard.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
