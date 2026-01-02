import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ==============================
// Génération du token JWT
// ==============================
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

// ==============================
// REGISTER
// ==============================
export const register = async (req, res) => {
  try {
    const {
      NOM,
      PRENOM,
      EMAIL,
      MOT_DE_PASSE,
      ROLE,
      GRADE,
      SPECIALITE
    } = req.body;

    // Validation minimale
    if (!NOM || !PRENOM || !EMAIL || !MOT_DE_PASSE || !GRADE || !SPECIALITE) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis"
      });
    }

    // Vérifier si l'utilisateur existe
    const userExists = await User.findOne({ EMAIL });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà"
      });
    }

    // Création utilisateur
    const user = await User.create({
      NOM,
      PRENOM,
      EMAIL,
      MOT_DE_PASSE, // hashé automatiquement via pre('save')
      ROLE: ROLE || "USER",
      GRADE,
      SPECIALITE
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: error.message
    });
  }
};

// ==============================
// LOGIN
// ==============================
export const login = async (req, res) => {
  try {

    const { EMAIL, MOT_DE_PASSE } = req.body;
    console.log({EMAIL, MOT_DE_PASSE});

    if (!EMAIL || !MOT_DE_PASSE) {
      return res.status(400).json({
        success: false,
        message: "EMAIL et MOT_DE_PASSE requis"
      });
    }

    // Récupérer l'utilisateur avec mot de passe
    const user = await User
      .findOne({ EMAIL })
      .select("+MOT_DE_PASSE");
      console.log({EMAIL, MOT_DE_PASSE});

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect101"
      });
    }

    // Vérification mot de passe
    const isPasswordValid = await user.comparePassword(MOT_DE_PASSE);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect110"
      });
    }

    // Mise à jour dernière connexion
    user.DERNIERE_CONNEXION = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message
    });
  }
};

// ==============================
// GET CURRENT USER
// ==============================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error("Erreur getMe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: error.message
    });
  }
};

// ==============================
// UPDATE PROFILE
// ==============================
export const updateProfile = async (req, res) => {
  try {
    const {
      NOM,
      PRENOM,
      EMAIL,
      GRADE,
      SPECIALITE,
      FORMATIONS,
      DIPLOMES
    } = req.body;

    // Vérifier email unique
    if (EMAIL) {
      const emailExists = await User.findOne({
        EMAIL,
        _id: { $ne: req.user.id }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé"
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        NOM,
        PRENOM,
        EMAIL,
        GRADE,
        SPECIALITE,
        FORMATIONS,
        DIPLOMES
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: { user }
    });

  } catch (error) {
    console.error("Erreur updateProfile:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
      error: error.message
    });
  }
};

// ==============================
// CHANGE PASSWORD
// ==============================
export const changePassword = async (req, res) => {
  try {
    const { MOT_DE_PASSE_ACTUEL, NOUVEAU_MOT_DE_PASSE } = req.body;

    if (!MOT_DE_PASSE_ACTUEL || !NOUVEAU_MOT_DE_PASSE) {
      return res.status(400).json({
        success: false,
        message: "Champs requis manquants"
      });
    }

    const user = await User
      .findById(req.user.id)
      .select("+MOT_DE_PASSE");

    const isMatch = await user.comparePassword(MOT_DE_PASSE_ACTUEL);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect"
      });
    }

    user.MOT_DE_PASSE = NOUVEAU_MOT_DE_PASSE;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe modifié avec succès"
    });

  } catch (error) {
    console.error("Erreur changePassword:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement de mot de passe",
      error: error.message
    });
  }
};


// Obtenir tous les utilisateurs (Admin uniquement)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

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
    const user = await User.findById(req.params.id).select('-password');

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

// Supprimer un utilisateur (Admin uniquement)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de son propre compte
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
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