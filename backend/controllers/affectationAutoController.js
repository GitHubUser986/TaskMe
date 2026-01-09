// ============================================
// affectationAutoController.js
// ============================================
import Affectation from '../models/Affectation.js';
import User from '../models/User.js';
import Tache from '../models/Tache.js';
import Vehicule from '../models/Vehicule.js';
import Notification from '../models/Notification.js';
import Historique from '../models/Historique.js';

/**
 * Générer une affectation automatique avec IA
 * Analyse approfondie incluant :
 * - Historique des affectations
 * - Compatibilité profil/tâche
 * - Détection des chevauchements
 * - Équilibrage de charge
 */
export const genererAffectationAutomatique = async (req, res) => {
  try {
    const { idTache } = req.body;

    if (!idTache) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la tâche est requis"
      });
    }

    // 1. Récupérer la tâche
    const tache = await Tache.findOne({ ID: idTache });
    if (!tache) {
      return res.status(404).json({
        success: false,
        message: "Tâche non trouvée"
      });
    }

    // Vérifier si la tâche est déjà affectée
    const affectationExistante = await Affectation.findOne({ ID_TACHE: idTache });
    if (affectationExistante) {
      return res.status(400).json({
        success: false,
        message: "Cette tâche est déjà affectée"
      });
    }

    // 2. Récupérer tous les auditeurs actifs
    const tousLesAuditeurs = await User.find({ 
      ACTIF: true,
      ROLE: { $in: ['USER'] }
    });

    console.log(`[IA] ${tousLesAuditeurs.length} auditeurs trouvés`);

    // 3. Récupérer toutes les affectations existantes pour analyse
    const affectations = await Affectation.find();
    
    // 4. Récupérer l'historique complet
    const historique = await Historique.find();

    // 5. PHASE 1 : Analyse de compatibilité de base
    const candidatsCompatibles = [];
    let rapport = "=== RAPPORT D'ANALYSE IA ===\n\n";
    rapport += `Tâche : ${tache.NOM}\n`;
    rapport += `Places requises : ${tache.NOMBRE_PLACES}\n`;
    rapport += `Période : ${tache.PERIODE_EXECUTION.DATE_DEBUT.toLocaleDateString()} - ${tache.PERIODE_EXECUTION.DATE_FIN.toLocaleDateString()}\n\n`;
    rapport += `--- PHASE 1 : ANALYSE DE COMPATIBILITÉ ---\n`;

    for (const auditeur of tousLesAuditeurs) {
      let compatible = true;
      let scoreCompatibilite = 100;
      let raisonsIncompatibilite = [];

      // Vérifier spécialité
      if (tache.SPECIALITES_CONCERNEES && tache.SPECIALITES_CONCERNEES.length > 0) {
        if (!tache.SPECIALITES_CONCERNEES.includes(auditeur.SPECIALITE)) {
          compatible = false;
          scoreCompatibilite -= 50;
          raisonsIncompatibilite.push(`Spécialité incompatible (requis: ${tache.SPECIALITES_CONCERNEES.join(', ')})`);
        }
      }

      // Vérifier grade
      if (tache.GRADES_CONCERNES && tache.GRADES_CONCERNES.length > 0) {
        if (!tache.GRADES_CONCERNES.includes(auditeur.GRADE)) {
          compatible = false;
          scoreCompatibilite -= 30;
          raisonsIncompatibilite.push(`Grade incompatible (requis: ${tache.GRADES_CONCERNES.join(', ')})`);
        }
      }

      if (compatible) {
        candidatsCompatibles.push(auditeur);
      } else {
        rapport += `❌ ${auditeur.NOM} ${auditeur.PRENOM} - ${raisonsIncompatibilite.join(', ')}\n`;
      }
    }

    rapport += `\n✅ Candidats compatibles : ${candidatsCompatibles.length}/${tousLesAuditeurs.length}\n\n`;

    if (candidatsCompatibles.length < tache.NOMBRE_PLACES) {
      return res.status(400).json({
        success: false,
        message: `Pas assez de candidats compatibles (${candidatsCompatibles.length} trouvés, ${tache.NOMBRE_PLACES} requis)`,
        rapport
      });
    }

    // 6. PHASE 2 : Analyse de disponibilité temporelle et détection de chevauchements
    rapport += `--- PHASE 2 : ANALYSE DE DISPONIBILITÉ TEMPORELLE ---\n`;
    const candidatsDisponibles = [];
    const conflitsDetectes = [];

    for (const auditeur of candidatsCompatibles) {
      let disponible = true;
      let conflits = [];

      // Vérifier les chevauchements avec les affectations existantes
      for (const affectation of affectations) {
        const estDansAffectation = affectation.ID_AUDITEURS.some(
          a => a.ID_AUDITEUR === auditeur.ID && 
          (a.DECISION === "Acceptée" || a.DECISION === "En Attente")
        );

        if (estDansAffectation) {
          const tacheExistante = await Tache.findOne({ ID: affectation.ID_TACHE });
          if (tacheExistante && tacheExistante.PERIODE_EXECUTION) {
            const dateDebut1 = new Date(tache.PERIODE_EXECUTION.DATE_DEBUT);
            const dateFin1 = new Date(tache.PERIODE_EXECUTION.DATE_FIN);
            const dateDebut2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_DEBUT);
            const dateFin2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_FIN);

            // Vérifier le chevauchement
            if (dateDebut1 <= dateFin2 && dateFin1 >= dateDebut2) {
              disponible = false;
              conflits.push({
                tache: tacheExistante.NOM,
                periode: `${dateDebut2.toLocaleDateString()} - ${dateFin2.toLocaleDateString()}`
              });
              conflitsDetectes.push({
                auditeur: `${auditeur.NOM} ${auditeur.PRENOM}`,
                conflit: tacheExistante.NOM
              });
            }
          }
        }
      }

      if (disponible) {
        candidatsDisponibles.push(auditeur);
        rapport += `✅ ${auditeur.NOM} ${auditeur.PRENOM} - Disponible\n`;
      } else {
        rapport += `⚠️ ${auditeur.NOM} ${auditeur.PRENOM} - Conflit : ${conflits.map(c => c.tache).join(', ')}\n`;
      }
    }

    rapport += `\n✅ Candidats disponibles : ${candidatsDisponibles.length}/${candidatsCompatibles.length}\n\n`;

    if (candidatsDisponibles.length < tache.NOMBRE_PLACES) {
      return res.status(400).json({
        success: false,
        message: `Pas assez de candidats disponibles après détection des chevauchements (${candidatsDisponibles.length} disponibles, ${tache.NOMBRE_PLACES} requis)`,
        conflits: conflitsDetectes,
        rapport
      });
    }

    // 7. PHASE 3 : Analyse de l'historique et calcul des scores IA
    rapport += `--- PHASE 3 : ANALYSE HISTORIQUE ET SCORING IA ---\n`;
    const candidatsAvecScores = [];

    for (const auditeur of candidatsDisponibles) {
      // Compter les affectations passées
      const affectationsAuditeur = affectations.filter(aff =>
        aff.ID_AUDITEURS.some(a => a.ID_AUDITEUR === auditeur.ID)
      );

      // Compter les tâches acceptées
      const tachesAcceptees = affectationsAuditeur.filter(aff =>
        aff.ID_AUDITEURS.find(a => a.ID_AUDITEUR === auditeur.ID && a.DECISION === "Acceptée")
      ).length;

      // Compter les tâches rémunérées
      let tachesRemunerees = 0;
      for (const aff of affectationsAuditeur) {
        const tacheAff = await Tache.findOne({ ID: aff.ID_TACHE });
        if (tacheAff && tacheAff.REMUNEREE) {
          const auditeurData = aff.ID_AUDITEURS.find(a => a.ID_AUDITEUR === auditeur.ID);
          if (auditeurData && auditeurData.DECISION === "Acceptée") {
            tachesRemunerees++;
          }
        }
      }

      // Calculer le taux d'acceptation
      const totalAffectations = affectationsAuditeur.length;
      const tauxAcceptation = totalAffectations > 0 ? (tachesAcceptees / totalAffectations) * 100 : 100;

      // Analyser l'historique des actions
      const historiqueAuditeur = historique.filter(h =>
        h.ID_AUDITEUR && h.ID_AUDITEUR.includes(auditeur.ID)
      );

      // Calculer la date de dernière tâche
      let derniereTache = null;
      const affectationsAcceptees = affectations
        .filter(aff => {
          const auditeurData = aff.ID_AUDITEURS.find(a => a.ID_AUDITEUR === auditeur.ID);
          return auditeurData && auditeurData.DECISION === "Acceptée";
        })
        .sort((a, b) => new Date(b.DATE_AFFECTATION) - new Date(a.DATE_AFFECTATION));
      
      if (affectationsAcceptees.length > 0) {
        derniereTache = affectationsAcceptees[0].DATE_AFFECTATION;
      }

      // CALCUL DU SCORE IA
      let score = 0;
      const details = {
        anciennete: 0,
        specialite: 0,
        grade: 0,
        disponibilite: 0,
        charge: 0,
        historique: 0
      };

      // 1. Score de spécialité (30 points)
      if (tache.SPECIALITES_CONCERNEES && tache.SPECIALITES_CONCERNEES.includes(auditeur.SPECIALITE)) {
        details.specialite = 30;
        score += 30;
      }

      // 2. Score de grade (20 points)
      if (tache.GRADES_CONCERNES && tache.GRADES_CONCERNES.includes(auditeur.GRADE)) {
        details.grade = 20;
        score += 20;
      }

      // 3. Score de disponibilité (25 points - 100% car déjà filtré)
      details.disponibilite = 25;
      score += 25;

      // 4. Score basé sur la charge de travail (15 points)
      // Moins de tâches = score plus élevé
      const maxTaches = Math.max(...candidatsDisponibles.map(c => {
        return affectations.filter(aff =>
          aff.ID_AUDITEURS.some(a => a.ID_AUDITEUR === c.ID && a.DECISION === "Acceptée")
        ).length;
      }), 1);
      
      const chargeScore = 15 * (1 - (totalAffectations / maxTaches));
      details.charge = Math.round(chargeScore);
      score += chargeScore;

      // 5. Score d'équité rémunération (20 points)
      // Priorité aux auditeurs avec moins de tâches rémunérées
      if (tache.REMUNEREE) {
        const maxRemunerees = Math.max(...candidatsDisponibles.map(c => {
          return affectations.filter(aff => {
            const tacheAff = tache;
            return tacheAff && tacheAff.REMUNEREE && 
                   aff.ID_AUDITEURS.some(a => a.ID_AUDITEUR === c.ID && a.DECISION === "Acceptée");
          }).length;
        }), 1);
        
        const equiteScore = 20 * (1 - (tachesRemunerees / maxRemunerees));
        details.charge += Math.round(equiteScore);
        score += equiteScore;
      }

      // 6. Score d'historique (10 points)
      // Bonus pour bon taux d'acceptation
      const historiqueScore = (tauxAcceptation / 100) * 10;
      details.historique = Math.round(historiqueScore);
      score += historiqueScore;

      // 7. Ancienneté (bonus calculé sur la date de dernière tâche)
      if (derniereTache) {
        const joursDepuisDerniereTache = Math.floor((new Date() - new Date(derniereTache)) / (1000 * 60 * 60 * 24));
        const ancienneteBonus = Math.min(joursDepuisDerniereTache / 30, 3); // Max 3 points pour 3+ mois
        details.anciennete = Math.round(ancienneteBonus);
        score += ancienneteBonus;
      } else {
        // Pas d'affectation précédente = priorité maximale
        details.anciennete = 5;
        score += 5;
      }

      candidatsAvecScores.push({
        auditeur,
        score: Math.round(score * 10) / 10,
        totalAffectations,
        tachesAcceptees,
        tachesRemunerees,
        tauxAcceptation: Math.round(tauxAcceptation),
        derniereTache,
        details
      });

      rapport += `📊 ${auditeur.NOM} ${auditeur.PRENOM}\n`;
      rapport += `   Score total: ${Math.round(score * 10) / 10}/100\n`;
      rapport += `   - Spécialité: ${details.specialite}/30\n`;
      rapport += `   - Grade: ${details.grade}/20\n`;
      rapport += `   - Disponibilité: ${details.disponibilite}/25\n`;
      rapport += `   - Charge: ${details.charge}/35\n`;
      rapport += `   - Historique: ${details.historique}/10\n`;
      rapport += `   - Ancienneté: ${details.anciennete}/5\n`;
      rapport += `   Tâches totales: ${totalAffectations} | Acceptées: ${tachesAcceptees} | Rémunérées: ${tachesRemunerees}\n`;
      rapport += `   Taux d'acceptation: ${Math.round(tauxAcceptation)}%\n\n`;
    }

    // 8. Trier par score et sélectionner les meilleurs
    candidatsAvecScores.sort((a, b) => b.score - a.score);
    const auditeursSelectionnes = candidatsAvecScores.slice(0, tache.NOMBRE_PLACES);

    rapport += `--- PHASE 4 : SÉLECTION FINALE ---\n`;
    rapport += `Auditeurs sélectionnés (${auditeursSelectionnes.length}):\n`;
    auditeursSelectionnes.forEach((c, idx) => {
      rapport += `${idx + 1}. ${c.auditeur.NOM} ${c.auditeur.PRENOM} - Score: ${c.score}\n`;
    });
    rapport += `\n`;

    // 9. PHASE 5 : Détection des surcharges potentielles
    rapport += `--- PHASE 5 : ANALYSE DES SURCHARGES ---\n`;
    const surchargesDetectees = [];
    const seuilSurcharge = 5; // Seuil de tâches actives

    for (const candidat of auditeursSelectionnes) {
      const tachesActives = affectations.filter(aff => {
        const auditeurData = aff.ID_AUDITEURS.find(a => a.ID_AUDITEUR === candidat.auditeur.ID);
        return auditeurData && 
               (auditeurData.DECISION === "Acceptée" || auditeurData.DECISION === "En Attente") &&
               aff.STATUS === "En cours";
      }).length;

      if (tachesActives >= seuilSurcharge) {
        surchargesDetectees.push({
          auditeur: `${candidat.auditeur.NOM} ${candidat.auditeur.PRENOM}`,
          tachesActives
        });
        rapport += `⚠️ ${candidat.auditeur.NOM} ${candidat.auditeur.PRENOM} - ${tachesActives} tâches actives (surcharge potentielle)\n`;
      }
    }

    if (surchargesDetectees.length === 0) {
      rapport += `✅ Aucune surcharge détectée\n`;
    }
    rapport += `\n`;

    // 10. Sélectionner les véhicules si nécessaire
    let vehiculesSelectionnes = [];
    if (tache.NECESSITE_VEHICULE) {
      rapport += `--- PHASE 6 : SÉLECTION DES VÉHICULES ---\n`;
      
      const vehiculesDisponibles = await Vehicule.find({ 
        DISPONIBLE: true,
        DIRECTION: tache.DIRECTION
      });

      if (vehiculesDisponibles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucun véhicule disponible pour cette direction"
        });
      }

      // Trier par capacité décroissante
      vehiculesDisponibles.sort((a, b) => b.CAPACITE - a.CAPACITE);
      
      // Sélectionner le nombre minimum de véhicules nécessaires
      let placesRestantes = tache.NOMBRE_PLACES;
      for (const vehicule of vehiculesDisponibles) {
        if (placesRestantes <= 0) break;
        vehiculesSelectionnes.push(vehicule);
        placesRestantes -= vehicule.CAPACITE;
        rapport += `🚗 ${vehicule.MARQUE} ${vehicule.MODELE} (${vehicule.IMMATRICULATION}) - Capacité: ${vehicule.CAPACITE}\n`;
      }

      if (placesRestantes > 0) {
        return res.status(400).json({
          success: false,
          message: "Capacité de véhicules insuffisante"
        });
      }
      rapport += `\n`;
    }

    // 11. Calculer le taux de confiance de l'IA
    const scoresAuditeurs = auditeursSelectionnes.map(c => c.score);
    const scoreMoyen = scoresAuditeurs.reduce((a, b) => a + b, 0) / scoresAuditeurs.length;
    const tauxConfiance = Math.min(Math.round(scoreMoyen), 100);

    rapport += `--- RÉSUMÉ DE L'ANALYSE IA ---\n`;
    rapport += `Taux de confiance: ${tauxConfiance}%\n`;
    rapport += `Conflits potentiels détectés: ${conflitsDetectes.length}\n`;
    rapport += `Surcharges détectées: ${surchargesDetectees.length}\n`;
    rapport += `Score moyen des sélectionnés: ${Math.round(scoreMoyen * 10) / 10}/100\n`;

    // 12. Générer les recommandations
    const recommandations = [];
    if (tauxConfiance < 70) {
      recommandations.push("Le taux de confiance est faible. Vérifier manuellement les affectations.");
    }
    if (conflitsDetectes.length > 0) {
      recommandations.push(`${conflitsDetectes.length} conflit(s) temporel(s) détecté(s) avec d'autres tâches.`);
    }
    if (surchargesDetectees.length > 0) {
      recommandations.push(`${surchargesDetectees.length} auditeur(s) pourrai(en)t être surchargé(s).`);
    }
    if (recommandations.length === 0) {
      recommandations.push("Affectation optimale selon tous les critères IA.");
    }

    rapport += `\nRecommandations:\n`;
    recommandations.forEach(rec => {
      rapport += `- ${rec}\n`;
    });

    // 13. Préparer la réponse
    const proposition = {
      tache: {
        id: tache.ID,
        nom: tache.NOM,
        nombrePlaces: tache.NOMBRE_PLACES
      },
      auditeurs: auditeursSelectionnes.map(c => ({
        id: c.auditeur.ID,
        nom: `${c.auditeur.NOM} ${c.auditeur.PRENOM}`,
        grade: c.auditeur.GRADE,
        specialite: c.auditeur.SPECIALITE,
        tachesRemunerees: c.tachesRemunerees,
        score: c.score,
        historique: {
          totalTaches: c.totalAffectations,
          tauxAcceptation: c.tauxAcceptation,
          derniereTache: c.derniereTache ? c.derniereTache.toLocaleDateString() : 'Aucune'
        },
        compatibilite: {
          specialite: c.details.specialite,
          grade: c.details.grade,
          disponibilite: c.details.disponibilite,
          charge: c.details.charge
        }
      })),
      vehicules: vehiculesSelectionnes.map(v => ({
        id: v.ID,
        marque: v.MARQUE,
        modele: v.MODELE,
        immatriculation: v.IMMATRICULATION,
        capacite: v.CAPACITE
      })),
      details: {
        candidatsEvalues: tousLesAuditeurs.length,
        candidatsCompatibles: candidatsCompatibles.length,
        candidatsDisponibles: candidatsDisponibles.length
      },
      analyse: {
        conflitsPotentiels: conflitsDetectes.length,
        surchargesDetectees: surchargesDetectees.length,
        tauxConfiance,
        recommandations
      },
      rapport
    };

    res.json({
      success: true,
      message: "Proposition générée avec succès par l'IA",
      proposition
    });

  } catch (error) {
    console.error('Erreur génération IA:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération de l'affectation automatique",
      error: error.message
    });
  }
};

/**
 * Confirmer une affectation automatique
 */
export const confirmerAffectationAutomatique = async (req, res) => {
  try {
    const { idTache, auditeursIds, vehiculesIds, rapport } = req.body;

    if (!idTache || !auditeursIds || !Array.isArray(auditeursIds)) {
      return res.status(400).json({
        success: false,
        message: "Données invalides"
      });
    }

    const tache = await Tache.findOne({ ID: idTache });
    if (!tache) {
      return res.status(404).json({
        success: false,
        message: "Tâche non trouvée"
      });
    }

    // Créer l'ID de l'affectation
    const affectationId = `AFF_${Date.now()}`;

    // Créer le tableau des auditeurs
    const idAuditeurs = auditeursIds.map(id => ({
      ID_AUDITEUR: id,
      DECISION: "En Attente",
      DATE_REPONSE: null,
      REPONSE_DANS_DELAI: null
    }));

    // Créer l'affectation
    const nouvelleAffectation = new Affectation({
      ID: affectationId,
      ID_TACHE: idTache,
      ID_VEHICULE: vehiculesIds || [],
      ID_AUDITEURS: idAuditeurs,
      DATE_AFFECTATION: new Date(),
      MODE_AFFECTATION: "Automatisé (IA)",
      STATUS: "À venir",
      RAPPORT: {
        fileName: `rapport_ia_${affectationId}.txt`,
        filePath: `/rapports/${affectationId}.txt`,
        mimeType: "text/plain",
        size: rapport ? rapport.length : 0,
        createdAt: new Date()
      }
    });

    await nouvelleAffectation.save();

    // Créer les notifications pour chaque auditeur
    let notificationsCreees = 0;
    for (const auditeurId of auditeursIds) {
      await Notification.create({
        ID: `NOTIF_${Date.now()}_${auditeurId}`,
        ID_AUDITEUR: auditeurId,
        MESSAGE: `Nouvelle tâche affectée par l'IA : ${tache.NOM}. Vous avez 24h pour répondre.`,
        TYPE: 'Information',
        LUE: false
      });
      notificationsCreees++;
    }

    // Créer l'historique
    await Historique.create({
      ID: `HIST_${Date.now()}`,
      ID_AUDITEUR: auditeursIds,
      ID_TACHE: idTache,
      ACTION: 'Affectation automatique (IA)',
      DETAILS: `Affectation créée par l'IA pour la tâche ${tache.NOM} avec ${auditeursIds.length} auditeur(s)`,
      DATE: new Date()
    });

    res.json({
      success: true,
      message: "Affectation automatique confirmée avec succès",
      affectation: nouvelleAffectation,
      notificationsCreees
    });

  } catch (error) {
    console.error('Erreur confirmation IA:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation",
      error: error.message
    });
  }
};

