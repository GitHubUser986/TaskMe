import express from 'express';
import Historique from '../models/Historique.js';
const router = express.Router();

// GET all historiques
router.get('/global', async (req, res) => {
    try {
        const historiques = await Historique.find({ID_AUDITEUR:null});
        res.json(historiques);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Get HISTORIQUEBY ID_AUDITEUR
router.get('/:idAuditeur', async (req, res) => {
    try {
        const historiques = await Historique.find({ID_AUDITEUR: req.params.idAuditeur});
        res.json(historiques);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create new historique
router.post('/', async (req, res) => {
    const historique = new Historique(req.body);
    try {
        await historique.save();
        res.status(201).json(historique);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


export default router;