import mongoose from "mongoose";

const historiqueSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  ID_AUDITEUR: { type: [String], default: null }, // null = global
  ID_TACHE: { type: String, required: true },
  DETAILS: { type: String, required: true },
  ACTION: { type: String, required: true }
}, {
  collection: "historique",
  timestamps: true // Adds createdAt and updatedAt automatically
});

export default mongoose.model("Historique", historiqueSchema);
