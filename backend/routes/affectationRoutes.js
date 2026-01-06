// Routes d'affectation avec gestion des délais et justificatifs
import express from 'express';
import Affectation from '../models/Affectation.js';
import User from '../models/User.js';
import Tache from '../models/Tache.js';
import Notification from '../models/Notification.js';
import Historique from '../models/Historique.js';

import {
  validerAffectationManuelle,
  creerAffectationManuelle,
  getDataForManualAffectation
} from '../controllers/affectationController.js';

import {
  genererAffectationSemiAutomatique,
  confirmerAffectationSemiAutomatique,
  annulerAffectationSemiAutomatique
} from '../controllers/affectationSemiAutoController.js'

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

// GET affectations par tâche
router.get('/task/:idTache', async (req, res) => {
    try {
        const affectations = await Affectation.find({ ID_TACHE: req.params.idTache });
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

// PUT - Accepter une affectation
router.put('/accepter/:idAuditeur/:idTache', async (req, res) => {
  try {
    const { idAuditeur, idTache } = req.params;

    const affectation = await Affectation.findOne({
      ID_TACHE: idTache,
      ID_AUDITEUR: idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // Vérifier si le délai de 24h est dépassé
    const dateAffectation = new Date(affectation.DATE_AFFECTATION);
    const maintenant = new Date();
    const delaiHeures = (maintenant - dateAffectation) / (1000 * 60 * 60);

    affectation.DECISION = "Acceptée";
    affectation.STATUS = "En cours";
    affectation.REPONSE_DANS_DELAI = delaiHeures <= 24;

    await affectation.save();

    // Créer notification
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeur,
      MESSAGE: `Vous avez accepté la tâche`,
      TYPE: 'Succès',
      LUE: false
    });

    // Créer historique
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: [idAuditeur],
      ID_TACHE: idTache,
      ACTION: 'Acceptation de tâche',
      DETAILS: `L'auditeur a accepté la tâche ${delaiHeures <= 24 ? 'dans les délais' : 'hors délai'}`,
      DATE: new Date()
    });

    res.json({
      message: "Tâche acceptée avec succès",
      affectation,
      dansDelai: delaiHeures <= 24
    });

  } catch (error) {
    console.error("Erreur acceptation:", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT - Refuser une affectation (justificatif obligatoire)
router.put('/refuser/:idAuditeur/:idTache', async (req, res) => {
  try {
    const { idAuditeur, idTache } = req.params;
    const { justificatif } = req.body;

    // Vérifier le justificatif
    if (!justificatif || justificatif.trim().length < 10) {
      return res.status(400).json({ 
        message: "Un justificatif d'au moins 10 caractères est obligatoire pour refuser une tâche" 
      });
    }

    const affectation = await Affectation.findOne({
      ID_TACHE: idTache,
      ID_AUDITEUR: idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    affectation.DECISION = "Refusée";
    affectation.JUSTIFICATIF_REFUS = justificatif;

    await affectation.save();

    // Notification
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeur,
      MESSAGE: `Vous avez refusé la tâche`,
      TYPE: 'Information',
      LUE: false
    });

    // Historique
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: [idAuditeur],
      ID_TACHE: idTache,
      ACTION: 'Refus de tâche',
      DETAILS: `Tâche refusée. Justificatif: ${justificatif}`,
      DATE: new Date()
    });

    res.json({
      message: "Tâche refusée avec succès",
      affectation
    });

  } catch (error) {
    console.error("Erreur refus:", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT - Déléguer une affectation (proposition)
router.put('/deleguer/:idAuditeur/:idTache', async (req, res) => {
  try {
    const { idAuditeur, idTache } = req.params;
    const { idAuditeurDelegue, justificatif } = req.body;

    if (!idAuditeurDelegue) {
      return res.status(400).json({ message: "L'ID de l'auditeur délégué est requis" });
    }

    if (!justificatif || justificatif.trim().length < 10) {
      return res.status(400).json({ 
        message: "Un justificatif d'au moins 10 caractères est obligatoire pour déléguer" 
      });
    }

    // Vérifier que l'auditeur délégué existe
    const auditeurDelegue = await User.findOne({ ID: idAuditeurDelegue });
    if (!auditeurDelegue) {
      return res.status(404).json({ message: "Auditeur délégué non trouvé" });
    }

    const affectation = await Affectation.findOne({
      ID_TACHE: idTache,
      ID_AUDITEUR: idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // Créer une nouvelle affectation pour l'auditeur délégué
    const nouvelleAffectation = new Affectation({
      ID: `AFF_DELEG_${Date.now()}`,
      ID_TACHE: idTache,
      ID_VEHICULE: affectation.ID_VEHICULE,
      ID_AUDITEUR: [idAuditeurDelegue],
      DATE_AFFECTATION: new Date(),
      MODE_AFFECTATION: "Manuel",
      STATUS: "À venir",
      DECISION: "En Attente",
      ID_AUDITEUR_DELEGUANT: idAuditeur,
      JUSTIFICATIF_DELEGATION: justificatif,
      DATE_LIMITE_REPONSE_DELEGATION: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    });

    await nouvelleAffectation.save();

    // Mettre à jour l'affectation originale
    affectation.DECISION = "Déléguée";
    affectation.ID_AUDITEUR_DELEGUE = [idAuditeurDelegue];
    affectation.JUSTIFICATIF_DELEGATION = justificatif;

    await affectation.save();

    // Notification pour l'auditeur délégué
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeurDelegue,
      MESSAGE: `Une tâche vous a été déléguée par ${idAuditeur}. Vous avez 24h pour répondre.`,
      TYPE: 'Information',
      LUE: false
    });

    // Notification pour l'auditeur initial
    await Notification.create({
      ID: `NOTIF_${Date.now() + 1}`,
      ID_AUDITEUR: idAuditeur,
      MESSAGE: `Vous avez délégué la tâche à ${auditeurDelegue.NOM} ${auditeurDelegue.PRENOM}`,
      TYPE: 'Information',
      LUE: false
    });

    // Historique
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: [idAuditeur, idAuditeurDelegue],
      ID_TACHE: idTache,
      ACTION: 'Délégation de tâche',
      DETAILS: `Tâche déléguée de ${idAuditeur} à ${idAuditeurDelegue}. Justificatif: ${justificatif}`,
      DATE: new Date()
    });

    res.json({
      message: "Tâche déléguée avec succès. L'auditeur désigné a 24h pour accepter.",
      affectationOriginale: affectation,
      nouvelleDelegation: nouvelleAffectation
    });

  } catch (error) {
    console.error("Erreur délégation:", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT - Accepter une délégation
router.put('/delegation/accepter/:idAuditeur/:idTache', async (req, res) => {
  try {
    const { idAuditeur, idTache } = req.params;

    const affectation = await Affectation.findOne({
      ID_TACHE: idTache,
      ID_AUDITEUR: idAuditeur,
      ID_AUDITEUR_DELEGANT: { $exists: true }
    });

    if (!affectation) {
      return res.status(404).json({ message: "Délégation non trouvée" });
    }

    affectation.DECISION = "Acceptée";
    affectation.STATUS = "En cours";

    await affectation.save();

    // Notifications
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeur,
      MESSAGE: `Vous avez accepté la tâche déléguée`,
      TYPE: 'Succès',
      LUE: false
    });

    await Notification.create({
      ID: `NOTIF_${Date.now() + 1}`,
      ID_AUDITEUR: affectation.ID_AUDITEUR_DELEGANT,
      MESSAGE: `Votre délégation a été acceptée par l'auditeur`,
      TYPE: 'Succès',
      LUE: false
    });

    // Historique
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: [idAuditeur],
      ID_TACHE: idTache,
      ACTION: 'Acceptation de délégation',
      DETAILS: `L'auditeur a accepté la tâche déléguée`,
      DATE: new Date()
    });

    res.json({
      message: "Délégation acceptée avec succès",
      affectation
    });

  } catch (error) {
    console.error("Erreur acceptation délégation:", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT - Refuser une délégation
router.put('/delegation/refuser/:idAuditeur/:idTache', async (req, res) => {
  try {
    const { idAuditeur, idTache } = req.params;

    const affectation = await Affectation.findOne({
      ID_TACHE: idTache,
      ID_AUDITEUR: idAuditeur,
      ID_AUDITEUR_DELEGANT: { $exists: true }
    });

    if (!affectation) {
      return res.status(404).json({ message: "Délégation non trouvée" });
    }

    const idAuditeurDelegant = affectation.ID_AUDITEUR_DELEGANT;

    // Marquer la délégation comme refusée
    affectation.DECISION = "Refusée";
    affectation.STATUS = "Terminée";

    await affectation.save();

    // Remettre l'affectation originale comme refusée par l'auditeur initial
    const affectationOriginale = await Affectation.findOne({
      ID_TACHE: idTache,
      ID_AUDITEUR: idAuditeurDelegant,
      DECISION: "Déléguée"
    });

    if (affectationOriginale) {
      affectationOriginale.DECISION = "Réfusée";
      affectationOriginale.JUSTIFICATIF_REFUS = "Délégation refusée par l'auditeur désigné";
      await affectationOriginale.save();
    }

    // Notifications
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeur,
      MESSAGE: `Vous avez refusé la tâche déléguée`,
      TYPE: 'Information',
      LUE: false
    });

    await Notification.create({
      ID: `NOTIF_${Date.now() + 1}`,
      ID_AUDITEUR: idAuditeurDelegant,
      MESSAGE: `Votre délégation a été refusée. La tâche est considérée comme refusée.`,
      TYPE: 'Echoue',
      LUE: false
    });

    // Historique
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: [idAuditeur, idAuditeurDelegant],
      ID_TACHE: idTache,
      ACTION: 'Refus de délégation',
      DETAILS: `Délégation refusée. La tâche est considérée comme refusée par l'auditeur initial.`,
      DATE: new Date()
    });

    res.json({
      message: "Délégation refusée. La tâche est considérée comme refusée par l'auditeur initial.",
      affectation
    });

  } catch (error) {
    console.error("Erreur refus délégation:", error);
    res.status(500).json({ message: error.message });
  }
});

// Job automatique : Vérifier les délais de 24h
router.post('/verifier-delais', async (req, res) => {
  try {
    const maintenant = new Date();
    const il_y_a_24h = new Date(maintenant.getTime() - 24 * 60 * 60 * 1000);

    // Affectations en attente dépassant 24h
    const affectationsEnAttente = await Affectation.find({
      DECISION: "En Attente",
      DATE_AFFECTATION: { $lte: il_y_a_24h },
      ID_AUDITEUR_DELEGANT: { $exists: false } // Pas une délégation
    });

    for (const affectation of affectationsEnAttente) {
      affectation.DECISION = "Acceptée";
      affectation.STATUS = "En cours";

      await affectation.save();

      // Notification
      await Notification.create({
        ID: `NOTIF_${Date.now()}_${affectation.ID}`,
        ID_AUDITEUR: affectation.ID_AUDITEUR[0],
        MESSAGE: `Tâche acceptée automatiquement (délai de 24h dépassé)`,
        TYPE: 'Information',
        LUE: false
      });

      // Historique
      await Historique.create({
        ID: `HIST_${Date.now()}_${affectation.ID}`,
        ID_AUDITEUR: affectation.ID_AUDITEUR,
        ID_TACHE: affectation.ID_TACHE,
        ACTION: 'Acceptation automatique',
        DETAILS: `Tâche acceptée automatiquement après 24h sans réponse`,
        DATE: new Date()
      });
    }

    // Délégations en attente dépassant 24h
    const delegationsEnAttente = await Affectation.find({
      DECISION: "En Attente",
      DATE_AFFECTATION: { $lte: il_y_a_24h },
      ID_AUDITEUR_DELEGANT: { $exists: true }
    });

    for (const delegation of delegationsEnAttente) {
      const idAuditeurDelegant = delegation.ID_AUDITEUR_DELEGANT;

      // Marquer la délégation comme refusée
      delegation.DECISION = "Refusée";
      delegation.STATUS = "Terminée";
      delegation.DATE_REPONSE = new Date();
      delegation.JUSTIFICATIF_REFUS = "Pas de réponse dans le délai de 24h";

      await delegation.save();

      // Marquer l'affectation originale comme refusée
      const affectationOriginale = await Affectation.findOne({
        ID_TACHE: delegation.ID_TACHE,
        ID_AUDITEUR: idAuditeurDelegant,
        DECISION: "Déléguée"
      });

      if (affectationOriginale) {
        affectationOriginale.DECISION = "Refusée";
        affectationOriginale.JUSTIFICATIF_REFUS = "Délégation non confirmée dans les 24h";
        await affectationOriginale.save();
      }

      // Notifications
      await Notification.create({
        ID: `NOTIF_${Date.now()}_${delegation.ID}`,
        ID_AUDITEUR: delegation.ID_AUDITEUR[0],
        MESSAGE: `Délégation expirée (pas de réponse dans les 24h)`,
        TYPE: 'Echoue',
        LUE: false
      });

      await Notification.create({
        ID: `NOTIF_${Date.now() + 1}_${delegation.ID}`,
        ID_AUDITEUR: idAuditeurDelegant,
        MESSAGE: `Votre délégation a expiré. La tâche est considérée comme refusée.`,
        TYPE: 'Echoue',
        LUE: false
      });

      // Historique
      await Historique.create({
        ID: `HIST_${Date.now()}_${delegation.ID}`,
        ID_AUDITEUR: [delegation.ID_AUDITEUR[0], idAuditeurDelegant],
        ID_TACHE: delegation.ID_TACHE,
        ACTION: 'Expiration de délégation',
        DETAILS: `Délégation expirée sans réponse. Tâche considérée comme refusée.`,
        DATE: new Date()
      });
    }

    res.json({
      message: "Vérification des délais effectuée",
      affectationsAcceptees: affectationsEnAttente.length,
      delegationsExpirees: delegationsEnAttente.length
    });

  } catch (error) {
    console.error("Erreur vérification délais:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;