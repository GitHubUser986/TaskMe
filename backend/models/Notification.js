import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  ID: { type: String, required: true, unique: true },
  ID_AUDITEUR: { type: String, required: true },
  LUE: { type: Boolean, default: false },
  MESSAGE: { type: String, required: true },
  TYPE: { type: String, enum: ["Information", "Echoue", "Rappel", "Succès"], required: true }
});

export default mongoose.model("Notification", notificationSchema);
