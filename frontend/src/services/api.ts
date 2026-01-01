import axios from 'axios';

// Configuration de base
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instance axios avec configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentification
export const authAPI = {
  login: (payload: { EMAIL: string; MOT_DE_PASSE: string }) =>
    api.post('/auth/login', payload),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getMe: () =>
    api.get('/auth/me'),
  
  updateProfile: (userData: any) =>
    api.put('/auth/profile', userData),
  
  changePassword: (passwordData: any) =>
    api.put('/auth/change-password', passwordData),
};

// Utilisateurs
export const userAPI = {
  getAll: (params?: {
    search?: string;
    specialite?: string;
    grade?: string;
    role?: string;
    actif?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/user', { params }),
  
  getById: (id: string) =>
    api.get(`/user/${id}`),
  
  create: (userData: any) =>
    api.post('/user', userData),
  
  update: (id: string, userData: any) =>
    api.put(`/user/${id}`, userData),
  
  toggleStatus: (id: string) =>
    api.patch(`/user/${id}/toggle-status`),
  
  delete: (id: string) =>
    api.delete(`/user/${id}`),
  
  getStats: () =>
    api.get('/user/stats'),
};

// Véhicules
export const vehiculeAPI = {
  getAll: (params?: any) => api.get('/vehicule', { params }),
  getById: (id: string) => api.get(`/vehicule/${id}`),
  create: (data: any) => api.post('/vehicule', data),
  update: (id: string, data: any) => api.put(`/vehicule/${id}`, data),
  delete: (id: string) => api.delete(`/vehicule/${id}`),
};

// Tâches
export const tacheAPI = {
  getAll: (params?: any) => api.get('/tache', { params }),
  getById: (id: string) => api.get(`/tache/${id}`),
  create: (data: any) => api.post('/tache', data),
  update: (id: string, data: any) => api.put(`/tache/${id}`, data),
  delete: (id: string) => api.delete(`/tache/${id}`),
};

// Affectations
export const affectationAPI = {
  getAll: (params?: any) => api.get('/affectation', { params }),
  getById: (id: string) => api.get(`/affectation/${id}`),
  create: (data: any) => api.post('/affectation', data),
  update: (id: string, data: any) => api.put(`/affectation/${id}`, data),
  delete: (id: string) => api.delete(`/affectation/${id}`),
};

// Chat
export const chatAPI = {
  getMessages: (params?: any) => api.get('/chat', { params }),
  sendMessage: (data: any) => api.post('/chat', data),
  deleteMessage: (id: string) => api.delete(`/chat/${id}`),
};

// Notifications
export const notificationAPI = {
  getAll: (params?: any) => api.get('/notification', { params }),
  markAsRead: (id: string) => api.patch(`/notification/${id}/read`),
  markAllAsRead: () => api.patch('/notification/read-all'),
  delete: (id: string) => api.delete(`/notification/${id}`),
};

// Historique
export const historiqueAPI = {
  getAll: (params?: any) => api.get('/historique', { params }),
  getById: (id: string) => api.get(`/historique/${id}`),
};

export default api;