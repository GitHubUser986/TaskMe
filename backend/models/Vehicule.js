import mongoose from "mongoose";

const vehiculeSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  IMMATRICULATION: { type: String, required: true },
  MARQUE: { type: String, required: true },
  MODELE: { type: String, required: true },
  DISPONIBLE: { type: Boolean, required: true },
  CAPACITE: { type: Number, required: true }
}, {
  collection: "vehicule"
});

export default mongoose.model("Vehicule", vehiculeSchema);
