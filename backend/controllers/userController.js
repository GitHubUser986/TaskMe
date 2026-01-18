import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Obtenir tous les utilisateurs avec filtres
export const getAllUsers = async (req, res) => {
  try {
    const { 
      search, 
      specialite, 
      grade, 
      role, 
      actif
    } = req.query;

    // Construction du filtre
    const filter = {};

    if (search) {
      filter.$or = [
        { NOM: { $regex: search, $options: 'i' } },
        { PRENOM: { $regex: search, $options: 'i' } },
        { EMAIL: { $regex: search, $options: 'i' } }
      ];
    }

    if (specialite) filter.SPECIALITE = specialite;
    if (grade) filter.GRADE = grade;
    if (role) filter.ROLE = role;
    if (actif !== undefined) filter.ACTIF = actif === 'true';
    
    const users = await User.find(filter)
      .select('-MOT_DE_PASSE')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: { users }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

// Obtenir un utilisateur par ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ ID: req.params.id }).select('-MOT_DE_PASSE');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

// Créer un nouvel utilisateur
export const createUser = async (req, res) => {
  try {
    const { 
      NOM, 
      PRENOM, 
      EMAIL, 
      MOT_DE_PASSE, 
      ROLE, 
      GRADE, 
      SPECIALITE,
      FORMATIONS,
      DIPLOMES 
    } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ EMAIL: EMAIL.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      NOM,
      PRENOM,
      EMAIL: EMAIL.toLowerCase(),
      MOT_DE_PASSE,
      ROLE: ROLE || 'USER',
      GRADE,
      SPECIALITE,
      FORMATIONS: FORMATIONS || [],
      DIPLOMES: DIPLOMES || []
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: {
          _id: user._id,
          ID: user.ID,
          NOM: user.NOM,
          PRENOM: user.PRENOM,
          EMAIL: user.EMAIL,
          ROLE: user.ROLE,
          GRADE: user.GRADE,
          SPECIALITE: user.SPECIALITE,
          ACTIF: user.ACTIF
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

// Mettre à jour un utilisateur
export const updateUser = async (req, res) => {
  try {
    const { 
      NOM, 
      PRENOM, 
      EMAIL, 
      ROLE, 
      GRADE, 
      SPECIALITE,
      FORMATIONS,
      DIPLOMES,
      ACTIF 
    } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (EMAIL && EMAIL !== user.EMAIL) {
      const emailExists = await User.findOne({ 
        EMAIL: EMAIL.toLowerCase(), 
        _id: { $ne: req.params.id } 
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Mise à jour
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(NOM && { NOM }),
        ...(PRENOM && { PRENOM }),
        ...(EMAIL && { EMAIL: EMAIL.toLowerCase() }),
        ...(ROLE && { ROLE }),
        ...(GRADE && { GRADE }),
        ...(SPECIALITE && { SPECIALITE }),
        ...(FORMATIONS && { FORMATIONS }),
        ...(DIPLOMES && { DIPLOMES }),
        ...(ACTIF !== undefined && { ACTIF })
      },
      { new: true, runValidators: true }
    ).select('-MOT_DE_PASSE');

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

// Basculer le statut actif/inactif
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findOne({ ID: req.params.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    user.ACTIF = !user.ACTIF;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Utilisateur ${user.ACTIF ? 'activé' : 'désactivé'} avec succès`,
      data: {
        user: {
          _id: user._id,
          NOM: user.NOM,
          PRENOM: user.PRENOM,
          ACTIF: user.ACTIF
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut',
      error: error.message
    });
  }
};

// Supprimer un utilisateur
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

// Statistiques des utilisateurs
export const getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const actifs = await User.countDocuments({ ACTIF: true });
    const inactifs = await User.countDocuments({ ACTIF: false });

    const parRole = await User.aggregate([
      {
        $group: {
          _id: '$ROLE',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          label: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'SUPERADMIN'] }, then: 'Administrateur' },
                { case: { $eq: ['$_id', 'ADMIN'] }, then: 'Coordinateur' },
                { case: { $eq: ['$_id', 'USER'] }, then: 'Auditeur' }
              ],
              default: 'Inconnu'
            }
          },
          count: 1
        }
      }
    ]);

    const parGrade = await User.aggregate([
      {
        $group: {
          _id: '$GRADE',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          grade: '$_id',
          count: 1
        }
      }
    ]);

    const parSpecialite = await User.aggregate([
      {
        $group: {
          _id: '$SPECIALITE',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          specialite: '$_id',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        actifs,
        inactifs,
        parRole,
        parGrade,
        parSpecialite
      }
    });
  } catch (error) {
    console.error('Erreur stats utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

export const getUsersStatuses = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "Le paramètre 'ids' est requis"
      });
    }

    // Convertir la chaîne en tableau
    const userIds = ids.split(',').map(id => id.trim()).filter(id => id);

    if (userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucun ID d'utilisateur valide fourni"
      });
    }

    // Limiter à 50 utilisateurs max par requête pour éviter les abus
    if (userIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Maximum 50 utilisateurs par requête"
      });
    }

    // Récupérer uniquement les champs nécessaires
    const users = await User.find(
      { ID: { $in: userIds }, ACTIF: true },
      { ID: 1, DERNIERE_CONNEXION: 1, _id: 0 }
    );

    // Calculer le statut pour chaque utilisateur
    const now = new Date();
    const statuses = {};

    users.forEach(user => {
      const status = calculateUserStatus(user.DERNIERE_CONNEXION, now);
      statuses[user.ID] = {
        status: status,
        lastActivity: user.DERNIERE_CONNEXION || null
      };
    });

    // Ajouter les utilisateurs non trouvés comme 'offline'
    userIds.forEach(userId => {
      if (!statuses[userId]) {
        statuses[userId] = {
          status: 'offline',
          lastActivity: null
        };
      }
    });

    res.status(200).json({
      success: true,
      data: statuses
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statuts:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statuts",
      error: error.message
    });
  }
};

/**
 * Mettre à jour la dernière activité de l'utilisateur actuel
 * PUT /api/users/heartbeat
 */
export const updateHeartbeat = async (req, res) => {
  try {
    const userId = req.user?.ID; // Récupéré du middleware d'authentification

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié"
      });
    }

    // Mettre à jour DERNIERE_CONNEXION
    await User.findOneAndUpdate(
      { ID: userId },
      { DERNIERE_CONNEXION: new Date() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Activité mise à jour"
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du heartbeat:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'activité",
      error: error.message
    });
  }
};

/**
 * Calculer le statut d'un utilisateur basé sur sa dernière connexion
 */
function calculateUserStatus(lastConnection, now = new Date()) {
  if (!lastConnection) return 'offline';

  const lastActivity = new Date(lastConnection);
  const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));

  // En ligne si dernière activité < 5 minutes
  if (diffMinutes < 5) return 'online';
  // Absent si < 30 minutes
  if (diffMinutes < 30) return 'away';
  // Hors ligne sinon
  return 'offline';
}
