import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, User, LogOut, Loader2 } from 'lucide-react';
import { authAPI } from '../../services/api';

interface UserData {
  ID: string;
  NOM: string;
  PRENOM: string;
  EMAIL: string;
  ROLE: string;
}

const Navbar: React.FC = () => {
  const [notificationCount] = useState(3);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getMe();
        setUser(response.data.data.user);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'utilisateur:', err);
        // Si l'utilisateur n'est pas authentifié, rediriger vers login
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    // Supprimer le token et les données utilisateur
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Rediriger vers la page de connexion
    navigate('/login');
  };

  if (loading) {
    return (
      <nav className="w-full h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg flex items-center justify-center px-8">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </nav>
    );
  }

  const userName = user ? `${user.PRENOM} ${user.NOM}` : 'Utilisateur';
  const userInitials = user ? `${user.PRENOM[0]}${user.NOM[0]}` : 'U';

  return (
    <nav className="w-full h-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg flex items-center justify-between px-8 relative overflow-hidden">
      
      {/* Effet de lueur animé */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
      
      {/* Left side: Greeting with animation */}
      <div className="flex items-center space-x-4 relative z-10">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
          {userInitials.toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Bienvenue, {user?.PRENOM}</h1>
          <p className="text-xs text-gray-300">Ravi de vous revoir</p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center space-x-4 relative z-10">
        
        {/* Notifications */}
        <NavLink 
          to="/notifications" 
          className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 group"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-full text-xs font-bold text-white flex items-center justify-center shadow-lg animate-pulse">
              {notificationCount}
            </span>
          )}
        </NavLink>

        {/* Chat */}
        <NavLink 
          to="/chat" 
          className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
        >
          <MessageCircle className="w-5 h-5" />
        </NavLink>

        {/* Divider */}
        <div className="h-8 w-px bg-white/20"></div>

        {/* Profile */}
        <NavLink
          to="/profile"
          className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
        >
          <User className="w-5 h-5" />
          <span className="hidden lg:inline font-medium">{userName}</span>
        </NavLink>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:inline font-medium">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;