import { userStatusAPI } from './api';

export type UserStatus = 'online' | 'offline' | 'away';

interface StatusData {
  status: UserStatus;
  lastActivity: string | null;
}

interface StatusCache {
  [userId: string]: StatusData;
}

/**
 * Service optimisé pour gérer les statuts utilisateurs avec polling intelligent
 */
class UserStatusService {
  private statusCache: StatusCache = {};
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private trackedUserIds: Set<string> = new Set();
  private isActive = false;

  /**
   * Initialiser le service avec heartbeat automatique
   */
  initialize() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.startHeartbeat();
  }

  /**
   * Arrêter le service
   */
  cleanup() {
    this.isActive = false;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.trackedUserIds.clear();
    this.statusCache = {};
  }

  /**
   * Démarrer le suivi des statuts pour une liste d'utilisateurs
   */
  trackUsers(userIds: string[]) {
    // Ajouter les nouveaux utilisateurs à suivre
    userIds.forEach(id => this.trackedUserIds.add(id));
    
    // Démarrer le polling si pas encore actif
    if (!this.pollingInterval && this.trackedUserIds.size > 0) {
      this.startPolling();
    }
    
    // Charger immédiatement les statuts
    this.fetchStatuses();
  }

  /**
   * Arrêter le suivi de certains utilisateurs
   */
  untrackUsers(userIds: string[]) {
    userIds.forEach(id => this.trackedUserIds.delete(id));
    
    // Arrêter le polling si plus personne à suivre
    if (this.trackedUserIds.size === 0 && this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Obtenir le statut d'un utilisateur depuis le cache
   */
  getStatus(userId: string): UserStatus {
    const cached = this.statusCache[userId];
    if (!cached) return 'offline';
    
    // Recalculer le statut basé sur lastActivity
    return this.calculateStatus(cached.lastActivity);
  }

  /**
   * Obtenir tous les statuts en cache
   */
  getAllStatuses(): Record<string, UserStatus> {
    const statuses: Record<string, UserStatus> = {};
    
    Object.keys(this.statusCache).forEach(userId => {
      statuses[userId] = this.getStatus(userId);
    });
    
    return statuses;
  }

  /**
   * Forcer le rafraîchissement des statuts
   */
  async refresh(): Promise<void> {
    await this.fetchStatuses();
  }

  /**
   * Démarrer le polling des statuts
   */
  private startPolling() {
    // Polling toutes les 30 secondes (optimisé)
    this.pollingInterval = setInterval(() => {
      this.fetchStatuses();
    }, 30000);
  }

  /**
   * Démarrer le heartbeat (mise à jour de sa propre activité)
   */
  private startHeartbeat() {
    // Envoyer un heartbeat toutes les 2 minutes
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 120000);
    
    // Envoyer immédiatement
    this.sendHeartbeat();
  }

  /**
   * Récupérer les statuts depuis l'API
   */
  private async fetchStatuses(): Promise<void> {
    if (this.trackedUserIds.size === 0) return;
    
    try {
      const userIds = Array.from(this.trackedUserIds);
      const response = await userStatusAPI.getMultipleStatuses(userIds);
      
      if (response.data.success) {
        this.statusCache = response.data.data;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statuts:', error);
    }
  }

  /**
   * Envoyer un heartbeat au serveur
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      await userStatusAPI.sendHeartbeat();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du heartbeat:', error);
    }
  }

  /**
   * Calculer le statut basé sur lastActivity
   */
  private calculateStatus(lastActivity: string | null): UserStatus {
    if (!lastActivity) return 'offline';
    
    const now = new Date();
    const lastActivityDate = new Date(lastActivity);
    const diffMinutes = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'away';
    return 'offline';
  }
}

// Instance singleton
const userStatusService = new UserStatusService();

export default userStatusService;