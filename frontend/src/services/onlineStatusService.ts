/**
 * Service pour gérer le statut en ligne des utilisateurs
 * Utilise la mémoire de la session (sans localStorage)
 */

export type UserStatus = 'online' | 'offline' | 'away';

interface UserStatusData {
  userId: string;
  status: UserStatus;
  lastActivity: number;
}

const ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes d'inactivité = away
const OFFLINE_TIMEOUT = 15 * 60 * 1000; // 15 minutes = offline

class OnlineStatusService {
  private currentUserId: string | null = null;
    private activityInterval: ReturnType<typeof setInterval> | null = null;
    private statusCheckInterval: ReturnType<typeof setInterval> | null = null;
  private statusMap: Map<string, UserStatusData> = new Map();

  /**
   * Initialiser le service avec l'ID de l'utilisateur actuel
   */
  initialize(userId: string) {
    this.currentUserId = userId;
    this.setStatus(userId, 'online');
    this.startActivityTracking();
    this.startStatusCheck();
  }

  /**
   * Arrêter le service (déconnexion)
   */
  cleanup() {
    if (this.currentUserId) {
      this.setStatus(this.currentUserId, 'offline');
    }
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }

  /**
   * Définir le statut d'un utilisateur
   */
  setStatus(userId: string, status: UserStatus) {
    this.statusMap.set(userId, {
      userId,
      status,
      lastActivity: Date.now()
    });
  }

  /**
   * Obtenir le statut d'un utilisateur
   */
  getStatus(userId: string): UserStatus {
    const userStatus = this.statusMap.get(userId);
    
    if (!userStatus) {
      return 'offline';
    }

    // Calculer le statut basé sur la dernière activité
    const timeSinceActivity = Date.now() - userStatus.lastActivity;
    
    if (timeSinceActivity > OFFLINE_TIMEOUT) {
      return 'offline';
    } else if (timeSinceActivity > ACTIVITY_TIMEOUT) {
      return 'away';
    }
    
    return userStatus.status;
  }

  /**
   * Mettre à jour l'activité de l'utilisateur actuel
   */
  updateActivity() {
    if (this.currentUserId) {
      this.setStatus(this.currentUserId, 'online');
    }
  }

  /**
   * Démarrer le suivi d'activité
   */
  private startActivityTracking() {
    // Écouter les événements d'activité
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      this.updateActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Mettre à jour toutes les 30 secondes
    this.activityInterval = setInterval(() => {
      this.updateActivity();
    }, 30000);
  }

  /**
   * Vérifier périodiquement les statuts pour détecter l'inactivité
   */
  private startStatusCheck() {
    this.statusCheckInterval = setInterval(() => {
      const now = Date.now();
      
      this.statusMap.forEach((userStatus, userId) => {
        const timeSinceActivity = now - userStatus.lastActivity;
        
        // Mettre à jour le statut basé sur l'inactivité
        if (timeSinceActivity > OFFLINE_TIMEOUT && userStatus.status !== 'offline') {
          userStatus.status = 'offline';
        } else if (timeSinceActivity > ACTIVITY_TIMEOUT && userStatus.status === 'online') {
          userStatus.status = 'away';
        }
      });
    }, 60000); // Vérifier toutes les minutes
  }

  /**
   * Obtenir les statuts de plusieurs utilisateurs
   */
  getMultipleStatuses(userIds: string[]): Record<string, UserStatus> {
    const statuses: Record<string, UserStatus> = {};
    userIds.forEach(userId => {
      statuses[userId] = this.getStatus(userId);
    });
    return statuses;
  }

  /**
   * Forcer un statut spécifique (pour away/offline manuel)
   */
  forceStatus(status: UserStatus) {
    if (this.currentUserId) {
      this.setStatus(this.currentUserId, status);
    }
  }
}

// Instance singleton
const onlineStatusService = new OnlineStatusService();

export default onlineStatusService;