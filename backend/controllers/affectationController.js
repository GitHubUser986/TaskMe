import path from 'path';
import fs from 'fs';
import {jsPDF} from 'jspdf';

import Affectation from '../models/Affectation.js';
import Tache from '../models/Tache.js';
import User from '../models/User.js';
import Vehicule from '../models/Vehicule.js';
import Historique from '../models/Historique.js';
import Notification from '../models/Notification.js';
import { sendNotificationEmail } from '../services/emailService.js';

/**
 * Vérifie la disponibilité d'un auditeur pendant la période d'une tâche
 */
const checkAuditeurDisponibilite = async (auditeurId, tache) => {
  const affectationsExistantes = await Affectation.find({
    "ID_AUDITEURS.ID_AUDITEUR": auditeurId,
    STATUS: { $in: ["En cours", "À venir"] }
  });

  const conflits = [];
  
  for (const affectation of affectationsExistantes) {
    const tacheExistante = await Tache.findOne({ ID: affectation.ID_TACHE });
    
    if (tacheExistante) {
      const debut1 = new Date(tache.PERIODE_EXECUTION.DATE_DEBUT);
      const fin1 = new Date(tache.PERIODE_EXECUTION.DATE_FIN);
      const debut2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_DEBUT);
      const fin2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_FIN);
      
      // Vérifie si les périodes se chevauchent
      if (debut1 <= fin2 && debut2 <= fin1) {
        conflits.push({
          tacheId: tacheExistante.ID,
          tacheNom: tacheExistante.NOM,
          periode: `${debut2.toLocaleDateString()} - ${fin2.toLocaleDateString()}`
        });
      }
    }
  }
  
  return conflits;
};

/**
 * Vérifie la disponibilité d'un véhicule pendant la période d'une tâche
 */
const checkVehiculeDisponibilite = async (vehiculeId, tache) => {
  const affectationsExistantes = await Affectation.find({
    ID_VEHICULE: vehiculeId,
    STATUS: { $in: ["En cours", "À venir"] }
  });

  const conflits = [];
  
  for (const affectation of affectationsExistantes) {
    const tacheExistante = await Tache.findOne({ ID: affectation.ID_TACHE });
    
    if (tacheExistante) {
      const debut1 = new Date(tache.PERIODE_EXECUTION.DATE_DEBUT);
      const fin1 = new Date(tache.PERIODE_EXECUTION.DATE_FIN);
      const debut2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_DEBUT);
      const fin2 = new Date(tacheExistante.PERIODE_EXECUTION.DATE_FIN);
      
      if (debut1 <= fin2 && debut2 <= fin1) {
        conflits.push({
          tacheId: tacheExistante.ID,
          tacheNom: tacheExistante.NOM,
          periode: `${debut2.toLocaleDateString()} - ${fin2.toLocaleDateString()}`
        });
      }
    }
  }
  
  return conflits;
};

/**
 * Vérifie la compatibilité des auditeurs avec la tâche
 */
const checkCompatibiliteAuditeurs = async (auditeurIds, tache) => {
  const incompatibilites = [];
  
  for (const auditeurId of auditeurIds) {
    const auditeur = await User.findOne({ ID: auditeurId });
    
    if (!auditeur) {
      incompatibilites.push({
        auditeurId,
        raison: "Auditeur non trouvé"
      });
      continue;
    }
    
    const problemes = [];
    
    // Vérifier le grade
    if (tache.GRADES_CONCERNES && tache.GRADES_CONCERNES.length > 0) {
      if (!tache.GRADES_CONCERNES.includes(auditeur.GRADE)) {
        problemes.push(`Grade incompatible (Requis: ${tache.GRADES_CONCERNES.join(', ')}, Auditeur: ${auditeur.GRADE})`);
      }
    }
    
    // Vérifier la spécialité
    if (tache.SPECIALITES_CONCERNEES && tache.SPECIALITES_CONCERNEES.length > 0) {
      if (!tache.SPECIALITES_CONCERNEES.includes(auditeur.SPECIALITE)) {
        problemes.push(`Spécialité incompatible (Requis: ${tache.SPECIALITES_CONCERNEES.join(', ')}, Auditeur: ${auditeur.SPECIALITE})`);
      }
    }
    
    if (problemes.length > 0) {
      incompatibilites.push({
        auditeurId,
        auditeurNom: `${auditeur.NOM} ${auditeur.PRENOM}`,
        problemes
      });
    }
  }
  
  return incompatibilites;
};

/**
 * Vérifie la capacité des véhicules par rapport au nombre d'auditeurs
 */
const checkCapaciteVehicules = (vehicules, nombreAuditeurs) => {
  const capaciteTotale = vehicules.reduce((sum, v) => sum + v.CAPACITE, 0);
  
  return {
    capaciteTotale,
    nombreAuditeurs,
    sufficient: capaciteTotale >= nombreAuditeurs,
    deficit: Math.max(0, nombreAuditeurs - capaciteTotale)
  };
};

/**
 * Génère un rapport détaillé des contraintes non respectées
 */
const genererRapportContraintes = (validationResult, tache) => {
  let rapport = `=== RAPPORT D'AFFECTATION MANUELLE ===\n\n`;
  rapport += `Tâche: ${tache.NOM} (${tache.ID})\n`;
  rapport += `Période: ${new Date(tache.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()} - ${new Date(tache.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString()}\n\n`;
  
  if (validationResult.contraintesNonRespectees.length === 0) {
    rapport += `✓ Toutes les contraintes sont respectées.\n`;
    return rapport;
  }
  
  rapport += `⚠ CONTRAINTES NON RESPECTÉES:\n\n`;
  
  validationResult.contraintesNonRespectees.forEach((contrainte, index) => {
    rapport += `${index + 1}. ${contrainte.type.toUpperCase()}\n`;
    rapport += `   ${contrainte.message}\n`;
    
    if (contrainte.details) {
      if (Array.isArray(contrainte.details)) {
        contrainte.details.forEach(detail => {
          rapport += `   - ${JSON.stringify(detail)}\n`;
        });
      } else {
        rapport += `   ${JSON.stringify(contrainte.details)}\n`;
      }
    }
    rapport += `\n`;
  });
  
  return rapport;
};

/**
 * Valide une affectation manuelle avant soumission
 */
export const validerAffectationManuelle = async (req, res) => {
  try {
    const { idTache, auditeursIds, vehiculesIds } = req.body;
    
    // Récupérer la tâche
    const tache = await Tache.findOne({ ID: idTache });
    if (!tache) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }
    
    const contraintesNonRespectees = [];
    
    // 1. Vérifier la disponibilité des auditeurs
    for (const auditeurId of auditeursIds) {
      const conflits = await checkAuditeurDisponibilite(auditeurId, tache);
      if (conflits.length > 0) {
        contraintesNonRespectees.push({
          type: "disponibilite_auditeur",
          message: `L'auditeur ${auditeurId} n'est pas disponible durant la période d'exécution`,
          details: conflits
        });
      }
    }
    
    // 2. Vérifier la disponibilité des véhicules
    if (vehiculesIds && vehiculesIds.length > 0) {
      for (const vehiculeId of vehiculesIds) {
        const conflits = await checkVehiculeDisponibilite(vehiculeId, tache);
        if (conflits.length > 0) {
          contraintesNonRespectees.push({
            type: "disponibilite_vehicule",
            message: `Le véhicule ${vehiculeId} n'est pas disponible durant la période d'exécution`,
            details: conflits
          });
        }
      }
    }
    
    // 3. Vérifier la compatibilité des auditeurs (grade, spécialité)
    const incompatibilites = await checkCompatibiliteAuditeurs(auditeursIds, tache);
    if (incompatibilites.length > 0) {
      contraintesNonRespectees.push({
        type: "compatibilite_auditeurs",
        message: "Certains auditeurs ne sont pas compatibles avec la tâche",
        details: incompatibilites
      });
    }
    
    // 4. Vérifier le nombre de places
    const placesRestantes = tache.NOMBRE_PLACES - auditeursIds.length;
    if (placesRestantes < 0) {
      contraintesNonRespectees.push({
        type: "nombre_places",
        message: `Le nombre d'auditeurs sélectionnés (${auditeursIds.length}) dépasse le nombre de places disponibles (${tache.NOMBRE_PLACES})`,
        details: { placesRequises: tache.NOMBRE_PLACES, placesUtilisees: auditeursIds.length, depassement: Math.abs(placesRestantes) }
      });
    }
    
    // 5. Vérifier la capacité des véhicules
    if (vehiculesIds && vehiculesIds.length > 0) {
      const vehicules = await Vehicule.find({ ID: { $in: vehiculesIds } });
      const capaciteCheck = checkCapaciteVehicules(vehicules, auditeursIds.length);
      
      if (!capaciteCheck.sufficient) {
        contraintesNonRespectees.push({
          type: "capacite_vehicules",
          message: `La capacité totale des véhicules (${capaciteCheck.capaciteTotale}) est insuffisante pour le nombre d'auditeurs (${capaciteCheck.nombreAuditeurs})`,
          details: capaciteCheck
        });
      }
    }
    
    // 6. Vérifier si un véhicule est nécessaire
    if (tache.NECESSITE_VEHICULE && (!vehiculesIds || vehiculesIds.length === 0)) {
      contraintesNonRespectees.push({
        type: "vehicule_requis",
        message: "Cette tâche nécessite un véhicule mais aucun n'a été sélectionné",
        details: null
      });
    }
    
    res.json({
      success: true,
      valide: contraintesNonRespectees.length === 0,
      contraintesNonRespectees,
      placesRestantes: Math.max(0, placesRestantes),
      tache: {
        id: tache.ID,
        nom: tache.NOM,
        nombrePlaces: tache.NOMBRE_PLACES
      }
    });
    
  } catch (error) {
    console.error("Erreur validation:", error);
    res.status(500).json({ message: error.message });
  }
};

// Génération du PDF avec sauvegarde sur le serveur
const genererPDF = (contenu, idTache) => {
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
  const fileName = `rapport_${idTache}_${Date.now()}.pdf`;
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
 * Crée une affectation manuelle avec rapport des contraintes + EMAILS
 */
export const creerAffectationManuelle = async (req, res) => {
  try {
    const { idTache, auditeursIds, vehiculesIds } = req.body;
    
    // Récupérer la tâche
    const tache = await Tache.findOne({ ID: idTache });
    if (!tache) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }
    
    // Valider l'affectation
    const contraintesNonRespectees = [];
    
    // Effectuer toutes les vérifications
    for (const auditeurId of auditeursIds) {
      const conflits = await checkAuditeurDisponibilite(auditeurId, tache);
      if (conflits.length > 0) {
        contraintesNonRespectees.push({
          type: "disponibilite_auditeur",
          message: `L'auditeur ${auditeurId} n'est pas disponible`,
          details: conflits
        });
      }
    }
    
    if (vehiculesIds && vehiculesIds.length > 0) {
      for (const vehiculeId of vehiculesIds) {
        const conflits = await checkVehiculeDisponibilite(vehiculeId, tache);
        if (conflits.length > 0) {
          contraintesNonRespectees.push({
            type: "disponibilite_vehicule",
            message: `Le véhicule ${vehiculeId} n'est pas disponible`,
            details: conflits
          });
        }
      }
    }
    
    const incompatibilites = await checkCompatibiliteAuditeurs(auditeursIds, tache);
    if (incompatibilites.length > 0) {
      contraintesNonRespectees.push({
        type: "compatibilite_auditeurs",
        message: "Incompatibilités détectées",
        details: incompatibilites
      });
    }
    
    // Générer le rapport texte
    const validationResult = { contraintesNonRespectees };
    const rapportTexte = genererRapportContraintes(validationResult, tache);
    
    // Générer le PDF et obtenir les métadonnées
    const rapportMetadata = genererPDF(rapportTexte, idTache);
    
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
      MODE_AFFECTATION: "Manuel",
      RAPPORT: rapportMetadata,
      STATUS: "À venir"
    });
    
    await nouvelleAffectation.save();
    
    // Créer l'entrée historique
    const historique = new Historique({
      ID: `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      ID_AUDITEUR: auditeursIds,
      ID_TACHE: idTache,
      DETAILS: rapportTexte,
      ACTION: "Affectation"
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
        MESSAGE: `Vous avez été affecté à la tâche "${tache.NOM}". Consultez vos tâches pour plus de détails.`,
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
          `Vous avez été affecté à la tâche "${tache.NOM}". Période: ${new Date(tache.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()} - ${new Date(tache.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString()}. Consultez l'application pour plus de détails.`,
          userName
        ).catch(error => {
          console.error(`❌ Erreur envoi email à ${user.EMAIL}:`, error.message);
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Affectation créée avec succès",
      affectation: nouvelleAffectation,
      rapport: rapportMetadata,
      rapportTexte: rapportTexte,
      contraintesNonRespectees,
      historiqueId: historique.ID,
      notificationsEnvoyees: auditeursIds.length
    });
    
  } catch (error) {
    console.error("Erreur création affectation:", error);
    res.status(500).json({ message: error.message });
  }
}; 

/**
 * Récupère les données nécessaires pour l'affectation manuelle
 */
export const getDataForManualAffectation = async (req, res) => {
  try {
    const { idTache } = req.params;
    
    const tache = await Tache.findOne({ ID: idTache });
    if (!tache) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }
    
    const auditeurs = await User.find({ ACTIF: true });
    const vehicules = await Vehicule.find({ DISPONIBLE: true });
    
    res.json({
      success: true,
      tache,
      auditeurs,
      vehicules
    });
    
  } catch (error) {
    console.error("Erreur récupération données:", error);
    res.status(500).json({ message: error.message });
  }
};