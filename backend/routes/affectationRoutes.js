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

import {
  genererAffectationAutomatique,
  confirmerAffectationAutomatique
} from '../controllers/affectationAutoController.js';

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

// GET affectation by assignment ID (must be before /:idAuditeur route)
router.get('/assignment/:id', async (req, res) => {
    try {
        const affectation = await Affectation.findOne({ 
          ID: req.params.id 
        });
        if (!affectation) {
            return res.status(404).json({ message: "Affectation non trouvée" });
        }
        res.json(affectation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET affectation by ID_AUDITEUR
router.get('/:idAuditeur', async (req, res) => {
    try {
        const affectation = await Affectation.findOne({ 
          "ID_AUDITEURS.ID_AUDITEUR": req.params.idAuditeur 
        });
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

// POST - Générer une proposition d'affectation automatique
router.post('/auto/generate', genererAffectationAutomatique);

// POST - Confirmer une affectation automatique
router.post('/auto/confirm', confirmerAffectationAutomatique);

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

// PUT - Mettre à jour une affectation par son ID
router.put('/update/:id', async (req, res) => {
  try {
    const updatedAffectation = await Affectation.findOneAndUpdate(
      { ID: req.params.id }, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedAffectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }
    
    res.json(updatedAffectation);
  } catch (error) {
    console.error("Erreur mise à jour affectation:", error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Supprimer une affectation par son ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trouver l'affectation avant de la supprimer pour l'historique
    const affectation = await Affectation.findOne({ ID: id });
    
    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // Supprimer l'affectation
    await Affectation.findOneAndDelete({ ID: id });

    // Créer un historique de la suppression
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: affectation.ID_AUDITEURS.map(a => a.ID_AUDITEUR),
      ID_TACHE: affectation.ID_TACHE,
      ACTION: 'Suppression d\'affectation',
      DETAILS: `Affectation ${id} supprimée - Tâche: ${affectation.ID_TACHE}`,
      DATE: new Date()
    });

    // Notifier les auditeurs de la suppression
    for (const auditeur of affectation.ID_AUDITEURS) {
      await Notification.create({
        ID: `NOTIF_${Date.now()}_${auditeur.ID_AUDITEUR}`,
        ID_AUDITEUR: auditeur.ID_AUDITEUR,
        MESSAGE: `L'affectation pour la tâche ${affectation.ID_TACHE} a été supprimée`,
        TYPE: 'Information',
        LUE: false
      });
    }
    
    res.json({
      message: "Affectation supprimée avec succès",
      deletedId: id
    });
  } catch (error) {
    console.error("Erreur suppression affectation:", error);
    res.status(500).json({ message: error.message });
  }
});

// PUT UPDATE DECISION AFFECTATION (deprecated - use specific endpoints)
router.put('/:idAuditeur', async (req, res) => {
    try {
        const updatedAffectation = await Affectation.findOneAndUpdate(
            { "ID_AUDITEURS.ID_AUDITEUR": req.params.idAuditeur }, 
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

    // Trouver toutes les affectations où l'utilisateur est un auditeur
    const affectations = await Affectation.find(
      { "ID_AUDITEURS.ID_AUDITEUR": user.ID }
    );

    const result = [];

    for (const affectation of affectations) {
      // Trouver la décision spécifique de cet auditeur
      const auditeurData = affectation.ID_AUDITEURS.find(
        a => a.ID_AUDITEUR === user.ID
      );

      const tache = await Tache.findOne(
        { ID: affectation.ID_TACHE },
        { ID: 1, NOM: 1, _id: 0 }
      );

      if (tache) {
        result.push({
          ID: tache.ID,
          NOM: tache.NOM,
          DECISION: auditeurData?.DECISION || "En Attente",
          AFFECTATION_ID: affectation.ID
        });
      }
    }

    res.json(result);

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
      "ID_AUDITEURS.ID_AUDITEUR": idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // Vérifier si le délai de 24h est dépassé
    const dateAffectation = new Date(affectation.DATE_AFFECTATION);
    const maintenant = new Date();
    const delaiHeures = (maintenant - dateAffectation) / (1000 * 60 * 60);

    // Trouver l'index de l'auditeur dans le tableau
    const auditeurIndex = affectation.ID_AUDITEURS.findIndex(
      a => a.ID_AUDITEUR === idAuditeur
    );

    if (auditeurIndex === -1) {
      return res.status(404).json({ message: "Auditeur non trouvé dans cette affectation" });
    }

    // Mettre à jour la décision de cet auditeur spécifique
    affectation.ID_AUDITEURS[auditeurIndex].DECISION = "Acceptée";
    affectation.ID_AUDITEURS[auditeurIndex].DATE_REPONSE = new Date();
    affectation.ID_AUDITEURS[auditeurIndex].REPONSE_DANS_DELAI = delaiHeures <= 24;

    // Vérifier si tous les auditeurs ont accepté
    const tousAcceptes = affectation.ID_AUDITEURS.every(
      a => a.DECISION === "Acceptée"
    );

    if (tousAcceptes) {
      affectation.STATUS = "En cours";
    }

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
      "ID_AUDITEURS.ID_AUDITEUR": idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // Trouver l'index de l'auditeur
    const auditeurIndex = affectation.ID_AUDITEURS.findIndex(
      a => a.ID_AUDITEUR === idAuditeur
    );

    if (auditeurIndex === -1) {
      return res.status(404).json({ message: "Auditeur non trouvé dans cette affectation" });
    }

    // Mettre à jour la décision
    affectation.ID_AUDITEURS[auditeurIndex].DECISION = "Refusée";
    affectation.ID_AUDITEURS[auditeurIndex].JUSTIFICATIF_REFUS = justificatif;
    affectation.ID_AUDITEURS[auditeurIndex].DATE_REPONSE = new Date();

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
      "ID_AUDITEURS.ID_AUDITEUR": idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }

    // Trouver l'index de l'auditeur
    const auditeurIndex = affectation.ID_AUDITEURS.findIndex(
      a => a.ID_AUDITEUR === idAuditeur
    );

    if (auditeurIndex === -1) {
      return res.status(404).json({ message: "Auditeur non trouvé dans cette affectation" });
    }

    // Mettre à jour l'auditeur qui délègue
    affectation.ID_AUDITEURS[auditeurIndex].DECISION = "Déléguée";
    affectation.ID_AUDITEURS[auditeurIndex].ID_AUDITEUR_DELEGUE = idAuditeurDelegue;
    affectation.ID_AUDITEURS[auditeurIndex].JUSTIFICATIF_DELEGATION = justificatif;
    affectation.ID_AUDITEURS[auditeurIndex].DATE_LIMITE_REPONSE_DELEGATION = new Date(Date.now() + 24 * 60 * 60 * 1000);
    affectation.ID_AUDITEURS[auditeurIndex].DATE_REPONSE = new Date();

    // Ajouter le nouvel auditeur délégué au tableau
    affectation.ID_AUDITEURS.push({
      ID_AUDITEUR: idAuditeurDelegue,
      DECISION: "En Attente",
      DATE_LIMITE_REPONSE_DELEGATION: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await affectation.save();

    const auditeurInitial = await User.findOne({ ID: idAuditeur });
    const nomAuditeur = auditeurInitial.NOM || auditeurInitial.PRENOM
      ? `${auditeurInitial.NOM} ${auditeurInitial.PRENOM}`
      : "Auditeur inconnu";

    // Notification pour l'auditeur délégué
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeurDelegue,
      MESSAGE: `Une tâche vous a été déléguée par ${nomAuditeur}. Vous avez 24h pour répondre.`,
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
      DETAILS: `Tâche déléguée de ${nomAuditeur} à ${auditeurDelegue.NOM} ${auditeurDelegue.PRENOM}. Justificatif: ${justificatif}`,
      DATE: new Date()
    });

    res.json({
      message: "Tâche déléguée avec succès. L'auditeur désigné a 24h pour accepter.",
      affectation
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
      "ID_AUDITEURS.ID_AUDITEUR": idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Délégation non trouvée" });
    }

    // Trouver l'auditeur délégué
    const auditeurIndex = affectation.ID_AUDITEURS.findIndex(
      a => a.ID_AUDITEUR === idAuditeur && a.DATE_LIMITE_REPONSE_DELEGATION
    );

    if (auditeurIndex === -1) {
      return res.status(404).json({ message: "Délégation non trouvée pour cet auditeur" });
    }

    affectation.ID_AUDITEURS[auditeurIndex].DECISION = "Acceptée";
    affectation.ID_AUDITEURS[auditeurIndex].DATE_REPONSE = new Date();

    // Vérifier si tous ont accepté
    const tousAcceptes = affectation.ID_AUDITEURS.every(
      a => a.DECISION === "Acceptée" || a.DECISION === "Déléguée"
    );

    if (tousAcceptes) {
      affectation.STATUS = "En cours";
    }

    await affectation.save();

    // Trouver l'auditeur qui a délégué
    const auditeurDelegant = affectation.ID_AUDITEURS.find(
      a => a.ID_AUDITEUR_DELEGUE === idAuditeur
    );

    // Notifications
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeur,
      MESSAGE: `Vous avez accepté la tâche déléguée`,
      TYPE: 'Succès',
      LUE: false
    });

    if (auditeurDelegant) {
      await Notification.create({
        ID: `NOTIF_${Date.now() + 1}`,
        ID_AUDITEUR: auditeurDelegant.ID_AUDITEUR,
        MESSAGE: `Votre délégation a été acceptée par l'auditeur`,
        TYPE: 'Succès',
        LUE: false
      });
    }

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
      "ID_AUDITEURS.ID_AUDITEUR": idAuditeur
    });

    if (!affectation) {
      return res.status(404).json({ message: "Délégation non trouvée" });
    }

    // Trouver l'auditeur délégué
    const auditeurIndex = affectation.ID_AUDITEURS.findIndex(
      a => a.ID_AUDITEUR === idAuditeur && a.DATE_LIMITE_REPONSE_DELEGATION
    );

    if (auditeurIndex === -1) {
      return res.status(404).json({ message: "Délégation non trouvée pour cet auditeur" });
    }

    // Trouver l'auditeur qui a délégué
    const auditeurDelegantIndex = affectation.ID_AUDITEURS.findIndex(
      a => a.ID_AUDITEUR_DELEGUE === idAuditeur
    );

    // Marquer la délégation comme refusée
    affectation.ID_AUDITEURS[auditeurIndex].DECISION = "Refusée";
    affectation.ID_AUDITEURS[auditeurIndex].DATE_REPONSE = new Date();
    affectation.ID_AUDITEURS[auditeurIndex].JUSTIFICATIF_REFUS = "Délégation refusée";

    // Supprimer l'auditeur délégué du tableau
    affectation.ID_AUDITEURS.splice(auditeurIndex, 1);

    // Remettre l'auditeur initial comme refusé
    if (auditeurDelegantIndex !== -1) {
      affectation.ID_AUDITEURS[auditeurDelegantIndex].DECISION = "Refusée";
      affectation.ID_AUDITEURS[auditeurDelegantIndex].JUSTIFICATIF_REFUS = "Délégation refusée par l'auditeur désigné";
    }

    await affectation.save();

    const idAuditeurDelegant = auditeurDelegantIndex !== -1 
      ? affectation.ID_AUDITEURS[auditeurDelegantIndex].ID_AUDITEUR 
      : null;

    // Notifications
    await Notification.create({
      ID: `NOTIF_${Date.now()}`,
      ID_AUDITEUR: idAuditeur,
      MESSAGE: `Vous avez refusé la tâche déléguée`,
      TYPE: 'Information',
      LUE: false
    });

    if (idAuditeurDelegant) {
      await Notification.create({
        ID: `NOTIF_${Date.now() + 1}`,
        ID_AUDITEUR: idAuditeurDelegant,
        MESSAGE: `Votre délégation a été refusée. La tâche est considérée comme refusée.`,
        TYPE: 'Echoue',
        LUE: false
      });
    }

    // Historique
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: idAuditeurDelegant ? [idAuditeur, idAuditeurDelegant] : [idAuditeur],
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

    const affectations = await Affectation.find({
      DATE_AFFECTATION: { $lte: il_y_a_24h },
      STATUS: { $in: ["À venir"] }
    });

    let affectationsAccepteesCount = 0;
    let delegationsExpireesCount = 0;

    for (const affectation of affectations) {
      let modified = false;

      for (let i = 0; i < affectation.ID_AUDITEURS.length; i++) {
        const auditeur = affectation.ID_AUDITEURS[i];

        // Affectations normales en attente depuis 24h
        if (auditeur.DECISION === "En Attente" && !auditeur.DATE_LIMITE_REPONSE_DELEGATION) {
          auditeur.DECISION = "Refusée";
          auditeur.DATE_REPONSE = new Date();
          auditeur.REPONSE_DANS_DELAI = false;
          modified = true;
          affectationsAccepteesCount++;

          // Notification
          await Notification.create({
            ID: `NOTIF_${Date.now()}_${auditeur.ID_AUDITEUR}`,
            ID_AUDITEUR: auditeur.ID_AUDITEUR,
            MESSAGE: `Tâche réfusée automatiquement (délai de 24h dépassé)`,
            TYPE: 'Echoue',
            LUE: false
          });

          // Historique
          await Historique.create({
            ID: `HIST_${Date.now()}_${auditeur.ID_AUDITEUR}`,
            ID_AUDITEUR: [auditeur.ID_AUDITEUR],
            ID_TACHE: affectation.ID_TACHE,
            ACTION: 'Refus automatique',
            DETAILS: `Tâche réfusée automatiquement après 24h sans réponse`,
            DATE: new Date()
          });
        }

        // Délégations en attente depuis 24h
        if (auditeur.DECISION === "En Attente" && 
            auditeur.DATE_LIMITE_REPONSE_DELEGATION && 
            new Date(auditeur.DATE_LIMITE_REPONSE_DELEGATION) <= maintenant) {
          
          // Trouver l'auditeur qui a délégué
          const auditeurDelegantIndex = affectation.ID_AUDITEURS.findIndex(
            a => a.ID_AUDITEUR_DELEGUE === auditeur.ID_AUDITEUR
          );

          // Marquer la délégation comme refusée
          auditeur.DECISION = "Refusée";
          auditeur.DATE_REPONSE = new Date();
          auditeur.JUSTIFICATIF_REFUS = "Pas de réponse dans le délai de 24h";

          // Marquer l'auditeur initial comme refusé
          if (auditeurDelegantIndex !== -1) {
            affectation.ID_AUDITEURS[auditeurDelegantIndex].DECISION = "En Attente";

            const idDelegant = affectation.ID_AUDITEURS[auditeurDelegantIndex].ID_AUDITEUR;

            // Notifications
            await Notification.create({
              ID: `NOTIF_${Date.now()}_${auditeur.ID_AUDITEUR}`,
              ID_AUDITEUR: auditeur.ID_AUDITEUR,
              MESSAGE: `Délégation expirée (pas de réponse dans les 24h)`,
              TYPE: 'Echoue',
              LUE: false
            });

            await Notification.create({
              ID: `NOTIF_${Date.now() + 1}_${idDelegant}`,
              ID_AUDITEUR: idDelegant,
              MESSAGE: `Votre délégation a expiré. En attente de votre dernière réponse.`,
              TYPE: 'Echoue',
              LUE: false
            });

            // Historique
            await Historique.create({
              ID: `HIST_${Date.now()}_${auditeur.ID_AUDITEUR}`,
              ID_AUDITEUR: [auditeur.ID_AUDITEUR, idDelegant],
              ID_TACHE: affectation.ID_TACHE,
              ACTION: 'Expiration de délégation',
              DETAILS: `Délégation expirée sans réponse. Tâche considérée comme refusée.`,
              DATE: new Date()
            });
          }

          modified = true;
          delegationsExpireesCount++;
        }
      }

      if (modified) {
        // Vérifier si tous les auditeurs ont accepté
        const tousAcceptes = affectation.ID_AUDITEURS.every(
          a => a.DECISION === "Acceptée" || a.DECISION === "Déléguée"
        );

        if (tousAcceptes) {
          affectation.STATUS = "En cours";
        }

        await affectation.save();
      }
    }

    res.json({
      message: "Vérification des délais effectuée",
      affectationsAcceptees: affectationsAccepteesCount,
      delegationsExpirees: delegationsExpireesCount
    });

  } catch (error) {
    console.error("Erreur vérification délais:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;