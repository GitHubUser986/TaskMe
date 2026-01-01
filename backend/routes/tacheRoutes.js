import express from "express";
import Tache from "../models/Tache.js";

const router = express.Router();

//GET ALL
router.get('/', async (req, res) => {
    try {
        const taches = await Tache.find();
        res.json(taches);
    } catch (error) {
        res.status(500).json({message : error.message});
    }
});

// GET BY ID
router.get('/:id', async (req, res) => {
    try {
        const tache = await Tache.findOne({ID : req.params.id});
        if(!tache) return res.status(404).json({message : 'Aucune tâche trouvée'});
        res.json(tache);
    } catch (error) {
        res.status(500).json({message : error.message});
        
    }
    
});

// POST 
router.post('/', async (req, res) => {
    const tache = new Tache (req.body);
    try {
        await tache.save();
        res.status(201).json(tache);
    } catch (error) {
        res.status(400).json({message : error.message});
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const updatedTache = await Tache.findOneAndUpdate( {ID: req.params.id}, req.body, {new: true});
        if(!updatedTache) return res.status(404).json({message : "Aucune tâche trouvée"});
        res.json (updatedTache);
    } catch (error) {
        res.status(400).json({message : error.message});
    }   
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const deletedTache = await Tache.findOneAndDelete({ID: req.params.id});
        if(!deletedTache) return res.status(404).json({message : "Aucune tâche trouvée"});
        res.json({message : "Tâche supprimée"});
    } catch (error) {
        res.status(500).json({message : error.message});
    }
});

export default router;