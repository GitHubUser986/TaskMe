import express from "express";
import multer from "multer";
import fs from "fs";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
  downloadFile
} from "../controllers/tacheController.js";

const router = express.Router();

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

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

// Routes
router.get('/stats', getTaskStats);
router.get('/file/:id', downloadFile);
router.get('/:id', getTaskById);
router.get('/', getAllTasks);
router.post('/', upload.single('FICHIER_ADMINISTRATIF'), createTask);
router.put('/:id', upload.single('FICHIER_ADMINISTRATIF'), updateTask);
router.delete('/:id', deleteTask);

export default router;