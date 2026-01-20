import express from "express";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats,
  getUniqueBrands
} from "../controllers/vehiculeController.js";
import { protect} from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Statistics 
router.get('/stats', getVehicleStats);

// Get unique brands for filters
router.get('/brands', getUniqueBrands);

// List and create vehicles
router.route('/')
  .get(getAllVehicles) 
  .post(createVehicle);  

// Operations on specific vehicle
router.route('/:id')
  .get(getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

export default router;