import path from 'path';
import fs from 'fs';
import { jsPDF } from 'jspdf';
import Affectation from '../models/Affectation.js';
import Tache from '../models/Tache.js';
import User from '../models/User.js';
import Vehicule from '../models/Vehicule.js';
import Historique from '../models/Historique.js';
import Notification from '../models/Notification.js';
import { sendNotificationEmail } from '../services/emailService.js';

/**
 * Vérifie la disponibilité d'un auditeur pendant une période
 */
const checkAuditeurDisponibilite = async (auditeurId, tache) => {
  const affectationsExistantes = await Affectation.find({
    "ID_AUDITEURS.ID_AUDITEUR": auditeurId,
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
    "ID_AUDITEURS.ID_AUDITEUR": auditeurId,
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
 * Génère le rapport détaillé de l'algorithme (texte)
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
 * Génère le PDF du rapport et retourne les métadonnées
 */
const genererPDFRapport = (contenu, idTache) => {
  const pdf = new jsPDF('p', 'mm', 'a4');

  const margeX = 15;
  let y = 20;
  const lineHeight = 7;

  pdf.setFont('Times', 'Normal');
  pdf.setFontSize(11);

  const lignes = pdf.splitTextToSize(contenu, 180);

  lignes.forEach((ligne) => {
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(ligne, margeX, y);
    y += lineHeight;
  });

  // Créer le dossier uploads/rapports s'il n'existe pas
  const uploadDir = path.join(process.cwd(), 'uploads', 'rapports');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Générer le nom de fichier unique
  const fileName = `rapport_semi_auto_${idTache}_${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  // Sauvegarder le PDF
  const pdfBuffer = pdf.output('arraybuffer');
  fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

  // Retourner les métadonnées
  return {
    fileName: fileName,
    filePath: `/uploads/rapports/${fileName}`,
    mimeType: 'application/pdf',
    size: fs.statSync(filePath).size,
    createdAt: new Date()
  };
};

/**
 * Algorithme d'affectation semi-automatique
 */
export const genererAffectationSemiAutomatique = async (req, res) => {
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
    let auditeurs = await User.find({ ACTIF: true }).sort({ createdAt: 1 });
    
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
        
        // Calcul du score
        let score = 0;
        
        // Ancienneté
        const anciennete = new Date() - new Date(auditeur.createdAt);
        score += anciennete / (1000 * 60 * 60 * 24);
        
        // Équité rémunération
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
    
    // Générer le rapport texte
    const rapportTexte = genererRapportAlgorithme(
      tache, 
      auditeursSelectionnes, 
      vehiculesSelectionnes,
      details
    );
    
    // Retourner la proposition d'affectation (sans créer l'affectation encore)
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
        rapport: rapportTexte,
        details
      }
    });
    
  } catch (error) {
    console.error("Erreur génération affectation semi-auto:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Confirmer une affectation semi-automatique + ENVOYER EMAILS
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
    
    // Récupérer la tâche pour les détails
    const tache = await Tache.findOne({ ID: idTache });
    
    // Générer le PDF du rapport
    const rapportMetadata = genererPDFRapport(rapport, idTache);
    
    // Créer le tableau ID_AUDITEURS avec la nouvelle structure
    const auditeursArray = auditeursIds.map(auditeurId => ({
      ID_AUDITEUR: auditeurId,
      DECISION: "En Attente"
    }));
    
    // Créer l'affectation avec les métadonnées du rapport
    const nouvelleAffectation = new Affectation({
      ID: `AFF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ID_TACHE: idTache,
      ID_AUDITEURS: auditeursArray,
      ID_VEHICULE: vehiculesIds || [],
      DATE_AFFECTATION: new Date(),
      MODE_AFFECTATION: "Semi-automatisé",
      RAPPORT: rapportMetadata,
      STATUS: "À venir"
    });
    
    await nouvelleAffectation.save();
    
    // Créer l'entrée historique avec le rapport texte
    const historique = new Historique({
      ID: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ID_AUDITEUR: auditeursIds,
      ID_TACHE: idTache,
      DETAILS: rapport,
      ACTION: "Affectation Semi-automatique"
    });
    
    await historique.save();
    
    // ⭐ Créer les notifications IN-APP + EMAIL pour chaque auditeur
    for (const auditeurId of auditeursIds) {
      // 1. Créer notification in-app
      const notification = new Notification({
        ID: `N-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        ID_AUDITEUR: auditeurId,
        ID_TACHE: idTache,
        TYPE: 'Information',
        MESSAGE: `Vous avez été affecté automatiquement à la tâche "${tache.NOM}". Consultez vos tâches pour plus de détails.`,
        LUE: false
      });
      
      await notification.save();

      // 2. Récupérer l'utilisateur pour l'email
      const user = await User.findOne({ ID: auditeurId });
      
      if (user && user.EMAIL) {
        const userName = `${user.PRENOM} ${user.NOM}`;
        
        // 3. Envoyer l'email de manière asynchrone (ne bloque pas la réponse)
        sendNotificationEmail(
          user.EMAIL,
          'Information',
          `Vous avez été sélectionné automatiquement pour la tâche "${tache.NOM}". Période: ${new Date(tache.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()} - ${new Date(tache.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString()}. Consultez l'application pour accepter ou refuser cette affectation.`,
          userName
        ).catch(error => {
          console.error(`❌ Erreur envoi email à ${user.EMAIL}:`, error.message);
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Affectation semi-automatique confirmée avec succès",
      affectation: nouvelleAffectation,
      rapport: rapportMetadata,
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
    if (affectation.MODE_AFFECTATION !== "Semi-automatisé") {
      return res.status(400).json({ 
        message: "Cette affectation n'est pas de type semi-automatique" 
      });
    }
    
    // Supprimer le fichier PDF si existant
    if (affectation.RAPPORT && affectation.RAPPORT.fileName) {
      const filePath = path.join(process.cwd(), 'uploads', 'rapports', affectation.RAPPORT.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Supprimer l'affectation
    await Affectation.deleteOne({ ID: idAffectation });
    
    // Extraire les IDs des auditeurs
    const auditeurIds = affectation.ID_AUDITEURS.map(a => a.ID_AUDITEUR);
    
    // Créer une entrée historique pour l'annulation
    const historique = new Historique({
      ID: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ID_AUDITEUR: auditeurIds,
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