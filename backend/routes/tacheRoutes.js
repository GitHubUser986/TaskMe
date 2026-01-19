import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Tache from "../models/Tache.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js"; // Import User model

const router = express.Router();

// Helper pour formater la réponse
const successResponse = (data, message = "Succès") => ({ success: true, message, data });
const errorResponse = (message) => ({ success: false, message });

// Ensure uploads/files directory exists
const uploadsDir = 'uploads/files';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Helper function to send notification to all users
const sendNotificationToEveryone = async (tache) => {
  try {
    // Get all active users
    const users = await User.find({ ACTIF: true }).select('ID');
    
    // Prepare all notifications
    const timestamp = Date.now();
    const notifications = users.map((user, index) => ({
      ID: `NOTIF_${timestamp}_${index}_${user.ID}_${tache.ID}`,
      ID_AUDITEUR: user.ID,
      MESSAGE: `Nouvelle tâche "${tache.NOM}" est créée`,
      TYPE: 'Information',
      LUE: false,
      CREATED_AT: new Date()
    }));
    
    // Bulk insert all notifications at once
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Notification sent to ${users.length} users`);
    } else {
      console.log('⚠️ No active users found to send notifications');
    }
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    // Don't throw error - notification failure shouldn't stop task creation
  }
};

// GET ALL
router.get('/', async (req, res) => {
    try {
        const taches = await Tache.find();
        res.json(successResponse({ taches }));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
});

// GET BY ID
router.get('/:id', async (req, res) => {
    try {
        const tache = await Tache.findOne({ ID: req.params.id });
        if (!tache) return res.status(404).json(errorResponse('Aucune tâche trouvée'));
        res.json(successResponse({ tache }));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
});

// POST - with file upload and broadcast notification
router.post('/', upload.single('FICHIER_ADMINISTRATIF'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    // Parse JSON fields that were stringified
    const taskData = {
      ID: req.body.ID,
      NOM: req.body.NOM,
      TYPE: req.body.TYPE,
      DESCRIPTION: req.body.DESCRIPTION,
      DIRECTION: req.body.DIRECTION,
      COMMUNE_OU_PARTICULIERE: req.body.COMMUNE_OU_PARTICULIERE,
      SPECIALITES_CONCERNEES: JSON.parse(req.body.SPECIALITES_CONCERNEES || '[]'),
      GRADES_CONCERNES: JSON.parse(req.body.GRADES_CONCERNES || '[]'),
      REMUNEREE: req.body.REMUNEREE === 'true',
      NECESSITE_VEHICULE: req.body.NECESSITE_VEHICULE === 'true',
      NOMBRE_PLACES: parseInt(req.body.NOMBRE_PLACES),
      MONTANT: parseFloat(req.body.MONTANT || 0),
      PERIODE_EXECUTION: {
        DATE_DEBUT: new Date(req.body.DATE_DEBUT),
        DATE_FIN: new Date(req.body.DATE_FIN)
      }
    };

    // Add file information if file was uploaded
    if (req.file) {
      taskData.FICHIER_ADMINISTRATIF = {
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        createdAt: new Date()
      };
    }

    const tache = new Tache(taskData);
    await tache.save();
    
    // Send notification to all active users
    await sendNotificationToEveryone(tache);
    
    res.status(201).json(
      successResponse({ tache }, "Tâche créée avec succès et notification envoyée à tous les utilisateurs")
    );
  } catch (error) {
    console.error('Error creating task:', error);
    // Delete uploaded file if task creation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json(
      errorResponse(error.message)
    );
  }
});

// PUT - with optional file upload
router.put('/:id', upload.single('FICHIER_ADMINISTRATIF'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Parse JSON fields if they exist and are strings
        if (req.body.SPECIALITES_CONCERNEES && typeof req.body.SPECIALITES_CONCERNEES === 'string') {
          updateData.SPECIALITES_CONCERNEES = JSON.parse(req.body.SPECIALITES_CONCERNEES);
        }
        if (req.body.GRADES_CONCERNES && typeof req.body.GRADES_CONCERNES === 'string') {
          updateData.GRADES_CONCERNES = JSON.parse(req.body.GRADES_CONCERNES);
        }
        if (req.body.REMUNEREE && typeof req.body.REMUNEREE === 'string') {
          updateData.REMUNEREE = req.body.REMUNEREE === 'true';
        }
        if (req.body.NECESSITE_VEHICULE && typeof req.body.NECESSITE_VEHICULE === 'string') {
          updateData.NECESSITE_VEHICULE = req.body.NECESSITE_VEHICULE === 'true';
        }
        if (req.body.DATE_DEBUT && req.body.DATE_FIN) {
          updateData.PERIODE_EXECUTION = {
            DATE_DEBUT: new Date(req.body.DATE_DEBUT),
            DATE_FIN: new Date(req.body.DATE_FIN)
          };
        }
        
        // Handle file upload for update
        if (req.file) {
          // Delete old file if exists
          const existingTache = await Tache.findOne({ ID: req.params.id });
          if (existingTache?.FICHIER_ADMINISTRATIF?.filePath) {
            if (fs.existsSync(existingTache.FICHIER_ADMINISTRATIF.filePath)) {
              fs.unlinkSync(existingTache.FICHIER_ADMINISTRATIF.filePath);
            }
          }
          
          updateData.FICHIER_ADMINISTRATIF = {
            fileName: req.file.originalname,
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            size: req.file.size,
            createdAt: new Date()
          };
        }
        
        const updatedTache = await Tache.findOneAndUpdate(
          { ID: req.params.id }, 
          updateData, 
          { new: true }
        );
        
        if (!updatedTache) return res.status(404).json(errorResponse("Aucune tâche trouvée"));
        res.json(successResponse({ tache: updatedTache }, "Tâche mise à jour avec succès"));
        
    } catch (error) {
        console.error('Error updating task:', error);
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(400).json(errorResponse(error.message));
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const deletedTache = await Tache.findOneAndDelete({ ID: req.params.id });
        if (!deletedTache) return res.status(404).json(errorResponse("Aucune tâche trouvée"));
        
        // Delete associated file if exists
        if (deletedTache.FICHIER_ADMINISTRATIF?.filePath) {
          if (fs.existsSync(deletedTache.FICHIER_ADMINISTRATIF.filePath)) {
            fs.unlinkSync(deletedTache.FICHIER_ADMINISTRATIF.filePath);
          }
        }
        
        res.json(successResponse({}, "Tâche supprimée avec succès"));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
});

// Optional: Route to download/view file
router.get('/file/:id', async (req, res) => {
    try {
        const tache = await Tache.findOne({ ID: req.params.id });
        if (!tache || !tache.FICHIER_ADMINISTRATIF?.filePath) {
            return res.status(404).json(errorResponse('Fichier non trouvé'));
        }
        
        const filePath = tache.FICHIER_ADMINISTRATIF.filePath;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json(errorResponse('Fichier non trouvé sur le serveur'));
        }
        
        res.download(filePath, tache.FICHIER_ADMINISTRATIF.fileName);
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
});

export default router;