import Tache from "../models/Tache.js";
import Affectation from "../models/Affectation.js";
import User from "../models/User.js";

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
 * Calcule le volume horaire d'une tâche (différence en heures entre date début et fin)
 */
const calculateTaskHours = (tache) => {
  if (!tache.PERIODE_EXECUTION?.DATE_DEBUT || !tache.PERIODE_EXECUTION?.DATE_FIN) {
    return 0;
  }
  
  const debut = new Date(tache.PERIODE_EXECUTION.DATE_DEBUT);
  const fin = new Date(tache.PERIODE_EXECUTION.DATE_FIN);
  const diffMs = fin - debut;
  const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
  
  return Math.round(diffHours);
};

/**
 * GET /api/dashboard/stats
 * Récupère toutes les statistiques pour le dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Récupérer toutes les tâches
    const taches = await Tache.find();
    
    // 2. Récupérer toutes les affectations
    const affectations = await Affectation.find();
    
    // 3. Récupérer tous les auditeurs actifs
    const auditeurs = await User.find({ ACTIF: true, ROLE: "USER" });

    // 4. Calculer les statistiques globales
    const totalTaches = taches.length;
    const tachesRemuneres = taches.filter(t => t.REMUNEREE).length;
    const tachesNonRemuneres = taches.filter(t => !t.REMUNEREE).length;
    
    // Calculer le volume horaire total
    const totalHours = taches.reduce((sum, tache) => {
      return sum + calculateTaskHours(tache);
    }, 0);

    // 5. Calculer les statistiques par auditeur
    const statsParAuditeur = auditeurs.map(auditeur => {
      // Récupérer les affectations où cet auditeur est impliqué
      const affectationsAuditeur = affectations.filter(aff => 
        aff.ID_AUDITEUR.includes(auditeur.ID)
      );

      // Calculer le nombre de tâches
      const nombreTaches = affectationsAuditeur.length;

      // Calculer le volume horaire total pour cet auditeur
      const volumeHoraire = affectationsAuditeur.reduce((sum, aff) => {
        const tache = taches.find(t => t.ID === aff.ID_TACHE);
        if (tache) {
          return sum + calculateTaskHours(tache);
        }
        return sum;
      }, 0);

      // Compter les tâches rémunérées et non rémunérées
      const tachesRemunerees = affectationsAuditeur.filter(aff => {
        const tache = taches.find(t => t.ID === aff.ID_TACHE);
        return tache?.REMUNEREE;
      }).length;

      const tachesNonRemunerees = affectationsAuditeur.filter(aff => {
        const tache = taches.find(t => t.ID === aff.ID_TACHE);
        return !tache?.REMUNEREE;
      }).length;

      return {
        id: auditeur.ID,
        name: `${auditeur.PRENOM} ${auditeur.NOM}`,
        tasks: nombreTaches,
        hours: volumeHoraire,
        remuneratedTasks: tachesRemunerees,
        nonRemuneratedTasks: tachesNonRemunerees
      };
    });

    // 6. Préparer la réponse
    const dashboardData = {
      stats: {
        total: totalTaches,
        remunerated: tachesRemuneres,
        nonRemunerated: tachesNonRemuneres,
        totalHours: totalHours
      },
      auditors: statsParAuditeur
    };

    res.json(successResponse(dashboardData, "Statistiques récupérées avec succès"));

  } catch (error) {
    console.error('Erreur getDashboardStats:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * GET /api/dashboard/tasks-distribution
 * Récupère la distribution des tâches par type
 */
export const getTasksDistribution = async (req, res) => {
  try {
    const taches = await Tache.find();

    // Grouper par type
    const distribution = taches.reduce((acc, tache) => {
      const type = tache.TYPE;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    res.json(successResponse({ distribution }, "Distribution récupérée avec succès"));

  } catch (error) {
    console.error('Erreur getTasksDistribution:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * GET /api/dashboard/monthly-stats
 * Récupère les statistiques mensuelles
 */
export const getMonthlyStats = async (req, res) => {
  try {
    const taches = await Tache.find();

    // Grouper par mois
    const monthlyData = {};
    
    taches.forEach(tache => {
      const month = new Date(tache.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          total: 0,
          remunerated: 0,
          nonRemunerated: 0
        };
      }
      
      monthlyData[month].total++;
      if (tache.REMUNEREE) {
        monthlyData[month].remunerated++;
      } else {
        monthlyData[month].nonRemunerated++;
      }
    });

    res.json(successResponse({ monthlyData }, "Statistiques mensuelles récupérées avec succès"));

  } catch (error) {
    console.error('Erreur getMonthlyStats:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * GET /api/dashboard/equity-indicators
 * Récupère les indicateurs d'équité
 */
export const getEquityIndicators = async (req, res) => {
  try {
    const affectations = await Affectation.find();
    const taches = await Tache.find();
    const auditeurs = await User.find({ ACTIF: true, ROLE: "USER" });

    // Calculer les indicateurs par auditeur
    const auditeurStats = auditeurs.map(auditeur => {
      const affectationsAuditeur = affectations.filter(aff => 
        aff.ID_AUDITEUR.includes(auditeur.ID)
      );

      const nombreTaches = affectationsAuditeur.length;
      
      const volumeHoraire = affectationsAuditeur.reduce((sum, aff) => {
        const tache = taches.find(t => t.ID === aff.ID_TACHE);
        if (tache) {
          return sum + calculateTaskHours(tache);
        }
        return sum;
      }, 0);

      return { nombreTaches, volumeHoraire };
    });

    // Calculer les écarts
    const tachesArray = auditeurStats.map(s => s.nombreTaches);
    const heuresArray = auditeurStats.map(s => s.volumeHoraire);

    const maxTaches = Math.max(...tachesArray, 0);
    const minTaches = Math.min(...tachesArray, 0);
    const maxHeures = Math.max(...heuresArray, 0);
    const minHeures = Math.min(...heuresArray, 0);

    const equityData = {
      taskDistribution: {
        max: maxTaches,
        min: minTaches,
        gap: maxTaches - minTaches,
        equityPercentage: maxTaches > 0 ? ((1 - (maxTaches - minTaches) / maxTaches) * 100).toFixed(0) : 100
      },
      hourDistribution: {
        max: maxHeures,
        min: minHeures,
        gap: maxHeures - minHeures,
        equityPercentage: maxHeures > 0 ? ((1 - (maxHeures - minHeures) / maxHeures) * 100).toFixed(0) : 100
      }
    };

    res.json(successResponse(equityData, "Indicateurs d'équité récupérés avec succès"));

  } catch (error) {
    console.error('Erreur getEquityIndicators:', error);
    res.status(500).json(errorResponse(error.message));
  }
};