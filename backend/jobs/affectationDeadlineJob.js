import cron from 'node-cron';
import mongoose from 'mongoose';
import Affectation from '../models/Affectation.js';
import Notification from '../models/Notification.js';
import Historique from '../models/Historique.js';

/**
 * Automatically handles 24-hour deadline verification for affectations
 * - Marks pending affectations as "Refusée" after 24 hours
 * - Expires delegations that haven't received a response within 24 hours
 */
async function verifyAffectationDeadlines() {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected. Skipping deadline verification.');
      return;
    }

    console.log('Starting affectation deadline verification job...');

    const maintenant = new Date();
    const il_y_a_24h = new Date(maintenant.getTime() - 24 * 60 * 60 * 1000);

    // Find affectations assigned more than 24 hours ago with "À venir" status
    const affectations = await Affectation.find({
      DATE_AFFECTATION: { $lte: il_y_a_24h },
      STATUS: { $in: ["À venir"] }
    });

    let affectationsRefuseesCount = 0;
    let delegationsExpireesCount = 0;

    for (const affectation of affectations) {
      let modified = false;

      for (let i = 0; i < affectation.ID_AUDITEURS.length; i++) {
        const auditeur = affectation.ID_AUDITEURS[i];

        // Handle normal affectations pending for 24h
        if (auditeur.DECISION === "En Attente" && !auditeur.DATE_LIMITE_REPONSE_DELEGATION) {
          auditeur.DECISION = "Refusée";
          auditeur.DATE_REPONSE = new Date();
          auditeur.REPONSE_DANS_DELAI = false;
          modified = true;
          affectationsRefuseesCount++;

          // Create notification
          await Notification.create({
            ID: `NOTIF_${Date.now()}_${auditeur.ID_AUDITEUR}`,
            ID_AUDITEUR: auditeur.ID_AUDITEUR,
            MESSAGE: `Tâche réfusée automatiquement (délai de 24h dépassé)`,
            TYPE: 'Echoue',
            LUE: false
          });

          // Create history record
          await Historique.create({
            ID: `HIST_${Date.now()}_${auditeur.ID_AUDITEUR}`,
            ID_AUDITEUR: [auditeur.ID_AUDITEUR],
            ID_TACHE: affectation.ID_TACHE,
            ACTION: 'Refus automatique',
            DETAILS: `Tâche réfusée automatiquement après 24h sans réponse`,
            DATE: new Date()
          });

          console.log(`Auto-refused affectation for auditor ${auditeur.ID_AUDITEUR} (24h deadline exceeded)`);
        }

        // Handle delegations pending for 24h
        if (auditeur.DECISION === "En Attente" && 
            auditeur.DATE_LIMITE_REPONSE_DELEGATION && 
            new Date(auditeur.DATE_LIMITE_REPONSE_DELEGATION) <= maintenant) {
          
          // Find the delegating auditor
          const auditeurDelegantIndex = affectation.ID_AUDITEURS.findIndex(
            a => a.ID_AUDITEUR_DELEGUE === auditeur.ID_AUDITEUR
          );

          // Mark delegation as refused
          auditeur.DECISION = "Refusée";
          auditeur.DATE_REPONSE = new Date();
          auditeur.JUSTIFICATIF_REFUS = "Pas de réponse dans le délai de 24h";

          // Mark the initial auditor as pending again
          if (auditeurDelegantIndex !== -1) {
            affectation.ID_AUDITEURS[auditeurDelegantIndex].DECISION = "En Attente";

            const idDelegant = affectation.ID_AUDITEURS[auditeurDelegantIndex].ID_AUDITEUR;

            // Create notifications
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

            // Create history record
            await Historique.create({
              ID: `HIST_${Date.now()}_${auditeur.ID_AUDITEUR}`,
              ID_AUDITEUR: [auditeur.ID_AUDITEUR, idDelegant],
              ID_TACHE: affectation.ID_TACHE,
              ACTION: 'Expiration de délégation',
              DETAILS: `Délégation expirée sans réponse. Tâche considérée comme refusée.`,
              DATE: new Date()
            });

            console.log(`Expired delegation for auditor ${auditeur.ID_AUDITEUR}, returned to ${idDelegant}`);
          }

          modified = true;
          delegationsExpireesCount++;
        }
      }

      if (modified) {
        // Check if all auditors have accepted
        const tousAcceptes = affectation.ID_AUDITEURS.every(
          a => a.DECISION === "Acceptée" || a.DECISION === "Déléguée"
        );

        if (tousAcceptes) {
          affectation.STATUS = "En cours";
        }

        await affectation.save();
      }
    }

    console.log(`Deadline verification completed. ${affectationsRefuseesCount} affectations auto-refused, ${delegationsExpireesCount} delegations expired.`);
  } catch (error) {
    console.error('Error verifying affectation deadlines:', error);
  }
}

/**
 * Initialize the cron job
 * Runs every 30 minutes by default
 * You can adjust the schedule as needed:
 * - '* /30 * * * *' = every 30 minutes
 * - '0 * * * *' = every hour
 * - '0 * /2 * * *' = every 2 hours
 * - '0 0 * * *' = daily at midnight
 */
export function startAffectationDeadlineJob() {
  // Wait for MongoDB connection before running
  if (mongoose.connection.readyState === 1) {
    // Already connected, run immediately
    verifyAffectationDeadlines();
  } else {
    // Wait for connection
    mongoose.connection.once('open', () => {
      console.log('MongoDB connected - running initial deadline verification');
      verifyAffectationDeadlines();
    });
  }
  
  // Schedule to run every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    verifyAffectationDeadlines();
  });
  
  console.log('Affectation deadline verification cron job scheduled (runs every 30 minutes)');
}

// Export the verification function in case you need to trigger it manually
export { verifyAffectationDeadlines };