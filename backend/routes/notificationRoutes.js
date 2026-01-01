import express from 'express';
import Notification from '../models/Notification.js';


const router = express.Router();

// GET all notifications by idUser
router.get('/:idUser', async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.idUser });
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
export default router;