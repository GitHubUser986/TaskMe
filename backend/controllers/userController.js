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
      actif,
      page = 1,
      limit = 10
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

    // Pagination
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(filter);
    
    const users = await User.find(filter)
      .select('-MOT_DE_PASSE')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
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
    const user = await User.findById(req.params.id).select('-MOT_DE_PASSE');

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
    const user = await User.findById(req.params.id);
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
    const user = await User.findById(req.params.id);

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
    const user = await User.findById(req.params.id);

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
      { $group: { _id: '$ROLE', count: { $sum: 1 } } }
    ]);

    const parGrade = await User.aggregate([
      { $group: { _id: '$GRADE', count: { $sum: 1 } } }
    ]);

    const parSpecialite = await User.aggregate([
      { $group: { _id: '$SPECIALITE', count: { $sum: 1 } } }
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
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};