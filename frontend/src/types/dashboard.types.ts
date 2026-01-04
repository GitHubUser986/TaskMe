/**
 * Types pour le Dashboard
 */

export interface DashboardStats {
  total: number;
  remunerated: number;
  nonRemunerated: number;
  totalHours: number;
}

export interface AuditorStats {
  id: string;
  name: string;
  tasks: number;
  hours: number;
  remuneratedTasks: number;
  nonRemuneratedTasks: number;
}

export interface DashboardData {
  stats: DashboardStats;
  auditors: AuditorStats[];
}

export interface TaskDistribution {
  [key: string]: number;
}

export interface MonthlyStats {
  [month: string]: {
    total: number;
    remunerated: number;
    nonRemunerated: number;
  };
}

export interface EquityIndicators {
  taskDistribution: {
    max: number;
    min: number;
    gap: number;
    equityPercentage: string;
  };
  hourDistribution: {
    max: number;
    min: number;
    gap: number;
    equityPercentage: string;
  };
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

export interface TaskDistributionResponse {
  success: boolean;
  message: string;
  data: {
    distribution: TaskDistribution;
  };
}

export interface MonthlyStatsResponse {
  success: boolean;
  message: string;
  data: {
    monthlyData: MonthlyStats;
  };
}

export interface EquityIndicatorsResponse {
  success: boolean;
  message: string;
  data: EquityIndicators;
}