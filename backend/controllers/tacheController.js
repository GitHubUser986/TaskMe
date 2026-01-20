import Tache from "../models/Tache.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import fs from "fs";

// Helper pour formater la réponse
const successResponse = (data, message = "Succès") => ({ 
  success: true, 
  message, 
  data 
});

const errorResponse = (message) => ({ 
  success: false, 
  message 
});

// Helper function to send notification to all users
const sendNotificationToEveryone = async (tache) => {
  try {
    const users = await User.find({ ACTIF: true }).select('ID');
    const timestamp = Date.now();
    const notifications = users.map((user, index) => ({
      ID: `NOTIF_${timestamp}_${index}_${user.ID}_${tache.ID}`,
      ID_AUDITEUR: user.ID,
      MESSAGE: `Nouvelle tâche "${tache.NOM}" est créée`,
      TYPE: 'Information',
      LUE: false,
      CREATED_AT: new Date()
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Notification sent to ${users.length} users`);
    }
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
  }
};

/**
 * GET ALL TASKS with conditional pagination
 * - If 'all=true' param: returns all data (for selects)
 * - Otherwise: returns paginated data (for tables)
 */
export const getAllTasks = async (req, res) => {
  try {
    const { 
      search = '', 
      type = '', 
      status = '',
      page = 1, 
      limit = 6,
      all = 'false'
    } = req.query;

    // Build filter object
    let filter = {};

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { NOM: { $regex: search, $options: 'i' } },
        { DESCRIPTION: { $regex: search, $options: 'i' } },
        { TYPE: { $regex: search, $options: 'i' } },
        { DIRECTION: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by type
    if (type) {
      filter.TYPE = type;
    }

    // Filter by status (calculated based on dates)
    // We'll handle this after fetching

    // If 'all=true', return all data without pagination (for selects)
    if (all === 'true') {
      const tasks = await Tache.find(filter).sort({ 'PERIODE_EXECUTION.DATE_DEBUT': -1 });
      
      // Apply status filter if needed
      let filteredTasks = tasks;
      if (status) {
        filteredTasks = tasks.filter(task => {
          const taskStatus = getTaskStatus(task);
          return taskStatus === status;
        });
      }

      return res.json(successResponse({
        taches: filteredTasks,
        count: filteredTasks.length
      }));
    }

    // Paginated response (for tables)
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get all tasks first (to apply status filter)
    const allTasks = await Tache.find(filter).sort({ 'PERIODE_EXECUTION.DATE_DEBUT': -1 });
    
    // Apply status filter
    let filteredTasks = allTasks;
    if (status) {
      filteredTasks = allTasks.filter(task => {
        const taskStatus = getTaskStatus(task);
        return taskStatus === status;
      });
    }

    // Apply pagination
    const totalItems = filteredTasks.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const paginatedTasks = filteredTasks.slice(skip, skip + limitNum);

    res.json(successResponse({
      taches: paginatedTasks,
      count: paginatedTasks.length,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        perPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }));

  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json(errorResponse(error.message));
  }
};

// Helper to determine task status
const getTaskStatus = (task) => {
  const now = new Date();
  const startDate = new Date(task.PERIODE_EXECUTION.DATE_DEBUT);
  const endDate = new Date(task.PERIODE_EXECUTION.DATE_FIN);

  if (now > endDate) return 'Terminée';
  if (now >= startDate && now <= endDate) return 'En cours';
  return 'À venir';
};

/**
 * GET TASK BY ID
 */
export const getTaskById = async (req, res) => {
  try {
    const tache = await Tache.findOne({ ID: req.params.id });
    if (!tache) {
      return res.status(404).json(errorResponse('Aucune tâche trouvée'));
    }
    res.json(successResponse({ tache }));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * CREATE TASK
 */
export const createTask = async (req, res) => {
  try {
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
    await sendNotificationToEveryone(tache);
    
    res.status(201).json(
      successResponse({ tache }, "Tâche créée avec succès")
    );
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * UPDATE TASK
 */
export const updateTask = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
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
    
    if (req.file) {
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
    
    if (!updatedTache) {
      return res.status(404).json(errorResponse("Aucune tâche trouvée"));
    }
    
    res.json(successResponse({ tache: updatedTache }, "Tâche mise à jour"));
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json(errorResponse(error.message));
  }
};

/**
 * DELETE TASK
 */
export const deleteTask = async (req, res) => {
  try {
    const deletedTache = await Tache.findOneAndDelete({ ID: req.params.id });
    if (!deletedTache) {
      return res.status(404).json(errorResponse("Aucune tâche trouvée"));
    }
    
    if (deletedTache.FICHIER_ADMINISTRATIF?.filePath) {
      if (fs.existsSync(deletedTache.FICHIER_ADMINISTRATIF.filePath)) {
        fs.unlinkSync(deletedTache.FICHIER_ADMINISTRATIF.filePath);
      }
    }
    
    res.json(successResponse({}, "Tâche supprimée avec succès"));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * GET TASK STATISTICS
 */
export const getTaskStats = async (req, res) => {
  try {
    const allTasks = await Tache.find();
    
    const stats = {
      total: allTasks.length,
      enCours: allTasks.filter(t => getTaskStatus(t) === 'En cours').length,
      aVenir: allTasks.filter(t => getTaskStatus(t) === 'À venir').length,
      terminees: allTasks.filter(t => getTaskStatus(t) === 'Terminée').length,
      parType: {}
    };

    // Count by type
    allTasks.forEach(task => {
      stats.parType[task.TYPE] = (stats.parType[task.TYPE] || 0) + 1;
    });

    res.json(successResponse(stats));
  } catch (error) {
    res.status(500).json(errorResponse(error.message));
  }
};

/**
 * DOWNLOAD FILE
 */
export const downloadFile = async (req, res) => {
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
};