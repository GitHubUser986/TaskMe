import { body, validationResult } from 'express-validator';

// Middleware pour gérer les erreurs de validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(err => ({
        champ: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Validation pour l'inscription
export const validateRegister = [
  body('NOM')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('PRENOM')
    .trim()
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('EMAIL')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Format d\'email invalide'),
  
  body('MOT_DE_PASSE')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),
  
  body('ROLE')
    .optional()
    .isIn(['SUPERADMIN', 'ADMIN', 'USER'])
    .withMessage('Le rôle doit être SUPERADMIN, ADMIN ou USER'),

  body('GRADE')
  .notEmpty()
  .withMessage('Le grade est requis')
  .isIn(['A', 'B', 'C'])
  .withMessage('Le grade doit être A, B ou C'),

body('SPECIALITE')
  .optional({ nullable: true })
  .isIn([
    "Auditeur élu",
    "Auditeur pédagogique",
    "Auditeur d'orientation",
    "Auditeur de planification",
    "Auditeur des services financiers"
  ])
  .withMessage('Spécialité invalide'),
  
  handleValidationErrors
];

// Validation pour la connexion
export const validateLogin = [
  body('EMAIL')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Format d\'email invalide'),

  body('MOT_DE_PASSE')
    .notEmpty().withMessage('Le mot de passe est requis'),
  
  handleValidationErrors
];

// Validation pour la mise à jour du profil
export const validateUpdateProfile = [
  body('NOM')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  body('PRENOM')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('EMAIL')
    .optional()
    .trim()
    .isEmail().withMessage('Format d\'email invalide'),
  
  handleValidationErrors
];

// Validation pour le changement de mot de passe
export const validateChangePassword = [
  body('MOT_DE_PASSE_ACTUEL')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),

  body('NOUVEAU_MOT_DE_PASSE')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'
    ),

  body('CONFIRMATION_MOT_DE_PASSE')
    .notEmpty()
    .withMessage('La confirmation du mot de passe est requise')
    .custom((value, { req }) => value === req.body.NOUVEAU_MOT_DE_PASSE)
    .withMessage('Les mots de passe ne correspondent pas'),

  handleValidationErrors
];
  

// Validation pour les véhicules
export const validateVehicule = [
  
  body('IMMATRICULATION')
    .trim()
    .notEmpty().withMessage('L\'immatriculation est requise')
    .matches(/^[A-Z0-9\-]+$/)
    .withMessage('Format d\'immatriculation invalide'),
  
  handleValidationErrors
];

// Validation personnalisée pour les emails
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation personnalisée pour les mots de passe forts
export const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};