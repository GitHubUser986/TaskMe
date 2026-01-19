import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loader while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-400 mt-4">Vérification...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check allowed roles if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.ROLE)) {
      // Redirect to home page with error message for unauthorized access
      return <Navigate to="/" replace state={{ error: 'Accès non autorisé à cette page' }} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;  