import express from "express";
import Vehicule from "../models/Vehicule.js";

const router = express.Router();

// GET all
router.get("/", async (req, res) => {
  try {
    const vehicules = await Vehicule.find();
    res.json(vehicules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET by ID
router.get("/:id", async (req, res) => {
    try {
        const vehicule = await Vehicule.findOne({ ID: req.params.id});
        if(!user) return res.status(404).json({message: "Aucune véhicule trouvé"});
        res.json(vehicule);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
});

// POST create new vehicule
router.post("/", async (req, res) => {
    const vehicule = new Vehicule(req.body);
    try {
        await vehicule.save();
        res.status(201).json(vehicule);
    } catch (error) {
        res.status(400).json({message: error.message})
    }
});

// PUT updat vehicule
router.put("/:id", async (req, res) => {
    try {
        const updatedVehicule = await Vehicule.findByIdAndUpdate( {ID: req.params.id}, req.body, {new: true});
        if(!updatedVehicule) return res.status(404).json({message:"Aucune véhicule trouvée" });
        res.json(updatedVehicule);
    } catch (error) {
        res.status(400).json({message : error.message});
    }
});

// DELETE vehicule
router.delete("/:id", async (req, res) => {
    try {
        const deletedVehicule = await Vehicule.findByIdAndDelete({ID: req.params.id});
        if(!deletedVehicule) return res.status(404).json({message : "Aucune véhicue trouvée"});
        res.json({message: "Véhicule supprimée"});
    } catch (error) {
        res.status(500).json({message : error.message});
    }
})

export default router;
 