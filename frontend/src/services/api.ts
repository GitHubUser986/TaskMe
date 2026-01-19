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

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

// Utilisateurs
export const userAPI = {
  getAll: (params?: {
    search?: string;
    specialite?: string;
    grade?: string;
    role?: string;
    actif?: boolean;
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

// Dashboard API
export { dashboardAPI } from './dashboardAPI';

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
  
  // Method specifically for FormData
  create: (data: any) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.post('/tache', data, config);
  },
  
  update: (id: string, data: any) => {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.put(`/tache/${id}`, data, config);
  },
  
  delete: (id: string) => api.delete(`/tache/${id}`),
};

// Affectations
export const affectationAPI = {
  getAll: (params?: any) => api.get('/affectation', { params }),
  getById: (id: string) => api.get(`/affectation/${id}`),
  getAssignement: (id: string) => api.get(`/affectation/assignment/${id}`),
  create: (data: any) => api.post('/affectation', data),
  update: (id: string, data: any) => api.put(`/affectation/update/${id}`, data),  
  delete: (id: string) => api.delete(`/affectation/delete/${id}`),

  getUserTasks: (userId: string) => 
    api.get(`/affectation/mytasks/${userId}`),

  getByTask: (taskId: string) => 
    api.get(`/affectation/task/${taskId}`),
   
  // Récupérer les données pour l'affectation manuelle
  getManualData: (idTache: string) =>
    api.get(`/affectation/manual/data/${idTache}`),
  
  // Valider une affectation manuelle
  validateManual: (data: {
    idTache: string;
    auditeursIds: string[];
    vehiculesIds: string[];
  }) => api.post('/affectation/manual/validate', data),
  
  // Créer une affectation manuelle
  createManual: (data: {
    idTache: string;
    auditeursIds: string[];
    vehiculesIds: string[];
  }) => api.post('/affectation/manual/create', data),

    /**
   * Générer une proposition d'affectation semi-automatique
   */
  generateSemiAuto: (data: { idTache: string }) =>
    api.post('/affectation/semi-auto/generate', data),
  
  /**
   * Confirmer une affectation semi-automatique
   */
  confirmSemiAuto: (data: {
    idTache: string;
    auditeursIds: string[];
    vehiculesIds: string[];
    rapport: string;
  }) => api.post('/affectation/semi-auto/confirm', data),
  
  /**
   * Annuler une affectation semi-automatique
   */
  cancelSemiAuto: (idAffectation: string) =>
    api.delete(`/affectation/semi-auto/cancel/${idAffectation}`),
  /**
   * Mettre à jour la décision d'une affectation par son ID
   */

  accepterAffectation: (idAuditeur: string, idTache: string) =>
  api.put(`/affectation/accepter/${idAuditeur}/${idTache}`),
 
  refuserAffectation: (
    idAuditeur: string,
    idTache: string,
    justificatif: string
  ) =>
    api.put(`/affectation/refuser/${idAuditeur}/${idTache}`, {
      justificatif
    }),

  /**
   * Accepter une délégation
   */
  accepterDelegation: (idAuditeur: string, idTache: string) =>
    api.put(`/affectation/delegation/accepter/${idAuditeur}/${idTache}`),

  /**
   * Refuser une délégation
   */
  refuserDelegation: (idAuditeur: string, idTache: string) =>
    api.put(`/affectation/delegation/refuser/${idAuditeur}/${idTache}`),

  /**
   * Déléguer une affectation
   */
  deleguerAffectation: (
    idAuditeur: string,
    idTache: string,
    idAuditeurDelegue: string | string[],
    justificatif?: string
  ) =>
    api.put(`/affectation/deleguer/${idAuditeur}/${idTache}`, {
      decision: 'Déléguée',
      idAuditeurDelegue,
      justificatif
    }),

  /**
   * Générer une proposition d'affectation automatique (IA)
   */
  generateAuto: (data: { idTache: string }) =>
    api.post('/affectation/auto/generate', data),
  
  /**
   * Confirmer une affectation automatique (IA)
   */
  confirmAuto: (data: {
    idTache: string;
    auditeursIds: string[];
    vehiculesIds: string[];
    rapport: string;
  }) => api.post('/affectation/auto/confirm', data),
};

// Chat - Messages par tâche
export const chatAPI = {
  // Obtenir tous les messages d'une tâche
  getMessages: (params: { idTache: string; currentUserId?: string }) => 
    api.get(`/chat/tache/${params.idTache}`, { 
      params: { currentUserId: params.currentUserId } 
    }),
  
  // Envoyer un nouveau message
  sendMessage: (data: {
    ID_EXPEDITEUR: string;
    ID_DESTINATAIRE: string;
    ID_TACHE: string;
    MESSAGE: string;
  }) => api.post('/chat', data),
  
  // Obtenir les participants d'une tâche
  getParticipants: (idTache: string, currentUserId?: string) =>
    api.get(`/chat/tache/${idTache}/participants`, {
      params: { currentUserId }
    }),
  
  // Obtenir les tâches où l'utilisateur participe
  getUserTaches: (userId: string) =>
    api.get(`/affectation/mytasks/${userId}`),

  // Obtenir les statistiques du chat d'une tâche
  getStats: (idTache: string) =>
    api.get(`/chat/tache/${idTache}/stats`),

  // Marquer une notification comme lue
  markAsRead: (id: string) => 
    api.patch(`/notification/${id}/read`),
  
  // Marquer toutes les notifications comme lues
  markAllAsRead: (userId: string) => 
    api.patch(`/notification/read-all/${userId}`),
  
};

// API des statuts utilisateurs
export const userStatusAPI = {
  /**
   * Récupérer les statuts de plusieurs utilisateurs
   * @param userIds - Tableau d'IDs utilisateurs
   */
  getMultipleStatuses: (userIds: string[]) => {
    const idsParam = userIds.join(',');
    return api.get(`/users/statuses?ids=${idsParam}`);
  },

  /**
   * Envoyer un heartbeat pour mettre à jour l'activité
   */
  sendHeartbeat: () => {
    return api.put('/users/heartbeat');
  }
};

// Notifications
export const notificationAPI = {
  // Obtenir toutes les notifications d'un utilisateur
  getByUser: (userId: string) => 
    api.get(`/notification/${userId}`),
  
  // Obtenir toutes les notifications (ancienne méthode pour compatibilité)
  getAll: (params?: any) => 
    api.get('/notification', { params }),

    getUnreadCount: (userId: string) => 
    api.get(`/notification/unread-count/${userId}`),
  
  // Créer une nouvelle notification
  create: (data: {
    ID: string;
    ID_AUDITEUR: string;
    MESSAGE: string;
    TYPE: 'Information' | 'Echoue' | 'Rappel' | 'Succès';
    LUE?: boolean;
  }) => api.post('/notification', data),
  
  // Marquer une notification comme lue
  markAsRead: (id: string) => 
    api.patch(`/notification/${id}/read`),
  
  // Marquer toutes les notifications comme lues
  markAllAsRead: (userId: string) => 
    api.patch(`/notification/read-all/${userId}`),
  
  // Supprimer une notification
  delete: (id: string) => 
    api.delete(`/notification/${id}`),
};

// Historique
export const historiqueAPI = {
  /**
   * Récupérer l'historique global (système uniquement, ID_AUDITEUR = null)
   */
  getGlobal: () => {
    return api.get('/historique/global');
  },

  /**
   * Récupérer tout l'historique avec filtres (historique + affectations combinés)
   * Utilisé par GlobalHistory.tsx
   */
  getAll: (params?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
  }) => {
    // Nettoyer les paramètres vides
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    return api.get('/historique', { params: cleanParams });
  },

  /**
   * Récupérer l'historique d'un utilisateur spécifique
   * Combine l'historique direct + affectations de l'utilisateur
   * Utilisé par IndividualHistory.tsx
   */
  getByUser: (userId: string, params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    type?: string;
  }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    return api.get(`/historique/user/${userId}`, { params: cleanParams });
  },

  /**
   * Récupérer l'historique d'une tâche spécifique
   */
  getByTask: (taskId: string) => {
    return api.get(`/historique/task/${taskId}`);
  },

  /**
   * Récupérer les statistiques d'historique
   */
  getStats: (params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    return api.get('/historique/stats', { params: cleanParams });
  },

  /**
   * Créer un nouvel historique
   */
  create: (data: {
    ID?: string;
    ID_AUDITEUR: string[] | null;
    ID_TACHE: string;
    DETAILS: string;
    ACTION: string;
  }) => {
    return api.post('/historique', data);
  },

  /**
   * Supprimer un historique
   */
  delete: (id: string) => {
    return api.delete(`/historique/${id}`);
  },
};


export default api;