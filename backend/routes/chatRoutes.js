import express from "express";
import Chat from "../models/Chat.js";
import User from "../models/User.js";

const router = express.Router();

// GET tous les messages d'une tâche spécifique
router.get("/tache/:idTache", async (req, res) => {
    try {
        const messages = await Chat.find({ ID_TACHE: req.params.idTache })
            .sort({ DATE_ENVOI: 1 }); // Trier par date croissante
        
        // Enrichir avec les infos des utilisateurs
        const enrichedMessages = await Promise.all(
            messages.map(async (msg) => {
                const expediteur = await User.findOne({ ID: msg.ID_EXPEDITEUR })
                    .select('NOM PRENOM EMAIL ROLE');
                const destinataire = await User.findOne({ ID: msg.ID_DESTINATAIRE })
                    .select('NOM PRENOM EMAIL');
                
                return {
                    ...msg.toObject(),
                    expediteur: expediteur ? {
                        id: expediteur.ID,
                        nom: expediteur.NOM,
                        prenom: expediteur.PRENOM,
                        fullName: `${expediteur.PRENOM} ${expediteur.NOM}`,
                        email: expediteur.EMAIL,
                        role: expediteur.ROLE
                    } : null,
                    destinataire: destinataire ? {
                        id: destinataire.ID,
                        nom: destinataire.NOM,
                        prenom: destinataire.PRENOM,
                        fullName: `${destinataire.PRENOM} ${destinataire.NOM}`,
                        email: destinataire.EMAIL
                    } : null
                };
            })
        );
        
        res.json(enrichedMessages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET toutes les tâches où l'utilisateur participe au chat
router.get("/user/:userId/taches", async (req, res) => {
    try {
        // Trouver toutes les tâches où l'utilisateur a envoyé ou reçu des messages
        const messages = await Chat.find({
            $or: [
                { ID_EXPEDITEUR: req.params.userId },
                { ID_DESTINATAIRE: req.params.userId }
            ]
        }).select('ID_TACHE').distinct('ID_TACHE');
        
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET tous les participants d'une tâche (contacts pour le chat)
router.get("/tache/:idTache/participants", async (req, res) => {
    try {
        // Trouver tous les utilisateurs qui ont participé au chat de cette tâche
        const messages = await Chat.find({ ID_TACHE: req.params.idTache });
        
        const userIds = new Set();
        messages.forEach(msg => {
            userIds.add(msg.ID_EXPEDITEUR);
            userIds.add(msg.ID_DESTINATAIRE);
        });
        
        // Récupérer les infos des utilisateurs
        const users = await User.find({ 
            ID: { $in: Array.from(userIds) },
            ACTIF: true 
        }).select('ID NOM PRENOM EMAIL ROLE DERNIERE_CONNEXION');
        
        // Enrichir avec le dernier message de chaque utilisateur
        const enrichedUsers = await Promise.all(
            users.map(async (user) => {
                const lastMessage = await Chat.findOne({
                    ID_TACHE: req.params.idTache,
                    ID_EXPEDITEUR: user.ID
                }).sort({ DATE_ENVOI: -1 });
                
                // Compter les messages non lus (si besoin)
                const unreadCount = await Chat.countDocuments({
                    ID_TACHE: req.params.idTache,
                    ID_DESTINATAIRE: req.query.currentUserId, // L'utilisateur actuel
                    ID_EXPEDITEUR: user.ID,
                    // On pourrait ajouter un champ LU: false si nécessaire
                });
                
                return {
                    id: user.ID,
                    name: `${user.PRENOM} ${user.NOM}`,
                    email: user.EMAIL,
                    role: user.ROLE,
                    lastMessage: lastMessage ? lastMessage.MESSAGE : null,
                    lastMessageTime: lastMessage ? lastMessage.DATE_ENVOI : null,
                    unread: unreadCount > 0 ? unreadCount : undefined,
                    derniereConnexion: user.DERNIERE_CONNEXION
                };
            })
        );
        
        res.json(enrichedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST - Envoyer un nouveau message
router.post("/", async (req, res) => {
    try {
        // Générer un ID unique
        const chatId = `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const chat = new Chat({
            ID: chatId,
            ID_EXPEDITEUR: req.body.ID_EXPEDITEUR,
            ID_DESTINATAIRE: req.body.ID_DESTINATAIRE,
            ID_TACHE: req.body.ID_TACHE,
            DATE_ENVOI: new Date(),
            MESSAGE: req.body.MESSAGE
        });
        
        await chat.save();
        
        // Retourner le message enrichi avec les infos de l'expéditeur
        const expediteur = await User.findOne({ ID: chat.ID_EXPEDITEUR })
            .select('NOM PRENOM EMAIL ROLE');
        
        const enrichedMessage = {
            ...chat.toObject(),
            expediteur: expediteur ? {
                id: expediteur.ID,
                nom: expediteur.NOM,
                prenom: expediteur.PRENOM,
                fullName: `${expediteur.PRENOM} ${expediteur.NOM}`,
                email: expediteur.EMAIL,
                role: expediteur.ROLE
            } : null
        };
        
        res.status(201).json(enrichedMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// GET - Statistiques du chat d'une tâche
router.get("/tache/:idTache/stats", async (req, res) => {
    try {
        const totalMessages = await Chat.countDocuments({ ID_TACHE: req.params.idTache });
        
        const participants = await Chat.aggregate([
            { $match: { ID_TACHE: req.params.idTache } },
            { 
                $group: { 
                    _id: null, 
                    expediteurs: { $addToSet: "$ID_EXPEDITEUR" },
                    destinataires: { $addToSet: "$ID_DESTINATAIRE" }
                } 
            }
        ]);
        
        const uniqueParticipants = participants.length > 0 
            ? new Set([...participants[0].expediteurs, ...participants[0].destinataires]).size
            : 0;
        
        res.json({
            totalMessages,
            uniqueParticipants,
            idTache: req.params.idTache
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id/read', markMessageAsRead);
router.patch('/mark-all-read', markAllMessagesAsRead);

async function markMessageAsRead (req, res) {
  try {
    const { id } = req.params;
    
    const message = await Chat.findOneAndUpdate(
      { ID: id },
      { LU: true },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message non trouvé"
      });
    }
    
    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error("Erreur markMessageAsRead:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du marquage du message",
      error: error.message
    });
  }
};


async function markAllMessagesAsRead (req, res) {
  try {
    const { idTache, idExpediteur, idDestinataire } = req.body;
    
    const result = await Chat.updateMany(
      {
        ID_TACHE: idTache,
        ID_EXPEDITEUR: idExpediteur,
        ID_DESTINATAIRE: idDestinataire,
        LU: false
      },
      { LU: true }
    );
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} messages marqués comme lus`,
      data: result
    });
  } catch (error) {
    console.error("Erreur markAllMessagesAsRead:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du marquage des messages",
      error: error.message
    });
  }
};


export default router;