import api from './api';
import type {
  DashboardResponse,
  TaskDistributionResponse,
  MonthlyStatsResponse,
  EquityIndicatorsResponse
} from '../types/dashboard.types';

/**
 * API pour le dashboard
 */
export const dashboardAPI = {
  /**
   * Récupère toutes les statistiques du dashboard
   */
  getStats: () => 
    api.get<DashboardResponse>('/dashboard/stats'),

  /**
   * Récupère la distribution des tâches par type
   */
  getTasksDistribution: () =>
    api.get<TaskDistributionResponse>('/dashboard/tasks-distribution'),

  /**
   * Récupère les statistiques mensuelles
   */
  getMonthlyStats: () =>
    api.get<MonthlyStatsResponse>('/dashboard/monthly-stats'),

  /**
   * Récupère les indicateurs d'équité
   */
  getEquityIndicators: () =>
    api.get<EquityIndicatorsResponse>('/dashboard/equity-indicators'),
};

export default dashboardAPI;