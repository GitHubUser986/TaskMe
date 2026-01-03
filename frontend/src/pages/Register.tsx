import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Briefcase, GraduationCap, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    NOM: '',
    PRENOM: '',
    EMAIL: '',
    MOT_DE_PASSE: '',
    confirmPassword: '',
    ROLE: 'USER',
    GRADE: 'C',
    SPECIALITE: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const specialites = [
    'Auditeur pédagogique',
    'Auditeur d\'orientation',
    'Auditeur de planification',
    'Auditeur des services financiers'
  ];

  const grades = ['A', 'B', 'C'];
  const roles = ['USER', 'ADMIN', 'SUPERADMIN'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    // Validation des champs requis
    if (!formData.NOM || !formData.PRENOM || !formData.EMAIL || !formData.MOT_DE_PASSE || !formData.SPECIALITE) {
      setError('Tous les champs obligatoires doivent être remplis');
      return false;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.EMAIL)) {
      setError('Format d\'email invalide');
      return false;
    }

    // Validation du mot de passe
    if (formData.MOT_DE_PASSE.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.MOT_DE_PASSE)) {
      setError('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial');
      return false;
    }

    // Vérification de la confirmation du mot de passe
    if (formData.MOT_DE_PASSE !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Préparer les données pour l'API
      const registrationData = {
        NOM: formData.NOM,
        PRENOM: formData.PRENOM,
        EMAIL: formData.EMAIL,
        MOT_DE_PASSE: formData.MOT_DE_PASSE,
        ROLE: formData.ROLE,
        GRADE: formData.GRADE,
        SPECIALITE: formData.SPECIALITE
      };

      const response = await authAPI.register(registrationData);

      if (response.data.success) {
        setSuccess(true);
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Erreur d\'inscription:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.[0]?.message ||
        'Erreur lors de l\'inscription. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700/50 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Inscription réussie !</h2>
          <p className="text-gray-300 mb-4">
            Votre compte a été créé avec succès. Vous allez être redirigé vers la page de connexion...
          </p>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo and Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Taskme</h1>
          <p className="text-gray-300 text-lg">Créez votre compte</p>
        </div>

        {/* Register Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Inscription</h2>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nom *
                </label>
                <input
                  type="text"
                  name="NOM"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nom"
                  value={formData.NOM}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Prénom *
                </label>
                <input
                  type="text"
                  name="PRENOM"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Prénom"
                  value={formData.PRENOM}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </label>
              <input
                type="email"
                name="EMAIL"
                className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="votre.email@exemple.com"
                value={formData.EMAIL}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            {/* Spécialité et Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Spécialité *
                </label>
                <select
                  name="SPECIALITE"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              </div>

              <div className="space-y-2">
                <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Grade *
                </label>
                <select
                  name="GRADE"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.GRADE}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rôle */}
            <div className="space-y-2">
              <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Rôle
              </label>
              <select
                name="ROLE"
                className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={formData.ROLE}
                onChange={handleChange}
                disabled={loading}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="MOT_DE_PASSE"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="Min. 8 caractères"
                  value={formData.MOT_DE_PASSE}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Doit contenir: majuscule, minuscule, chiffre et caractère spécial
              </p>
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <label className="text-gray-300 font-medium text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  placeholder="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Création du compte...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
          </div>

          <p className="text-center text-gray-400 mt-10">
            Vous avez déjà un compte? 
            <a 
              href="/login" 
              className="text-blue-400 hover:text-blue-300 ml-1 font-semibold transition-colors"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;