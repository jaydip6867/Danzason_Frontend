import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ moduleName, action = 'view' }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="loading-box" style={{ height: '100vh' }}>
        <Loader2 className="animate-spin" size={36} color="var(--color-primary)" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (moduleName && !hasPermission(moduleName, action)) {
    return (
      <div className="card" style={{ textAlign: 'center', margin: '40px' }}>
        <h2 style={{ color: 'var(--color-danger)', marginBottom: '8px' }}>
          Access Denied
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          You do not have permission to access the {moduleName} module. Contact your administrator.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
