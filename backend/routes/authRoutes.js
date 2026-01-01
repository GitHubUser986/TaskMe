import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} from '../utils/validators.js';

const router = express.Router();

// Routes publiques (sans authentification)
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Routes protégées (nécessitent authentification)
router.get('/me', protect, getMe);
router.put('/profile', protect, validateUpdateProfile, updateProfile);
router.put('/change-password', protect, validateChangePassword, changePassword);

//  Routes admin uniquement
router.get('/users', protect, authorize('SUPERADMIN'), getAllUsers);
router.get('/users/:id', protect, authorize('SUPERADMIN'), getUserById);
router.delete('/users/:id', protect, authorize('SUPERADMIN'), deleteUser);

export default router;