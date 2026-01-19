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

// Utility function to decode JWT token
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Date.now() / 1000;
  
  // Add 10 second buffer to prevent edge cases
  return decoded.exp < currentTime + 10;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear auth data
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        console.log('Token expired on mount, clearing auth data');
        clearAuthData();
        setLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
        // Verify token is still valid with backend
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        clearAuthData();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Set up token expiration check interval
  useEffect(() => {
    if (!token) return;

    // Check token expiration every minute
    const intervalId = setInterval(() => {
      if (isTokenExpired(token)) {
        console.log('Token expired, logging out');
        logout();
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(intervalId);
  }, [token]);

  // Verify token validity with backend
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await authAPI.getMe();
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error: any) {
      console.error('Token validation failed:', error);
      
      // Only logout if it's an auth error (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearAuthData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const payload = { EMAIL: email, MOT_DE_PASSE: password };
      const response = await authAPI.login(payload);
      
      if (response.data.success) {
        const { user: userData, token: userToken } = response.data.data;
        
        // Verify token is not expired
        if (isTokenExpired(userToken)) {
          throw new Error('Le token reçu est déjà expiré');
        }
        
        setUser(userData);
        setToken(userToken);
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  // Logout
  const logout = () => {
    clearAuthData();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Update user
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Check if user has specific role
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
    isAuthenticated: !!user && !!token && !isTokenExpired(token || ''),
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};