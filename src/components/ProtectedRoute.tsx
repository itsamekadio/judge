import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { currentUser, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-sky-400 mb-4" />
        <p className="text-lg font-medium">جاري تحميل منصة جادج...</p>
        <span className="text-xs text-slate-500 mt-1">JUDGE Educational Platform</span>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login preserving destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Non-admin attempting to access admin route
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
