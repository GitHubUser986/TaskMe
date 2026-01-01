import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats
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

export default router;