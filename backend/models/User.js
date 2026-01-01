import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  NOM: { type: String, required: true },
  PRENOM: { type: String, required: true },
  EMAIL: { type: String, required: true, unique: true },
  MOT_DE_PASSE: { type: String, required: true },
  ROLE: {
    type: String,
    enum: ["SUPERADMIN", "ADMIN", "USER"],
    required: true
  },
  GRADE: {
    type: String,
    enum: ["A", "B", "C"],
    required: true
  },
  SPECIALITE: {
    type: String,
    enum: [
      "Auditeur pédagogique",
      "Auditeur d’orientation",
      "Auditeur de planification",
      "Auditeur des services financiers"
    ],
    required: true
  },
  FORMATIONS: [String],
  DIPLOMES: [String],
  ACTIF: { type: Boolean, default: true }
}, {
  collection: "user"   
});

export default mongoose.model("User", userSchema);
