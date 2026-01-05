// affectationSemiAutoController.js
import Affectation from '../models/Affectation.js';
import Tache from '../models/Tache.js';
import User from '../models/User.js';
import Vehicule from '../models/Vehicule.js';
import Historique from '../models/Historique.js';
import Notification from '../models/Notification.js';

/**
 * Vérifie la disponibilité d'un auditeur pendant une période
 */
const checkAuditeurDisponibilite = async (auditeurId, tache) => {
  const affectationsExistantes = await Affectation.find({
    ID_AUDITEUR: auditeurId,
    STATUS: { $in: ["En cours", "À venir"] }
  });

  for (const affectation of affectationsExistantes) {
    const tacheExistante = await Tache.findOne({ ID: affectation.ID_TACHE });
    
    if (tacheExistante) {
      const debut1 = new Date(tache.PERIODE_EXECUTION.DATE_DEBUT);
      const fin1 = new Date(tache.PERIODE_EXECUTION.DATE_FIN);
      const debut2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_DEBUT);
      const fin2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_FIN);
      
      if (debut1 <= fin2 && debut2 <= fin1) {
        return false; // Conflit détecté
      }
    }
  }
  
  return true; // Disponible
};

/**
 * Vérifie la disponibilité d'un véhicule pendant une période
 */
const checkVehiculeDisponibilite = async (vehiculeId, tache) => {
  const affectationsExistantes = await Affectation.find({
    ID_VEHICULE: vehiculeId,
    STATUS: { $in: ["En cours", "À venir"] }
  });

  for (const affectation of affectationsExistantes) {
    const tacheExistante = await Tache.findOne({ ID: affectation.ID_TACHE });
    
    if (tacheExistante) {
      const debut1 = new Date(tache.PERIODE_EXECUTION.DATE_DEBUT);
      const fin1 = new Date(tache.PERIODE_EXECUTION.DATE_FIN);
      const debut2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_DEBUT);
      const fin2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_FIN);
      
      if (debut1 <= fin2 && debut2 <= fin1) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Calcule le nombre de tâches rémunérées d'un auditeur
 */
const getNombreTachesRemunerees = async (auditeurId) => {
  const affectations = await Affectation.find({
    ID_AUDITEUR: auditeurId,
    STATUS: { $in: ["Terminée", "En cours"] }
  });

  let count = 0;
  for (const affectation of affectations) {
    const tache = await Tache.findOne({ ID: affectation.ID_TACHE });
    if (tache && tache.REMUNEREE) {
      count++;
    }
  }

  return count;
};

/**
 * Génère le rapport détaillé de l'algorithme
 */
const genererRapportAlgorithme = (tache, auditeurs, vehicules, details) => {
  let rapport = `=== RAPPORT D'AFFECTATION SEMI-AUTOMATIQUE ===\n\n`;
  rapport += `Tâche: ${tache.NOM} (${tache.ID})\n`;
  rapport += `Période: ${new Date(tache.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()} - ${new Date(tache.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString()}\n`;
  rapport += `Places requises: ${tache.NOMBRE_PLACES}\n\n`;
  
  rapport += `=== CRITÈRES D'AFFECTATION ===\n`;
  rapport += `✓ Tour de rôle (ancienneté)\n`;
  rapport += `✓ Compatibilité de spécialité\n`;
  rapport += `✓ Équité de rémunération\n`;
  rapport += `✓ Disponibilité temporelle\n`;
  if (tache.NECESSITE_VEHICULE) {
    rapport += `✓ Disponibilité véhicule\n`;
  }
  rapport += `\n`;
  
  rapport += `=== AUDITEURS SÉLECTIONNÉS ===\n`;
  auditeurs.forEach((auditeur, index) => {
    rapport += `${index + 1}. ${auditeur.NOM} ${auditeur.PRENOM}\n`;
    rapport += `   - Spécialité: ${auditeur.SPECIALITE}\n`;
    rapport += `   - Grade: ${auditeur.GRADE}\n`;
    rapport += `   - Ancienneté: ${new Date(auditeur.createdAt).toLocaleDateString()}\n`;
    rapport += `   - Tâches rémunérées: ${details.auditeurs[auditeur.ID]?.tachesRemunerees || 0}\n`;
    rapport += `   - Score priorité: ${details.auditeurs[auditeur.ID]?.score || 0}\n`;
  });
  
  if (vehicules.length > 0) {
    rapport += `\n=== VÉHICULES SÉLECTIONNÉS ===\n`;
    vehicules.forEach((vehicule, index) => {
      rapport += `${index + 1}. ${vehicule.MARQUE} ${vehicule.MODELE} (${vehicule.IMMATRICULATION})\n`;
      rapport += `   - Capacité: ${vehicule.CAPACITE} places\n`;
    });
  }
  
  rapport += `\n=== STATISTIQUES ===\n`;
  rapport += `Candidats évalués: ${details.candidatsEvalues}\n`;
  rapport += `Candidats compatibles: ${details.candidatsCompatibles}\n`;
  rapport += `Candidats disponibles: ${details.candidatsDisponibles}\n`;
  
  return rapport;
};

/**
 * Algorithme d'affectation semi-automatique
 */
export const genererAffectationSemiAutomatique = async (req, res) => {
    console.log('BODY REÇU:', req.body);
  try {
    const { idTache } = req.body;
    
    // Récupérer la tâche
    const tache = await Tache.findOne({ ID: idTache });
    if (!tache) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    // Vérifier si la tâche a déjà une affectation
    const affectationExistante = await Affectation.findOne({ ID_TACHE: idTache });
    if (affectationExistante) {
      return res.status(400).json({ 
        message: "Cette tâche a déjà une affectation",
        affectationId: affectationExistante.ID
      });
    }
    
    // Récupérer tous les auditeurs actifs
    let auditeurs = await User.find({ ACTIF: true }).sort({ createdAt: 1 }); // Tri par ancienneté
    console.log(auditeurs);
    
    const details = {
      candidatsEvalues: auditeurs.length,
      candidatsCompatibles: 0,
      candidatsDisponibles: 0,
      auditeurs: {}
    };
    
    // Filtrer par compatibilité de spécialité
    if (tache.SPECIALITES_CONCERNEES && tache.SPECIALITES_CONCERNEES.length > 0) {
      auditeurs = auditeurs.filter(a => 
        tache.SPECIALITES_CONCERNEES.includes(a.SPECIALITE)
      );
    }
    details.candidatsCompatibles = auditeurs.length;
    console.log('169', details.candidatsCompatibles);
    
    // Filtrer par compatibilité de grade
    if (tache.GRADES_CONCERNES && tache.GRADES_CONCERNES.length > 0) {
        auditeurs = auditeurs.filter(a => 
            tache.GRADES_CONCERNES.includes(a.GRADE)
        );
    }
    
    // Évaluer chaque auditeur avec un système de score
    const auditeursAvecScore = await Promise.all(
      auditeurs.map(async (auditeur) => {
        const disponible = await checkAuditeurDisponibilite(auditeur.ID, tache);
        const tachesRemunerees = await getNombreTachesRemunerees(auditeur.ID);
        
        // Calcul du score (plus le score est élevé, plus l'auditeur est prioritaire)
        let score = 0;
        
        // Ancienneté (plus ancien = plus prioritaire)
        const anciennete = new Date() - new Date(auditeur.createdAt);
        score += anciennete / (1000 * 60 * 60 * 24); // Convertir en jours
        
        // Équité rémunération (moins de tâches rémunérées = plus prioritaire)
        score += (1000 - tachesRemunerees * 100);
        
        details.auditeurs[auditeur.ID] = {
          tachesRemunerees,
          score,
          disponible
        };
        
        return {
          ...auditeur.toObject(),
          score,
          tachesRemunerees,
          disponible
        };
    })
);

// Filtrer les auditeurs disponibles
const auditeursDisponibles = auditeursAvecScore.filter(a => a.disponible);
details.candidatsDisponibles = auditeursDisponibles.length;

console.log('213', details.candidatsDisponibles);
    if (auditeursDisponibles.length === 0) {
      return res.status(400).json({ 
        message: "Aucun auditeur disponible pour cette tâche",
        details
      });
    }
    
    // Trier par score décroissant
    auditeursDisponibles.sort((a, b) => b.score - a.score);
    
    // Sélectionner le nombre requis d'auditeurs
    const auditeursSelectionnes = auditeursDisponibles.slice(0, tache.NOMBRE_PLACES);
    
    if (auditeursSelectionnes.length < tache.NOMBRE_PLACES) {
      return res.status(400).json({ 
        message: `Seulement ${auditeursSelectionnes.length} auditeur(s) disponible(s) sur ${tache.NOMBRE_PLACES} requis`,
        auditeursSelectionnes: auditeursSelectionnes.map(a => ({
          id: a.ID,
          nom: `${a.NOM} ${a.PRENOM}`,
          specialite: a.SPECIALITE
        })),
        details
      });
    }
    
    // Sélectionner un véhicule si nécessaire
    let vehiculesSelectionnes = [];
    if (tache.NECESSITE_VEHICULE) {
      const vehicules = await Vehicule.find({ DISPONIBLE: true });
      
      for (const vehicule of vehicules) {
        const vehiculeDisponible = await checkVehiculeDisponibilite(vehicule.ID, tache);
        if (vehiculeDisponible && vehicule.CAPACITE >= auditeursSelectionnes.length) {
          vehiculesSelectionnes.push(vehicule);
          break;
        }
      }
      
      if (vehiculesSelectionnes.length === 0) {
        return res.status(400).json({ 
          message: "Aucun véhicule disponible avec capacité suffisante",
          capaciteRequise: auditeursSelectionnes.length
        });
      }
    }
    
    // Générer le rapport
    const rapport = genererRapportAlgorithme(
      tache, 
      auditeursSelectionnes, 
      vehiculesSelectionnes,
      details
    );
    
    // Retourner la proposition d'affectation
    res.json({
      success: true,
      proposition: {
        tache: {
          id: tache.ID,
          nom: tache.NOM,
          nombrePlaces: tache.NOMBRE_PLACES
        },
        auditeurs: auditeursSelectionnes.map(a => ({
          id: a.ID,
          nom: `${a.NOM} ${a.PRENOM}`,
          specialite: a.SPECIALITE,
          grade: a.GRADE,
          tachesRemunerees: a.tachesRemunerees,
          score: a.score
        })),
        vehicules: vehiculesSelectionnes.map(v => ({
          id: v.ID,
          marque: v.MARQUE,
          modele: v.MODELE,
          immatriculation: v.IMMATRICULATION,
          capacite: v.CAPACITE
        })),
        rapport,
        details
      }
    });
    
  } catch (error) {
    console.error("Erreur génération affectation semi-auto:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Confirmer une affectation semi-automatique
 */
export const confirmerAffectationSemiAutomatique = async (req, res) => {
  try {
    const { idTache, auditeursIds, vehiculesIds, rapport } = req.body;
    
    // Vérifier que la tâche n'a pas déjà d'affectation
    const affectationExistante = await Affectation.findOne({ ID_TACHE: idTache });
    if (affectationExistante) {
      return res.status(400).json({ 
        message: "Cette tâche a déjà une affectation"
      });
    }
    
    // Créer l'affectation
    const nouvelleAffectation = new Affectation({
      ID: `AFF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ID_TACHE: idTache,
      ID_AUDITEUR: auditeursIds,
      ID_VEHICULE: vehiculesIds || [],
      DATE_AFFECTATION: new Date(),
      MODE_AFFECTATION: "Semi-automatisé",
      STATUS: "À venir",
      DECISION: "En Attente"
    });
    
    await nouvelleAffectation.save();
    
    // Créer l'entrée historique avec le rapport
    const historique = new Historique({
      ID: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ID_AUDITEUR: auditeursIds,
      ID_TACHE: idTache,
      DETAILS: rapport,
      ACTION: "Affectation Semi-automatique"
    });
    
    await historique.save();
    
    // Créer les notifications pour chaque auditeur
    for (const auditeurId of auditeursIds) {
      const notification = new Notification({
        ID: `N-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        ID_AUDITEUR: auditeurId,
        ID_TACHE: idTache,
        TYPE: 'Information',
        MESSAGE: `Vous avez été affecté automatiquement à une tâche. Consultez vos tâches pour plus de détails.`,
        LUE: false
      });
      
      await notification.save();
    }
    
    res.status(201).json({
      success: true,
      message: "Affectation semi-automatique confirmée avec succès",
      affectation: nouvelleAffectation,
      historiqueId: historique.ID,
      notificationsCreees: auditeursIds.length
    });
    
  } catch (error) {
    console.error("Erreur confirmation affectation semi-auto:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Annuler une affectation semi-automatique
 */
export const annulerAffectationSemiAutomatique = async (req, res) => {
  try {
    const { idAffectation } = req.params;
    
    const affectation = await Affectation.findOne({ ID: idAffectation });
    if (!affectation) {
      return res.status(404).json({ message: "Affectation non trouvée" });
    }
    
    // Vérifier que c'est bien une affectation semi-automatique
    if (affectation.MODE_AFFECTATION !== "Semi-automatique") {
      return res.status(400).json({ 
        message: "Cette affectation n'est pas de type semi-automatique" 
      });
    }
    
    // Supprimer l'affectation
    await Affectation.deleteOne({ ID: idAffectation });
    
    // Créer une entrée historique pour l'annulation
    const historique = new Historique({
      ID: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ID_AUDITEUR: affectation.ID_AUDITEUR,
      ID_TACHE: affectation.ID_TACHE,
      DETAILS: `Affectation semi-automatique annulée par l'administrateur`,
      ACTION: "Annulation Affectation"
    });
    
    await historique.save();
    
    res.json({
      success: true,
      message: "Affectation annulée avec succès"
    });
    
  } catch (error) {
    console.error("Erreur annulation affectation:", error);
    res.status(500).json({ message: error.message });
  }
};