import Vehicule from "../models/Vehicule.js";

/**
 * Get all vehicles with conditional pagination and filters
 * GET /api/vehicule
 * Query params:
 * - search: Search in IMMATRICULATION, MARQUE, MODELE
 * - disponible: Filter by availability (true/false)
 * - marque: Filter by brand
 * - page: Page number (for pagination)
 * - limit: Items per page (for pagination)
 * - all: Return all results without pagination (for selects)
 */
export const getAllVehicles = async (req, res) => {
  try {
    const { 
      search, 
      disponible,
      marque,
      page,
      limit,
      all
    } = req.query;

    // Build filter object
    const filter = {};

    // Search filter (searches across multiple fields)
    if (search) {
      filter.$or = [
        { IMMATRICULATION: { $regex: search, $options: 'i' } },
        { MARQUE: { $regex: search, $options: 'i' } },
        { MODELE: { $regex: search, $options: 'i' } }
      ];
    }

    // Availability filter
    if (disponible !== undefined) {
      filter.DISPONIBLE = disponible === 'true';
    }

    // Brand filter
    if (marque) {
      filter.MARQUE = marque;
    }

    // CASE 1: Non-paginated (for selects, exports, etc.)
    if (all === 'true') {
      const vehicules = await Vehicule.find(filter)
        .sort({ IMMATRICULATION: 1 });

      return res.status(200).json({
        success: true,
        count: vehicules.length,
        data: vehicules
      });
    }

    // CASE 2: Paginated (for tables)
    const currentPage = parseInt(page) || 1;
    const perPage = parseInt(limit) || 10;
    const skip = (currentPage - 1) * perPage;

    // Get total count for pagination
    const total = await Vehicule.countDocuments(filter);

    // Get paginated vehicles
    const vehicules = await Vehicule.find(filter)
      .sort({ IMMATRICULATION: 1 })
      .skip(skip)
      .limit(perPage);

    res.status(200).json({
      success: true,
      count: vehicules.length,
      data: vehicules,
      pagination: {
        currentPage,
        totalPages: Math.ceil(total / perPage),
        totalItems: total,
        perPage
      }
    });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Get vehicle by ID
 * GET /api/vehicule/:id
 */
export const getVehicleById = async (req, res) => {
  try {
    const vehicule = await Vehicule.findOne({ ID: req.params.id });
    
    if (!vehicule) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun véhicule trouvé" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: vehicule
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/**
 * Create new vehicle
 * POST /api/vehicule
 */
export const createVehicle = async (req, res) => {
  try {
    // Check if vehicle with this ID already exists
    const existingVehicule = await Vehicule.findOne({ ID: req.body.IMMATRICULATION });
    if (existingVehicule) {
      return res.status(400).json({ 
        success: false,
        message: "Un véhicule avec cet Immatriculation existe déjà" 
      });
    }

    const vehicule = new Vehicule(req.body);
    await vehicule.save();
    
    res.status(201).json({
      success: true,
      message: "Véhicule créé avec succès",
      data: vehicule
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Update vehicle
 * PUT /api/vehicule/:id
 */
export const updateVehicle = async (req, res) => {
  try {
    const updatedVehicule = await Vehicule.findOneAndUpdate(
      { ID: req.params.id }, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedVehicule) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun véhicule trouvé" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Véhicule mis à jour avec succès",
      data: updatedVehicule
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Delete vehicle
 * DELETE /api/vehicule/:id
 */
export const deleteVehicle = async (req, res) => {
  try {
    const deletedVehicule = await Vehicule.findOneAndDelete({ ID: req.params.id });
    
    if (!deletedVehicule) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun véhicule trouvé" 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: "Véhicule supprimé avec succès", 
      data: deletedVehicule 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/**
 * Get vehicle statistics
 * GET /api/vehicule/stats
 */
export const getVehicleStats = async (req, res) => {
  try {
    const total = await Vehicule.countDocuments();
    const disponibles = await Vehicule.countDocuments({ DISPONIBLE: true });
    const nonDisponibles = await Vehicule.countDocuments({ DISPONIBLE: false });

    // Group by brand
    const parMarque = await Vehicule.aggregate([
      {
        $group: {
          _id: '$MARQUE',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          marque: '$_id',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Average capacity
    const avgCapacity = await Vehicule.aggregate([
      {
        $group: {
          _id: null,
          moyenne: { $avg: '$CAPACITE' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        disponibles,
        nonDisponibles,
        parMarque,
        capaciteMoyenne: avgCapacity[0]?.moyenne || 0
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

/**
 * Get unique brands (for filter dropdown)
 * GET /api/vehicule/brands
 */
export const getUniqueBrands = async (req, res) => {
  try {
    const brands = await Vehicule.distinct('MARQUE');
    
    res.status(200).json({
      success: true,
      data: brands.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};