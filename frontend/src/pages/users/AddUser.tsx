import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Award, Briefcase, Save, X, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { userAPI } from '../../services/api';

interface UserFormData {
  NOM: string;
  PRENOM: string;
  EMAIL: string;
  MOT_DE_PASSE: string;
  confirmPassword: string;
  SPECIALITE: string;
  GRADE: string;
  ROLE: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<UserFormData>({
    NOM: '',
    PRENOM: '',
    EMAIL: '',
    MOT_DE_PASSE: '',
    confirmPassword: '',
    SPECIALITE: '',
    GRADE: 'C',
    ROLE: 'USER'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const specialites = [
    'Auditeur pédagogique',
    'Auditeur d\'orientation',
    'Auditeur de planification',
    'Auditeur des services financiers'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Effacer les messages globaux
    setErrorMessage('');
    setSuccessMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    // Validation Nom
    if (!formData.NOM.trim()) {
      newErrors.NOM = 'Le nom est requis';
    } else if (formData.NOM.length < 2) {
      newErrors.NOM = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation Prénom
    if (!formData.PRENOM.trim()) {
      newErrors.PRENOM = 'Le prénom est requis';
    } else if (formData.PRENOM.length < 2) {
      newErrors.PRENOM = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Validation Email
    if (!formData.EMAIL.trim()) {
      newErrors.EMAIL = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EMAIL)) {
      newErrors.EMAIL = 'Format d\'email invalide';
    }

    // Validation Mot de passe
    if (!formData.MOT_DE_PASSE) {
      newErrors.MOT_DE_PASSE = 'Le mot de passe est requis';
    } else if (formData.MOT_DE_PASSE.length < 8) {
      newErrors.MOT_DE_PASSE = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.MOT_DE_PASSE)) {
      newErrors.MOT_DE_PASSE = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';
    }

    // Validation Confirmation mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.MOT_DE_PASSE !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Validation Spécialité
    if (formData.ROLE === 'USER' && !formData.SPECIALITE) {
     newErrors.SPECIALITE = 'La spécialité est requise';
   }

    // Validation Grade
    if (!formData.GRADE) {
      newErrors.GRADE = 'Le grade est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMessage('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Préparer les données pour l'API
      const userData = {
        NOM: formData.NOM.trim(),
        PRENOM: formData.PRENOM.trim(),
        EMAIL: formData.EMAIL.trim().toLowerCase(),
        MOT_DE_PASSE: formData.MOT_DE_PASSE,
        ROLE: formData.ROLE,
        GRADE: formData.GRADE,
        SPECIALITE: formData.ROLE === 'USER' ? formData.SPECIALITE : (formData.ROLE === 'ADMIN' ? 'Auditeur élu' : '')
      };
console.log(userData);
      const response = await userAPI.create(userData);

      if (response.data.success) {
        setSuccessMessage('Utilisateur créé avec succès !');
        
        // Réinitialiser le formulaire
        setFormData({
          NOM: '',
          PRENOM: '',
          EMAIL: '',
          MOT_DE_PASSE: '',
          confirmPassword: '',
          SPECIALITE: '',
          GRADE: 'A',
          ROLE: 'USER'
        });
        setErrors({});

        // Rediriger vers la liste des utilisateurs après 2 secondes
        setTimeout(() => {
          navigate('/users');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', err);
      
      // Gérer les différents types d'erreurs
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Erreurs de validation du backend
        const backendErrors: Partial<Record<keyof UserFormData, string>> = {};
        err.response.data.errors.forEach((error: any) => {
          backendErrors[error.champ as keyof UserFormData] = error.message;
        });
        setErrors(backendErrors);
        setErrorMessage('Veuillez corriger les erreurs indiquées');
      } else {
        // Erreur générale
        setErrorMessage(
          err.response?.data?.message || 
          'Erreur lors de la création de l\'utilisateur. Veuillez réessayer.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler? Les données non enregistrées seront perdues.')) {
      navigate('/users');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Ajouter un nouvel utilisateur</h1>
          <p className="text-gray-600 mt-2">Créez un nouveau compte utilisateur dans le système</p>
        </div>

        {/* Message de succès */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{successMessage}</p>
              <p className="text-sm mt-1">Redirection en cours...</p>
            </div>
          </div>
        )}

        {/* Message d'erreur global */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="NOM" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="NOM"
                  name="NOM"
                  value={formData.NOM}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.NOM ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: El Fassi"
                  disabled={loading}
                />
                {errors.NOM && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.NOM}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="PRENOM" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="PRENOM"
                  name="PRENOM"
                  value={formData.PRENOM}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.PRENOM ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Ahmed"
                  disabled={loading}
                />
                {errors.PRENOM && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.PRENOM}
                  </p>
                )}
              </div>
            </div>

            {/* Email*/}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
              <div>
                <label htmlFor="EMAIL" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="EMAIL"
                  name="EMAIL"
                  value={formData.EMAIL}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.EMAIL ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="exemple@education.ma"
                  disabled={loading}
                />
                {errors.EMAIL && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.EMAIL}
                  </p>
                )}
              </div>
            </div>

            {/* Mot de passe et Confirmation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="MOT_DE_PASSE" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="MOT_DE_PASSE"
                  name="MOT_DE_PASSE"
                  value={formData.MOT_DE_PASSE}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.MOT_DE_PASSE ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Min. 8 caractères"
                  disabled={loading}
                />
                {errors.MOT_DE_PASSE && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.MOT_DE_PASSE}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Majuscule, minuscule, chiffre et caractère spécial requis
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirmer le mot de passe"
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Spécialité et Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Spécialité <span className="text-red-500">{formData.ROLE === 'USER' && '*'}</span>
                </label>
                {formData.ROLE === 'ADMIN' ? (
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value="Auditeur élu"
                    disabled
                  />
                ) : formData.ROLE === 'SUPERADMIN' ? (
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value="Aucune spécialité"
                    disabled
                  />
                ) : (
                  <select
                    name="SPECIALITE"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.SPECIALITE ? 'border-red-500' : 'border-gray-300'
                  }`}
                    value={formData.SPECIALITE}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Sélectionner...</option>
                    {specialites.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="GRADE" className="block text-sm font-medium text-gray-700 mb-2">
                  <Award className="w-4 h-4 inline mr-2" />
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  id="GRADE"
                  name="GRADE"
                  value={formData.GRADE}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.GRADE ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>
                {errors.GRADE && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.GRADE}
                  </p>
                )}
              </div>
            </div>

            {/* Rôle */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rôle <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ROLE"
                    value="USER"
                    checked={formData.ROLE === 'USER'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-gray-700">Utilisateur</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ROLE"
                    value="ADMIN"
                    checked={formData.ROLE === 'ADMIN'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-gray-700">Administrateur</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ROLE"
                    value="SUPERADMIN"
                    checked={formData.ROLE === 'SUPERADMIN'}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-gray-700">Super Administrateur</span>
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Les administrateurs ont accès à toutes les fonctionnalités du système
              </p>
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Ajouter l'utilisateur
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Informations importantes
          </h3>
          <ul className="text-sm text-blue-900 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Les champs marqués d'un astérisque (*) sont obligatoires</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>L'utilisateur pourra se connecter immédiatement après la création du compte</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Le compte sera activé par défaut lors de la création</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddUser;