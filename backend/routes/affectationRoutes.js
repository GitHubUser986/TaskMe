import express from 'express';
import Affectation from '../models/Affectation.js';
import User from '../models/User.js';
import Tache from '../models/Tache.js';
import {
  validerAffectationManuelle,
  creerAffectationManuelle,
  getDataForManualAffectation
} from '../controllers/affectationController.js';

import {
  genererAffectationSemiAutomatique,
  confirmerAffectationSemiAutomatique,
  annulerAffectationSemiAutomatique
} from '../controllers/affectationSemiAutoController.js';


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

// GET affectations par tâche (tous les auditeurs affectés à une tâche)
router.get('/task/:idTache', async (req, res) => {
    try {
        const affectations = await Affectation.find({ ID_TACHE: req.params.idTache });
        console.log("Affectations for task", req.params.idTache, ":", affectations);
        res.json(affectations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET données pour affectation manuelle (auditeurs, véhicules, tâche)
router.get('/manual/data/:idTache', getDataForManualAffectation);

// POST valider une affectation manuelle avant soumission
router.post('/manual/validate', validerAffectationManuelle);

// POST créer une affectation manuelle
router.post('/manual/create', creerAffectationManuelle);

// POST - Générer une proposition d'affectation semi-automatique
router.post('/semi-auto/generate', genererAffectationSemiAutomatique);

// POST - Confirmer une affectation semi-automatique
router.post('/semi-auto/confirm', confirmerAffectationSemiAutomatique);

// DELETE - Annuler une affectation semi-automatique
router.delete('/semi-auto/cancel/:idAffectation', annulerAffectationSemiAutomatique);


// POST create new affectation (route générique)
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
        const updatedAffectation = await Affectation.findOneAndUpdate(
            { ID_AUDITEUR: req.params.idAuditeur }, 
            req.body, 
            { new: true }
        );
        if (!updatedAffectation) return res.status(404).json({ message: "Affectation not found" });
        res.json(updatedAffectation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET tâches de l'utilisateur (avec ID et NOM)
router.get("/mytasks/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ ID: userId });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const affectations = await Affectation.find(
      { ID_AUDITEUR: user.ID },
      { ID_TACHE: 1, _id: 0 }
    );

    const taskIds = affectations.map(a => a.ID_TACHE);

    if (taskIds.length === 0) {
      return res.json([]);
    }

    const taches = await Tache.find(
      { ID: { $in: taskIds } },
      { ID: 1, NOM: 1, _id: 0 }
    );

    res.json(taches);

  } catch (error) {
    console.error("Erreur mytasks :", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;