import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les rôles autorisés si spécifiés
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.ROLE)) {
      // Rediriger vers le dashboard avec un message d'erreur
      return <Navigate to="/dashboard" replace state={{ error: 'Accès non autorisé' }} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;