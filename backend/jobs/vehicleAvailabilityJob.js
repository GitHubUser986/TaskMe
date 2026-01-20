import cron from 'node-cron';
import mongoose from 'mongoose';
import Vehicule from '../models/Vehicule.js';
import Affectation from '../models/Affectation.js';

/**
 * Updates vehicle availability based on TODAY's affectations
 * A vehicle is UNAVAILABLE if it's assigned to a mission happening TODAY
 * A vehicle is AVAILABLE if it has no mission scheduled for TODAY
 */
async function updateVehicleAvailability() {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected. Skipping vehicle availability update.');
      return;
    }

    console.log('Starting vehicle availability update job...');
    
    // Get start and end of today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // First, get all tasks that are happening today
    const Tache = mongoose.model('Tache');
    const todayTasks = await Tache.find({
      $or: [
        // Tasks that start today
        { DATE_DEBUT: { $gte: startOfDay, $lte: endOfDay } },
        // Tasks that end today
        { DATE_FIN: { $gte: startOfDay, $lte: endOfDay } },
        // Tasks that span across today (started before and end after)
        {
          DATE_DEBUT: { $lte: startOfDay },
          DATE_FIN: { $gte: endOfDay }
        }
      ]
    }).select('ID');

    const todayTaskIds = todayTasks.map(task => task.ID);

    // Get all affectations for today's tasks
    const todayAffectations = await Affectation.find({
      ID_TACHE: { $in: todayTaskIds }
    });

    // Extract all vehicle IDs that are assigned to missions TODAY
    const assignedVehicleIds = new Set();
    todayAffectations.forEach(affectation => {
      if (affectation.ID_VEHICULE && Array.isArray(affectation.ID_VEHICULE)) {
        affectation.ID_VEHICULE.forEach(vehicleId => {
          if (vehicleId) assignedVehicleIds.add(vehicleId);
        });
      }
    });

    // Update all vehicles
    const allVehicles = await Vehicule.find();
    let updatedCount = 0;

    for (const vehicle of allVehicles) {
      // Vehicle is AVAILABLE if NOT assigned to any mission today
      const shouldBeAvailable = !assignedVehicleIds.has(vehicle.ID);
      
      // Only update if status has changed
      if (vehicle.DISPONIBLE !== shouldBeAvailable) {
        await Vehicule.updateOne(
          { ID: vehicle.ID },
          { DISPONIBLE: shouldBeAvailable }
        );
        updatedCount++;
        console.log(`Updated vehicle ${vehicle.ID}: DISPONIBLE = ${shouldBeAvailable} (${shouldBeAvailable ? 'No mission today' : 'Mission today'})`);
      }
    }

    console.log(`Vehicle availability update completed. ${updatedCount} vehicles updated. ${assignedVehicleIds.size} vehicles on mission today.`);
  } catch (error) {
    console.error('Error updating vehicle availability:', error);
  }
}

/**
 * Initialize the cron job
 * Runs every 5 minutes by default
 * You can adjust the schedule as needed:
 * - '* /5 * * * *' = every 5 minutes
 * - '* /15 * * * *' = every 15 minutes
 * - '0 * * * *' = every hour
 * - '0 0 * * *' = daily at midnight
 */
export function startVehicleAvailabilityJob() {
  // Wait for MongoDB connection before running
  if (mongoose.connection.readyState === 1) {
    // Already connected, run immediately
    updateVehicleAvailability();
  } else {
    // Wait for connection
    mongoose.connection.once('open', () => {
      console.log('MongoDB connected - running initial vehicle availability update');
      updateVehicleAvailability();
    });
  }
  
  // Schedule to run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    updateVehicleAvailability();
  });
  
  console.log('Vehicle availability cron job scheduled (runs every 5 minutes)');
}

// Export the update function in case you need to trigger it manually
export { updateVehicleAvailability };