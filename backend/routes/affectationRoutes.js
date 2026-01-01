import express from 'express';
import Affectation from '../models/Affectation.js';
import User from '../models/User.js';

const router = express.Router();

// GET all affectations
router.get('/', async (req, res) => {
    try {
        const affectations = await Affectation.find();
        res.json(affectations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET affectation by ID_AUDITEUR
router.get('/:idAuditeur', async (req, res) => {
    try {
        const affectation = await Affectation.findOne({ ID_AUDITEUR: req.params.idAuditeur });
        if (!affectation) return res.status(404).json({ message: "Affectation not found" });
        res.json(affectation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create new affectation
router.post('/', async (req, res) => {
    const affectation = new Affectation(req.body);
    try {
        await affectation.save();
        res.status(201).json(affectation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT UPDATE DECISION AFFECTATION
router.put('/:idAuditeur', async (req, res) => {
    try {
        const updatedAffectation = await Affectation.findOneAndUpdate({ ID_AUDITEUR: req.params.idAuditeur }, req.body, { new: true });
        if (!updatedAffectation) return res.status(404).json({ message: "Affectation not found" });
        res.json(updatedAffectation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET MY TASKS
router.get("/mytasks/:userId",  async (req, res) => {
    try {
        const user = await User.findOne({ID: req.params.userId});
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const taches = await Tache.find({ assignedTo: user.ID });
        res.json(taches);
        
    } catch (error) {
        res.status(500).json({ message: error.message})
    }
});
export default router;