import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware de protection des routes
export const protect = async (req, res, next) => {
  let token;

  // Vérifier si le token existe dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraire le token
      token = req.headers.authorization.split(' ')[1];

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur (sans le mot de passe)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }

      next();
    } catch (error) {
      console.error('Erreur d\'authentification:', error.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou expiré' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accès refusé, aucun token fourni' 
    });
  }
};

// Middleware de vérification des rôles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non authentifié' 
      });
    }

    if (!roles.includes(req.user.ROLE)) {  // ← ici
      return res.status(403).json({ 
        success: false, 
        message: `Le rôle '${req.user.ROLE}' n'est pas autorisé à accéder à cette ressource` 
      });
    }

    next();
  };
};


// Middleware optionnel : Charger l'utilisateur si token présent
export const loadUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ne pas bloquer si le token est invalide
      req.user = null;
    }
  }

  next();
};