import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendNotificationEmail } from '../services/emailService.js';

// Helper pour formater la réponse
const successResponse = (data, message = "Succès") => ({ 
  success: true, 
  message, 
  data 
});

const errorResponse = (message) => ({ 
  success: false, 
  message 
});

/**
 * GET /api/notification/:idUser
 * Récupère toutes les notifications d'un utilisateur
 */
export const getNotificationsByUser = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      ID_AUDITEUR: req.params.idUser 
    }).sort({ createdAt: -1 });
    
    res.json(successResponse({ notifications }));
  } catch (error) {
    console.error('Erreur getNotificationsByUser:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * GET /api/notification/unread-count/:idUser
 * Récupère le nombre de notifications non lues d'un utilisateur
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      ID_AUDITEUR: req.params.idUser,
      LUE: false 
    });
    
    res.json(successResponse({ count }));
  } catch (error) {
    console.error('Erreur getUnreadCount:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * POST /api/notification
 * Crée une nouvelle notification ET envoie un email (si l'utilisateur a activé les emails)
 */
export const createNotification = async (req, res) => {
  try {
    // 1. Créer la notification in-app
    const notification = new Notification(req.body);
    await notification.save();
    
    // 2. Récupérer les informations de l'utilisateur
    const user = await User.findOne({ ID: req.body.ID });
    
    if (!user) {
      console.warn(`Utilisateur ${req.body.ID} non trouvé`);
      return res.status(201).json(successResponse(
        { notification }, 
        "Notification créée (utilisateur non trouvé pour email)"
      ));
    }

    // 3. Vérifier si l'utilisateur a un email ET veut recevoir des emails
    // Note: Ajoutez un champ EMAIL_NOTIFICATIONS dans votre modèle User si souhaité
    const shouldSendEmail = user.EMAIL; // Par défaut true
    
    if (shouldSendEmail) {
      const userName = `${user.PRENOM} ${user.NOM}`;
      
      // Envoyer l'email de manière asynchrone
      sendNotificationEmail(
        user.EMAIL,
        notification.TYPE,
        notification.MESSAGE,
        userName
      )
      .then(result => {
        if (result.success) {
          console.log(`✓ Email envoyé à ${user.EMAIL} (ID: ${result.messageId})`);
        } else {
          console.error(`✗ Échec envoi email à ${user.EMAIL}:`, result.error);
        }
      })
      .catch(err => {
        console.error(`✗ Erreur critique email pour ${user.EMAIL}:`, err);
      });
    } else {
      console.log(`Email non envoyé pour ${user.EMAIL} (préférences utilisateur)`);
    }
    
    // 4. Répondre immédiatement (sans attendre l'email)
    res.status(201).json(successResponse(
      { notification }, 
      "Notification créée avec succès"
    ));
    
  } catch (error) {
    console.error('Erreur createNotification:', error);
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * PATCH /api/notification/:id/read
 * Marque une notification comme lue
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { ID: req.params.id },
      { LUE: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json(errorResponse('Notification non trouvée'));
    }
    
    res.json(successResponse({ notification }, "Notification marquée comme lue"));
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * PATCH /api/notification/read-all/:idUser
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { ID_AUDITEUR: req.params.idUser, LUE: false },
      { LUE: true }
    );
    
    res.json(successResponse(
      { modifiedCount: result.modifiedCount }, 
      "Toutes les notifications ont été marquées comme lues"
    ));
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * DELETE /api/notification/:id
 * Supprime une notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ ID: req.params.id });
    
    if (!notification) {
      return res.status(404).json(errorResponse('Notification non trouvée'));
    }
    
    res.json(successResponse({}, "Notification supprimée avec succès"));
  } catch (error) {
    console.error('Erreur deleteNotification:', error);
    res.status(500).json(errorResponse(error.message));
  }
};