import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();
// GET ALL CHATS BY ID_EXPEDITEUR
router.get('/:idExpediteur', async (req, res) => {
    try {
        const chats = await Chat.find({ID_EXPEDITEUR : req.params.idExpediteur});
        res.json(chats);
    } catch (error) {
        res.status(500).json({message : error.message});
    }
});

// POST
router.post('/', async (req, res) => {
    const chat = new Chat (req.body);
    try {
        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        res.status(400).json({message : error.message});
    }
});

// GET CHATS BY ID_TACHE
router.get('/:idTache', async (req, res) => {
    try {
        const chats = await Chat.find({ID_TACHE : req.params.idTache});
        res.json(chats);
    } catch (error) {
        res.status(500).json({message : error.message});
    }       
});

export default router;