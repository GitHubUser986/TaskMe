import mongoose from "mongoose";

const tacheSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  NOM: { type: String, required: true },
  DESCRIPTION: { type: String, required: true },
  TYPE: { 
    type: String, 
    enum: ["Formateur", "Membre de jury", "Bénéficiaire de formation", "Observateur", "Concepteur d'évaluation"], 
    required: true 
  },
  PERIODE_EXECUTION: {
    DATE_DEBUT: { type: Date, required: true },
    DATE_FIN: { type: Date, required: true }
  },
  REMUNEREE: { type: Boolean, required: true },
  MONTANT: { type: Number, default: 0 },
  SPECIALITES_CONCERNEES: [String],
  COMMUNE_OU_PARTICULIERE: { 
    type: String, 
    enum: ["Commune", "Particulière"], 
    required: true 
  },
  GRADES_CONCERNES: [String],
  NECESSITE_VEHICULE: { type: Boolean, default: false },
  DIRECTION: { 
    type: String, 
    enum: ["ligne Rabat-Casa", "ligne Meknès-Errachidia", "ligne Marrakech-Agadir"], 
    required: true 
  },
  FICHIER_ADMINISTRATIF: {
    fileName: { type: String },
    filePath: { type: String }, // uploads/files
    mimeType: { type: String, default: "application/pdf" }, 
    size: { type: Number },
    createdAt: { type: Date }
  },
  NOMBRE_PLACES: { type: Number, required: true }
}, {
  collection: "tache",
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for better performance on queries
tacheSchema.index({ ID: 1 });
tacheSchema.index({ DIRECTION: 1 });
tacheSchema.index({ 'PERIODE_EXECUTION.DATE_DEBUT': 1, 'PERIODE_EXECUTION.DATE_FIN': 1 });

export default mongoose.model("Tache", tacheSchema);