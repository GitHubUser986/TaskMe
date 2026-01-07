import { application } from "express";
import mongoose from "mongoose";

const affectationSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  ID_TACHE: { type: String, required: true },
  ID_VEHICULE: { type: [String], default: null },
  ID_AUDITEURS: [
    {
      ID_AUDITEUR: { type: String, required: true },
      DECISION: { 
        type: String, 
        enum: ["Acceptée", "Refusée", "Déléguée", "En Attente"], 
        required: true,
        default: "En Attente"
      },
      JUSTIFICATIF_REFUS: { type: String },
      ID_AUDITEUR_DELEGUE: { type: String },
      JUSTIFICATIF_DELEGATION: { type: String },
      DATE_LIMITE_REPONSE_DELEGATION: { type: Date },
      DATE_REPONSE: { type: Date },
      REPONSE_DANS_DELAI: { type: Boolean }
    }
  ],
  DATE_AFFECTATION: { type: Date, required: true },
  MODE_AFFECTATION: { 
    type: String, 
    enum: ["Manuel", "Semi-automatisé", "Automatisé (IA)"], 
    required: true 
  },
  STATUS: { 
    type: String, 
    enum: ["En cours", "Terminée", "À venir"], 
    required: true 
  },
  RAPPORT: {
    fileName: { type: String },
    filePath: { type: String },
    mimeType: { type: String, default: "application/pdf" }, 
    size: { type: Number },
    createdAt: { type: Date }
  }
},
{
  collection: "affectation"
});

export default mongoose.model("Affectation", affectationSchema);