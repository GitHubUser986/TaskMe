import express from 'express';
import Historique from '../models/Historique.js';
import Affectation from '../models/Affectation.js';
import Tache from '../models/Tache.js';
import User from '../models/User.js';

const router = express.Router();

// Helper pour formater les réponses
const successResponse = (data, message = "Succès") => ({
  success: true,
  message,
  data
});

const errorResponse = (message) => ({
  success: false,
  message
});

// Calculer les heures entre deux dates
const calculateHours = (dateDebut, dateFin) => {
  if (!dateDebut || !dateFin) return null;
  const diff = new Date(dateFin) - new Date(dateDebut);
  return Math.round(diff / (1000 * 60 * 60)); // Conversion en heures
};

// GET /api/historique/stats - Statistiques d'historique
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (userId) {
      query.ID_AUDITEUR = { $in: [userId] };
    }

    const totalActions = await Historique.countDocuments(query);

    const actionsByType = await Historique.aggregate([
      { $match: query },
      { $group: { _id: '$ACTION', count: { $sum: 1 } } }
    ]);

    const affectations = await Affectation.countDocuments(
      userId ? { "ID_AUDITEURS.ID_AUDITEUR": userId } : {}
    );

    const stats = {
      totalActions,
      actionsByType: actionsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalAffectations: affectations
    };

    res.json(successResponse(stats));
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/historique/global - Historique système
router.get('/global', async (req, res) => {
  try {
    const historiques = await Historique.find()
      .sort({ createdAt: -1 })
      .limit(1000);

    const enrichedData = await Promise.all(
      historiques.map(async (hist) => {
        try {
          const tache = await Tache.findOne({ ID: hist.ID_TACHE });
          return {
            id: hist.ID,
            idTache: hist.ID_TACHE,
            userName: 'Système',
            taskName: tache?.NOM || 'Tâche inconnue',
            date: hist.createdAt || new Date(),
            status: tache?.STATUT || 'N/A',
            type: hist.ACTION,
            details: hist.DETAILS,
            rapport: hist.DETAILS,
            TYPE_TACHE: tache?.TYPE
          };
        } catch (err) {
          console.error('Erreur enrichissement:', err);
          return {
            id: hist.ID,
            idTache: hist.ID_TACHE,
            userName: 'Système',
            taskName: 'Erreur',
            date: hist.createdAt || new Date(),
            status: 'N/A',
            type: hist.ACTION,
            details: hist.DETAILS
          };
        }
      })
    );

    res.json(successResponse(enrichedData));
  } catch (error) {
    console.error('Erreur global:', error);
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/historique - Tout l'historique avec filtres
router.get('/', async (req, res) => {
  try {
    const { search, startDate, endDate, status, type } = req.query;

    let historiqueQuery = {};
    if (startDate || endDate) {
      historiqueQuery.createdAt = {};
      if (startDate) historiqueQuery.createdAt.$gte = new Date(startDate);
      if (endDate) historiqueQuery.createdAt.$lte = new Date(endDate);
    }
    if (type) {
      historiqueQuery.ACTION = type;
    }

    const historiques = await Historique.find(historiqueQuery)
      .sort({ createdAt: -1 })
      .limit(500);

    let affectationsQuery = {};
    if (startDate || endDate) {
      affectationsQuery.DATE_AFFECTATION = {};
      if (startDate) affectationsQuery.DATE_AFFECTATION.$gte = new Date(startDate);
      if (endDate) affectationsQuery.DATE_AFFECTATION.$lte = new Date(endDate);
    }

    const affectations = await Affectation.find(affectationsQuery)
      .sort({ DATE_AFFECTATION: -1 })
      .limit(500);

    const enrichedHistorique = await Promise.all(
      historiques.map(async (hist) => {
        try {
          const tache = await Tache.findOne({ ID: hist.ID_TACHE });
          let userName = 'Système';

          if (hist.ID_AUDITEUR && hist.ID_AUDITEUR.length > 0) {
            const user = await User.findOne({ ID: hist.ID_AUDITEUR[0] });
            if (user) {
              userName = `${user.PRENOM} ${user.NOM}`;
            }
          }

          return {
            id: hist.ID,
            idTache: hist.ID_TACHE,
            userName,
            taskName: tache?.NOM || 'Tâche inconnue',
            date: hist.createdAt || new Date(),
            status: tache?.STATUT || 'N/A',
            type: hist.ACTION,
            details: hist.DETAILS,
            rapport: hist.DETAILS,
            source: 'historique'
          };
        } catch (err) {
          console.error('Erreur enrichissement historique:', err);
          return null;
        }
      })
    );

    const enrichedAffectations = await Promise.all(
      affectations.map(async (aff) => {
        try {
          const tache = await Tache.findOne({ ID: aff.ID_TACHE });

          let userName = 'Utilisateur inconnu';
          if (aff.ID_AUDITEURS && aff.ID_AUDITEURS.length > 0) {
            const userId = aff.ID_AUDITEURS[0].ID_AUDITEUR;
            const user = await User.findOne({ ID: userId });
            if (user) {
              userName = `${user.PRENOM} ${user.NOM}`;
            }
          }

          const decision = aff.ID_AUDITEURS && aff.ID_AUDITEURS.length > 0 
            ? aff.ID_AUDITEURS[0].DECISION 
            : 'En Attente';

          return {
            id: aff.ID || `AFF_${aff._id}`,
            idTache: aff.ID_TACHE,
            userName,
            taskName: tache?.NOM || 'Tâche inconnue',
            date: aff.DATE_AFFECTATION || aff.createdAt || new Date(),
            status: decision,
            type: aff.MODE_AFFECTATION ?? 'Affectation',
            details: `Affectation ${aff.MODE_AFFECTATION || 'Manuelle'}`,
            rapport: aff.RAPPORT?.fileName || 'Aucun rapport',
            algorithme: aff.MODE_AFFECTATION,
            source: 'affectation'
          };
        } catch (err) {
          console.error('Erreur enrichissement affectation:', err);
          return null;
        }
      })
    );

    const combined = [...enrichedHistorique, ...enrichedAffectations]
      .filter(item => item !== null);

    let filtered = combined;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.userName.toLowerCase().includes(searchLower) ||
        item.taskName.toLowerCase().includes(searchLower)
      );
    }

    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(successResponse(filtered));
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/historique/task/:idTache - Historique d'une tâche spécifique
router.get('/task/:idTache', async (req, res) => {
  try {
    const { idTache } = req.params;

    const historiques = await Historique.find({ ID_TACHE: idTache })
      .sort({ createdAt: -1 });

    const enrichedData = await Promise.all(
      historiques.map(async (hist) => {
        try {
          let auditeurs = [];
          if (hist.ID_AUDITEUR && hist.ID_AUDITEUR.length > 0) {
            const users = await User.find({
              ID: { $in: hist.ID_AUDITEUR }
            });
            auditeurs = users.map(u => ({
              ID: u.ID,
              NOM: u.NOM,
              PRENOM: u.PRENOM,
              GRADE: u.GRADE
            }));
          }

          return {
            ...hist.toObject(),
            AUDITEURS: auditeurs
          };
        } catch (err) {
          return hist.toObject();
        }
      })
    );

    res.json(successResponse(enrichedData));
  } catch (error) {
    console.error('Erreur task:', error);
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/historique/user/:idAuditeur - Historique complet d'un utilisateur
router.get('/user/:idAuditeur', async (req, res) => {
  try {
    const { idAuditeur } = req.params;
    console.log('🔍 Récupération historique pour:', idAuditeur);

    // 1. Récupérer TOUTES les données
    const [historiques, affectations] = await Promise.all([
      Historique.find({ 
        ID_AUDITEUR: { $in: [idAuditeur] } 
      }).sort({ createdAt: -1 }),
      Affectation.find({ 
        "ID_AUDITEURS.ID_AUDITEUR": idAuditeur 
      }).sort({ DATE_AFFECTATION: -1 })
    ]);

    console.log('📊 Données brutes:', {
      historiques: historiques.length,
      affectations: affectations.length
    });

    // 2. Récupérer toutes les tâches en une seule requête
    const allTaskIds = [
      ...new Set([
        ...historiques.map(h => h.ID_TACHE),
        ...affectations.map(a => a.ID_TACHE)
      ])
    ];

    const taches = await Tache.find({ ID: { $in: allTaskIds } });
    const tacheMap = Object.fromEntries(taches.map(t => [t.ID, t]));

    console.log('📋 Tâches récupérées:', taches.length);

    // 3. Enrichir l'HISTORIQUE (actions manuelles: délégations, refus, etc.)
    const enrichedHistorique = historiques.map(hist => {
      const tache = tacheMap[hist.ID_TACHE];
      const heures = calculateHours(
        tache?.PERIODE_EXECUTION?.DATE_DEBUT,
        tache?.PERIODE_EXECUTION?.DATE_FIN
      );

      return {
        ID: hist.ID,
        ID_AUDITEUR: hist.ID_AUDITEUR,
        ID_TACHE: hist.ID_TACHE,
        STATUT: hist.ACTION,
        DETAILS: hist.DETAILS,
        createdAt: hist.createdAt,
        NOM_TACHE: tache?.NOM || 'Tâche inconnue',
        DATE_DEBUT: tache?.PERIODE_EXECUTION?.DATE_DEBUT,
        DATE_FIN: tache?.PERIODE_EXECUTION?.DATE_FIN,
        TYPE_TACHE: tache?.TYPE,
        HEURES_ESTIMEES: heures,
        MODE_AFFECTATION: 'N/A', // Les historiques ne sont pas des affectations
        source: 'historique'
      };
    });

    // 4. Enrichir les AFFECTATIONS (avec statut réel)
    const enrichedAffectations = affectations.map(aff => {
      const tache = tacheMap[aff.ID_TACHE];
      
      // CRUCIAL: Trouver les données de CET auditeur spécifique
      const auditeurData = aff.ID_AUDITEURS?.find(
        aud => aud.ID_AUDITEUR === idAuditeur
      );

      const heures = calculateHours(
        tache?.PERIODE_EXECUTION?.DATE_DEBUT,
        tache?.PERIODE_EXECUTION?.DATE_FIN
      );

      return {
        ID: aff.ID,
        ID_AUDITEUR: [auditeurData?.ID_AUDITEUR || idAuditeur],
        ID_TACHE: aff.ID_TACHE,
        ACTION: 'Affectation',
        DETAILS: `Affecté à la tâche - ${aff.MODE_AFFECTATION || 'Manuel'}`,
        STATUT: auditeurData?.DECISION || 'En Attente',
        DECISION: auditeurData?.DECISION || 'En Attente',
        JUSTIFICATIF_REFUS: auditeurData?.JUSTIFICATIF_REFUS,
        JUSTIFICATIF_DELEGATION: auditeurData?.JUSTIFICATIF_DELEGATION,
        ID_AUDITEUR_DELEGUE: auditeurData?.ID_AUDITEUR_DELEGUE,
        DATE_REPONSE: auditeurData?.DATE_REPONSE,
        REPONSE_DANS_DELAI: auditeurData?.REPONSE_DANS_DELAI,
        createdAt: aff.DATE_AFFECTATION,
        NOM_TACHE: tache?.NOM || 'Tâche inconnue',
        DATE_DEBUT: tache?.PERIODE_EXECUTION?.DATE_DEBUT,
        DATE_FIN: tache?.PERIODE_EXECUTION?.DATE_FIN,
        TYPE_TACHE: tache?.TYPE,
        HEURES_ESTIMEES: heures,
        MODE_AFFECTATION: aff.MODE_AFFECTATION || 'Manuel',
        source: 'affectation'
      };
    });

    // 5. Fusionner et trier
    const result = [...enrichedHistorique, ...enrichedAffectations]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
    res.json(enrichedAffectations);

  } catch (error) {
    console.error('❌ Erreur user:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/historique - Créer un nouvel historique
router.post('/', async (req, res) => {
  try {
    const { ID, ID_AUDITEUR, ID_TACHE, DETAILS, ACTION } = req.body;

    const historique = new Historique({
      ID: ID || `HIST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ID_AUDITEUR,
      ID_TACHE,
      DETAILS,
      ACTION
    });

    await historique.save();
    res.status(201).json(successResponse(historique, "Historique créé avec succès"));
  } catch (error) {
    console.error('Erreur création:', error);
    res.status(400).json(errorResponse(error.message));
  }
});

// DELETE /api/historique/:id - Supprimer un historique
router.delete('/:id', async (req, res) => {
  try {
    const historique = await Historique.findOneAndDelete({
      ID: req.params.id
    });

    if (!historique) {
      return res.status(404).json(errorResponse('Historique non trouvé'));
    }

    res.json(successResponse({}, 'Historique supprimé avec succès'));
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;