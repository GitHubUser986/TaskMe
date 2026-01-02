import express from "express";
import Tache from "../models/Tache.js";

const router = express.Router();

// Helper pour formater la réponse
const successResponse = (data, message = "Succès") => ({ success: true, message, data });
const errorResponse = (message) => ({ success: false, message });

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

// POST
router.post('/', async (req, res) => {
  const tache = new Tache(req.body);
  try {
    await tache.save();
    res.status(201).json(
      successResponse({ tache }, "Tâche créée avec succès")
    );
  } catch (error) {
    res.status(400).json(
      errorResponse(error.message)
    );
  }
});


// PUT
router.put('/:id', async (req, res) => {
    try {
        const updatedTache = await Tache.findOneAndUpdate({ ID: req.params.id }, req.body, { new: true });
        if (!updatedTache) return res.status(404).json(errorResponse("Aucune tâche trouvée"));
        res.json(successResponse({ tache: updatedTache }, "Tâche mise à jour avec succès"));
    } catch (error) {
        res.status(400).json(errorResponse(error.message));
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const deletedTache = await Tache.findOneAndDelete({ ID: req.params.id });
        if (!deletedTache) return res.status(404).json(errorResponse("Aucune tâche trouvée"));
        res.json(successResponse({}, "Tâche supprimée avec succès"));
    } catch (error) {
        res.status(500).json(errorResponse(error.message));
    }
});

export default router;
