import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/AdminService';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.email || !adminService.isAdmin(user.email)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;