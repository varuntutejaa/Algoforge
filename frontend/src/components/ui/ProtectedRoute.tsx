import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute() {
  const { idToken, loading } = useAuth();

  if (loading) return null;
  return idToken ? <Outlet /> : <Navigate to="/login" replace />;
}
