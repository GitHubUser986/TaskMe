import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  _id: string;
  ID: string;
  NOM: string;
  PRENOM: string;
  EMAIL: string;
  ROLE: 'SUPERADMIN' | 'ADMIN' | 'USER';
  GRADE: string;
  SPECIALITE: string;
  ACTIF: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Vérifier que le token est toujours valide
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Vérifier la validité du token
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await authAPI.getMe();
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Token invalide:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Connexion
  const login = async (email: string, password: string) => {
    try {
      const payload = { EMAIL: email, MOT_DE_PASSE: password };
      const response = await authAPI.login(payload);
      
      if (response.data.success) {
        const { user: userData, token: userToken } = response.data.data;
        
        setUser(userData);
        setToken(userToken);
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  // Déconnexion
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Mettre à jour l'utilisateur
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.ROLE) : false;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};