import express from 'express';
import Historique from '../models/Historique.js';
import Affectation from '../models/Affectation.js';
import Tache from '../models/Tache.js';
import User from '../models/User.js';

const router = express.Router();

// Helper pour formater les réponses (cohérent avec tacheRoutes.js)
const successResponse = (data, message = "Succès") => ({ 
  success: true, 
  message, 
  data 
});

const errorResponse = (message) => ({ 
  success: false, 
  message 
});

// Middleware de logging
router.use((req, res, next) => {
  next();
});

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
      userId ? { ID_AUDITEUR: { $in: [userId] } } : {}
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
    console.error('❌ Erreur stats:', error);
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/historique/global - Historique système (ID_AUDITEUR = null)
router.get('/global', async (req, res) => {
  try {
    
    const historiques = await Historique.find()
      .sort({ createdAt: -1 })
      .limit(1000);
    
    // Enrichir avec les informations des tâches
    const enrichedData = await Promise.all(
      historiques.map(async (hist) => {
        try {
          const tache = await Tache.findOne({ ID: hist.ID_TACHE });
          return {
            id: hist.ID,
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

// GET /api/historique - Tout l'historique avec filtres (pour GlobalHistory.tsx)
router.get('/', async (req, res) => {
  try {
    const { search, startDate, endDate, status, type } = req.query;
    
    // 1. Construire la requête pour Historique
    let historiqueQuery = {};
    if (startDate || endDate) {
      historiqueQuery.createdAt = {};
      if (startDate) historiqueQuery.createdAt.$gte = new Date(startDate);
      if (endDate) historiqueQuery.createdAt.$lte = new Date(endDate);
    }
    if (type) {
      historiqueQuery.ACTION = type;
    }

    // 2. Récupérer l'historique
    const historiques = await Historique.find(historiqueQuery)
      .sort({ createdAt: -1 })
      .limit(500);

    // 3. Récupérer toutes les affectations pour enrichir
    let affectationsQuery = {};
    if (startDate || endDate) {
      affectationsQuery.DATE_AFFECTATION = {};
      if (startDate) affectationsQuery.DATE_AFFECTATION.$gte = new Date(startDate);
      if (endDate) affectationsQuery.DATE_AFFECTATION.$lte = new Date(endDate);
    }

    const affectations = await Affectation.find(affectationsQuery)
      .sort({ DATE_AFFECTATION: -1 })
      .limit(500);

    // 4. Enrichir l'historique
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

    // 5. Enrichir les affectations
    const enrichedAffectations = await Promise.all(
      affectations.map(async (aff) => {
        try {
          const tache = await Tache.findOne({ ID: aff.ID_TACHE });
          
          // Récupérer le nom de l'auditeur
          let userName = 'Utilisateur inconnu';
          if (aff.ID_AUDITEUR && aff.ID_AUDITEUR.length > 0) {
            const user = await User.findOne({ ID: aff.ID_AUDITEUR[0] });
            if (user) {
              userName = `${user.PRENOM} ${user.NOM}`;
            }
          }

          return {
            id: aff.ID || `AFF_${aff._id}`,
            userName,
            taskName: tache?.NOM || 'Tâche inconnue',
            date: aff.DATE_AFFECTATION || aff.createdAt || new Date(),
            status: aff.STATUS || 'Affectée',
            type: aff.MODE_AFFECTATION ? 'Algorithme' : 'Affectation',
            details: aff.DETAILS || `Affectation ${aff.MODE_AFFECTATION || 'manuelle'}`,
            rapport: aff.DETAILS,
            algorithme: aff.MODE_AFFECTATION,
            source: 'affectation'
          };
        } catch (err) {
          console.error('Erreur enrichissement affectation:', err);
          return null;
        }
      })
    );

    // 6. Combiner et filtrer
    const combined = [...enrichedHistorique, ...enrichedAffectations]
      .filter(item => item !== null);

    // 7. Appliquer les filtres de recherche et statut
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

    // 8. Trier par date décroissante
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

// GET historique par utilisateur
router.get('/user/:idAuditeur', async (req, res) => {
  try {
    const { idAuditeur } = req.params;
    
    // Récupérer l'historique direct de l'utilisateur
    const historiques = await Historique.find({
      ID_AUDITEUR: { $in: [idAuditeur] }
    }).sort({ createdAt: -1 });

    // Récupérer les affectations de l'utilisateur
    const affectations = await Affectation.find({
      ID_AUDITEUR: { $in: [idAuditeur] }
    }).sort({ DATE_AFFECTATION: -1 });
    // Enrichir historique
    const enrichedHistorique = await Promise.all(
      historiques.map(async (hist) => {
        try {
          const tache = await Tache.findOne({ ID: hist.ID_TACHE });
          return {
            ...hist.toObject(),
            NOM_TACHE: tache?.NOM || 'Tâche inconnue',
            DATE_DEBUT: tache?.PERIODE_EXECUTION?.DATE_DEBUT,
            DATE_FIN: tache?.PERIODE_EXECUTION?.DATE_FIN,
            TYPE_TACHE: tache?.TYPE,
            STATUT: tache?.STATUT || 'N/A',
            source: 'historique'
          };
        } catch (err) {
          return { ...hist.toObject(), source: 'historique' };
        }
      })
    );

    // Enrichir affectations
    const enrichedAffectations = await Promise.all(
      affectations.map(async (aff) => {
        try {
          const tache = await Tache.findOne({ ID: aff.ID_TACHE });
          return {
            ID: aff.ID,
            ID_AUDITEUR: aff.ID_AUDITEUR,
            ID_TACHE: aff.ID_TACHE,
            ACTION: 'Affectation',
            DETAILS: `Affecté à la tâche${aff.MODE_AFFECTATION ? ` - ${aff.MODE_AFFECTATION}` : ' - Manuel'}`,
            STATUT: aff.DECISION || 'Affectée',
            DATE_AFFECTATION: aff.DATE_AFFECTATION,
            NOM_TACHE: tache?.NOM || 'Tâche inconnue',
            DATE_DEBUT: tache?.PERIODE_EXECUTION?.DATE_DEBUT,
            DATE_FIN: tache?.PERIODE_EXECUTION?.DATE_FIN,
            TYPE_TACHE: tache?.TYPE,
            HEURES_ESTIMEES: tache?.HEURES_ESTIMEES,
            RAPPORT: aff.DETAILS,
            ALGORITHME: aff.MODE_AFFECTATION,
            source: 'affectation',
            createdAt: aff.DATE_AFFECTATION
          };
        } catch (err) {
          console.error('Erreur enrichissement affectation:', err);
          return { ...aff.toObject(), source: 'affectation' };
        }
      })
    );

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