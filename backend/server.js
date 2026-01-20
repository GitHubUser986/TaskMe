import dotenv from "dotenv";

// CRITICAL: Load environment variables FIRST before any other imports
dotenv.config();

// Now import everything else
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import vehiculeRoutes from "./routes/vehiculeRoutes.js";
import tacheRoutes from "./routes/tacheRoutes.js";
import affectationRoutes from "./routes/affectationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import historiqueRoutes from "./routes/historiqueRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { startVehicleAvailabilityJob } from "./jobs/vehicleAvailabilityJob.js";
import { startAffectationDeadlineJob } from "./jobs/affectationDeadlineJob.js";


const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 Middleware de base
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (ex: Postman) ou si l'origine est dans la liste
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origine non autorisée par CORS: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// 🔹 Routes
app.use("/api/auth", authRoutes);        // Routes d'authentification
app.use("/api/user", userRoutes);
app.use("/api/vehicule", vehiculeRoutes);
app.use("/api/tache", tacheRoutes);
app.use("/api/affectation", affectationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/historique", historiqueRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/uploads', express.static('uploads'));

// Route de base (test)
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "Backend TaskMe is running!",
    version: "1.0.0"
  });
});

// Route de santé (health check)
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.originalUrl} non trouvée` 
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || "Erreur interne du serveur",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion à MongoDB et lancement du serveur
const startServer = async () => {
  try {
    // First connect to MongoDB
    await connectDB();
    
    // THEN start the cron job (after MongoDB is connected)
    startVehicleAvailabilityJob();
    startAffectationDeadlineJob();
    
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();