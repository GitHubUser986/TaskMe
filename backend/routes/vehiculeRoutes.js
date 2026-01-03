import express from "express";
import Vehicule from "../models/Vehicule.js";

const router = express.Router();

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicules = await Vehicule.find();
    res.json(vehicules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET vehicle by ID
router.get("/:id", async (req, res) => {
    try {
        const vehicule = await Vehicule.findOne({ ID: req.params.id });
        if(!vehicule) return res.status(404).json({ message: "Aucun véhicule trouvé" });
        res.json(vehicule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create new vehicle
router.post("/", async (req, res) => {
    try {
        // Vérifier si un véhicule avec cet ID existe déjà
        const existingVehicule = await Vehicule.findOne({ ID: req.body.ID });
        if (existingVehicule) {
            return res.status(400).json({ message: "Un véhicule avec cet ID existe déjà" });
        }

        const vehicule = new Vehicule(req.body);
        await vehicule.save();
        res.status(201).json(vehicule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update vehicle
router.put("/:id", async (req, res) => {
    try {
        const updatedVehicule = await Vehicule.findOneAndUpdate(
            { ID: req.params.id }, 
            req.body, 
            { new: true, runValidators: true }
        );
        if(!updatedVehicule) return res.status(404).json({ message: "Aucun véhicule trouvé" });
        res.json(updatedVehicule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE vehicle
router.delete("/:id", async (req, res) => {
    try {
        const deletedVehicule = await Vehicule.findOneAndDelete({ ID: req.params.id });
        if(!deletedVehicule) return res.status(404).json({ message: "Aucun véhicule trouvé" });
        res.json({ message: "Véhicule supprimé avec succès", vehicule: deletedVehicule });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;