import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  ID: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
  },
  NOM: { type: String, required: true },
  PRENOM: { type: String, required: true },
  EMAIL: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  MOT_DE_PASSE: { 
    type: String, 
    required: true,
    select: false // Ne pas retourner le mot de passe par défaut
  },
  ROLE: {
    type: String,
    enum: ["SUPERADMIN", "ADMIN", "USER"],
    required: true,
    default: "USER"
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
      "Auditeur d'orientation",
      "Auditeur de planification",
      "Auditeur des services financiers"
    ],
    required: true
  },
  FORMATIONS: { 
    type: [String], 
    default: [] 
  },
  DIPLOMES: { 
    type: [String], 
    default: [] 
  },
  ACTIF: { 
    type: Boolean, 
    default: true 
  },
  DERNIERE_CONNEXION: {
    type: Date
  }
}, {
  collection: "user",
  timestamps: true // Ajoute createdAt et updatedAt
});

// Hash du mot de passe avant sauvegarde
userSchema.pre("save", async function () {
  if (!this.isModified("MOT_DE_PASSE")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.MOT_DE_PASSE = await bcrypt.hash(this.MOT_DE_PASSE, salt);
    // Pas de next() ici, async function le gère automatiquement
  } catch (error) {
    throw error; // Mongoose catchera l'erreur
  }
});


// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.MOT_DE_PASSE);
  } catch (error) {
    throw new Error('Erreur lors de la comparaison des mots de passe');
  }
};

// Méthode pour obtenir les infos publiques de l'utilisateur
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.MOT_DE_PASSE;
  delete user.__v;
  return user;
};

export default mongoose.model("User", userSchema);