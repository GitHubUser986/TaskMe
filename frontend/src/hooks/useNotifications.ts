import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';

interface UseNotificationsReturn {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personnalisé pour récupérer le nombre de notifications non lues
 * @param userId - ID de l'utilisateur
 * @param refreshInterval - Intervalle de rafraîchissement en ms (optionnel)
 */
export const useNotifications = (
  userId: string | null,
  refreshInterval?: number
): UseNotificationsReturn => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await notificationAPI.getUnreadCount(userId);
      
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      } else {
        setError('Erreur lors de la récupération des notifications');
      }
    } catch (err: any) {
      console.error('Erreur fetchUnreadCount:', err);
      setError(
        err.response?.data?.message || 
        'Impossible de charger les notifications'
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUnreadCount();

    // Rafraîchissement automatique si un intervalle est défini
    if (refreshInterval && userId) {
      const intervalId = setInterval(fetchUnreadCount, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchUnreadCount, refreshInterval, userId]);

  return {
    unreadCount,
    loading,
    error,
    refetch: fetchUnreadCount
  };
};