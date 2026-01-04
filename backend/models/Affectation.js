import mongoose from "mongoose";

const affectationSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  ID_TACHE: { type: String, required: true },
  ID_VEHICULE: { type: [String], default: null },
  ID_AUDITEUR: { type: [String], required: true },
  DATE_AFFECTATION: { type: Date, required: true },
  MODE_AFFECTATION: { type: String, enum: ["Manuel", "Semi-automatisé", "Automatisé (IA)"], required: true },
  STATUS: { type: String, enum: ["En cours", "Terminée", "À venir"], required: true },
  DECISION: { type: String, enum: ["Acceptée", "Refusée", "Déléguée", "En Attente"], required: true },
  ID_AUDITEUR_DELEGUE: [String] // optionnel si délégation
},
{
  collection: "affectation"
});

export default mongoose.model("Affectation", affectationSchema);
