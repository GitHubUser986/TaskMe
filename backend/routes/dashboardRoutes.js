import express from 'express';
import {
  getDashboardStats,
  getTasksDistribution,
  getMonthlyStats,
  getEquityIndicators
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Récupère toutes les statistiques du dashboard
 * @access  Private (tous les utilisateurs authentifiés)
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/dashboard/tasks-distribution
 * @desc    Récupère la distribution des tâches par type
 * @access  Private
 */
router.get('/tasks-distribution', getTasksDistribution);

/**
 * @route   GET /api/dashboard/monthly-stats
 * @desc    Récupère les statistiques mensuelles
 * @access  Private
 */
router.get('/monthly-stats', getMonthlyStats);

/**
 * @route   GET /api/dashboard/equity-indicators
 * @desc    Récupère les indicateurs d'équité
 * @access  Private (Admin et SuperAdmin uniquement)
 */
router.get('/equity-indicators', authorize('ADMIN', 'SUPERADMIN'), getEquityIndicators);

export default router;