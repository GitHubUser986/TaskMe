import express from 'express';
import {
  getNotificationsByUser,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/notification/unread-count/:idUser
 * @desc    Récupère le nombre de notifications non lues
 * @access  Private
 */
router.get('/unread-count/:idUser', getUnreadCount);

/**
 * @route   GET /api/notification/:idUser
 * @desc    Récupère toutes les notifications d'un utilisateur
 * @access  Private
 */
router.get('/:idUser', getNotificationsByUser);

/**
 * @route   POST /api/notification
 * @desc    Crée une nouvelle notification
 * @access  Private
 */
router.post('/', createNotification);

/**
 * @route   PATCH /api/notification/:id/read
 * @desc    Marque une notification comme lue
 * @access  Private
 */
router.patch('/:id/read', markAsRead);

/**
 * @route   PATCH /api/notification/read-all/:idUser
 * @desc    Marque toutes les notifications comme lues
 * @access  Private
 */
router.patch('/read-all/:idUser', markAllAsRead);

/**
 * @route   DELETE /api/notification/:id
 * @desc    Supprime une notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

export default router;