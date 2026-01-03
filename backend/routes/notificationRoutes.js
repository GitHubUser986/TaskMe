import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET all notifications by userId
router.get('/:idUser', async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            ID_AUDITEUR: req.params.idUser 
        }).sort({ createdAt: -1 }); // Tri par date décroissante
        console.log('Notifications récupérées pour l\'utilisateur', req.params.idUser, ':', notifications);
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create new notification
router.post('/', async (req, res) => {
    const notification = new Notification(req.body);
    try {
        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { ID: req.params.id },
            { LUE: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PATCH mark all notifications as read for a user
router.patch('/read-all/:idUser', async (req, res) => {
    try {
        await Notification.updateMany(
            { ID_AUDITEUR: req.params.idUser, LUE: false },
            { LUE: true }
        );
        
        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ ID: req.params.id });
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        
        res.json({ message: 'Notification supprimée' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;