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
import { sendNotificationEmail } from '../services/emailService.js';

const router = express.Router();

// ⭐ Route de test AVANT l'authentification
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await sendNotificationEmail(
      email,
      'Information',
      'Ceci est un email de test pour vérifier la configuration.',
      'Utilisateur Test'
    );
    
    res.json({
      success: result.success,
      message: result.success 
        ? 'Email de test envoyé avec succès!' 
        : 'Échec de l\'envoi',
      details: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toutes les routes suivantes nécessitent une authentification
router.use(protect);

router.get('/unread-count/:idUser', getUnreadCount);
router.get('/:idUser', getNotificationsByUser);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);
router.patch('/read-all/:idUser', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;