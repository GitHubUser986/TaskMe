import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats,
  getUsersStatuses,
  updateHeartbeat
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Statistiques (Admin et SuperAdmin)
router.get('/stats', authorize('ADMIN', 'SUPERADMIN'), getUserStats);

// Liste et création d'utilisateurs
router.route('/')
  .get(getAllUsers)  // Tous les utilisateurs authentifiés peuvent voir la liste
  .post(authorize('ADMIN', 'SUPERADMIN'), createUser);  // Seulement Admin/SuperAdmin peuvent créer

// Opérations sur un utilisateur spécifique
router.route('/:id')
  .get(getUserById)
  .put(authorize('ADMIN', 'SUPERADMIN'), updateUser)
  .delete(authorize('SUPERADMIN'), deleteUser);  // Seulement SuperAdmin peut supprimer

// Basculer le statut actif/inactif
router.patch('/:id/toggle-status', authorize('ADMIN', 'SUPERADMIN'), toggleUserStatus);

// Route pour récupérer les statuts de plusieurs utilisateurs
// GET /api/users/statuses?ids=USER1,USER2,USER3
router.get('/statuses', protect, getUsersStatuses);

// Route pour mettre à jour l'activité de l'utilisateur (heartbeat)
// PUT /api/users/heartbeat
router.put('/heartbeat', protect, updateHeartbeat);

export default router;