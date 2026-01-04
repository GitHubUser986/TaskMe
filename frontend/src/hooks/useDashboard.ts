import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/dashboardAPI';
import type { DashboardData } from '../types/dashboard.types';

interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook personnalisé pour récupérer les données du dashboard
 */
export const useDashboard = (): UseDashboardReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await dashboardAPI.getStats();
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError('Erreur lors de la récupération des données');
      }
    } catch (err: any) {
      console.error('Erreur fetchDashboardData:', err);
      setError(
        err.response?.data?.message || 
        'Impossible de charger les données du dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  };
};