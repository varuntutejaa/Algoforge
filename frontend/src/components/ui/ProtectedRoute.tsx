import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  return localStorage.getItem('algoforge-auth') === 'true'
    ? <Outlet />
    : <Navigate to="/login" replace />;
}
