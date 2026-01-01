import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  ID_EXPEDITEUR: { type: String, required: true },
  ID_DESTINATAIRE: { type: String, required: true },
  ID_TACHE: { type: String, required: true },
  DATE_ENVOI: { type: Date, required: true },
  MESSAGE: { type: String, required: true }
}, {
  collection: "chat"
});

export default mongoose.model("Chat", chatSchema);
