import React, { useState, useEffect } from 'react';
import { 
  User, GraduationCap, 
  BookOpen, Save, X, Loader2, Plus, Trash2,
  AlertCircle, CheckCircle, Lock, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

interface ProfileFormData {
  NOM: string;
  PRENOM: string;
  EMAIL: string;
  SPECIALITE: string;
  GRADE: string;
  FORMATIONS: string[];
  DIPLOMES: string[];
}

const EditProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProfileFormData>({
    NOM: '',
    PRENOM: '',
    EMAIL: '',
    SPECIALITE: '',
    GRADE: 'A',
    FORMATIONS: [],
    DIPLOMES: []
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [newFormation, setNewFormation] = useState('');
  const [newDiplome, setNewDiplome] = useState('');

  const specialites = [
    "Auditeur pédagogique",
    "Auditeur d'orientation",
    "Auditeur de planification",
    "Auditeur des services financiers"
  ];

  const grades = ['A', 'B', 'C'];

  // Charger les données de l'utilisateur depuis l'API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getMe();
        const userData = response.data.data.user;
        
        setFormData({
          NOM: userData.NOM || '',
          PRENOM: userData.PRENOM || '',
          EMAIL: userData.EMAIL || '',
          SPECIALITE: userData.SPECIALITE || '',
          GRADE: userData.GRADE || 'A',
          FORMATIONS: userData.FORMATIONS || [],
          DIPLOMES: userData.DIPLOMES || []
        });
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addFormation = () => {
    if (newFormation.trim()) {
      setFormData(prev => ({
        ...prev,
        FORMATIONS: [...prev.FORMATIONS, newFormation.trim()]
      }));
      setNewFormation('');
    }
  };

  const removeFormation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      FORMATIONS: prev.FORMATIONS.filter((_, i) => i !== index)
    }));
  };

  const addDiplome = () => {
    if (newDiplome.trim()) {
      setFormData(prev => ({
        ...prev,
        DIPLOMES: [...prev.DIPLOMES, newDiplome.trim()]
      }));
      setNewDiplome('');
    }
  };

  const removeDiplome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      DIPLOMES: prev.DIPLOMES.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitProfile = async () => {
    // Validation
    if (!formData.NOM || !formData.PRENOM || !formData.EMAIL || !formData.SPECIALITE) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.EMAIL)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await authAPI.updateProfile(formData);
      
      setSuccess(true);
      
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess(true);
      
      // Réinitialiser les champs du formulaire de mot de passe
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Erreur lors du changement de mot de passe:', err);
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Modifier le profil</h1>
            <p className="text-gray-400">Mettez à jour vos informations personnelles</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-400">Modifications enregistrées avec succès !</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'info', label: 'Informations', icon: User },
            { key: 'diplomas', label: 'Diplômes', icon: GraduationCap },
            { key: 'formations', label: 'Formations', icon: BookOpen },
            { key: 'password', label: 'Mot de passe', icon: Lock }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setError(null);
                setSuccess(false);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-700/50">
          
          {/* Informations personnelles */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <User className="w-6 h-6" />
                Informations personnelles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="PRENOM"
                    value={formData.PRENOM}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="NOM"
                    value={formData.NOM}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="EMAIL"
                    value={formData.EMAIL}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="votre.email@exemple.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Spécialité *
                  </label>
                  <select
                    name="SPECIALITE"
                    value={formData.SPECIALITE}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Sélectionner une spécialité</option>
                    {specialites.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Grade *
                  </label>
                  <select
                    name="GRADE"
                    value={formData.GRADE}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {grades.map(grade => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                <button
                  onClick={handleGoBack}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Annuler
                </button>
                <button
                  onClick={handleSubmitProfile}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Diplômes */}
          {activeTab === 'diplomas' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <GraduationCap className="w-6 h-6" />
                Diplômes et Certifications
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDiplome}
                    onChange={(e) => setNewDiplome(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDiplome())}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ajouter un diplôme..."
                  />
                  <button
                    onClick={addDiplome}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.DIPLOMES.map((diplome, index) => (
                    <div
                      key={index}
                      className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30 flex items-center justify-between group hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <GraduationCap className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-white font-medium">{diplome}</span>
                      </div>
                      <button
                        onClick={() => removeDiplome(index)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {formData.DIPLOMES.length === 0 && (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aucun diplôme enregistré</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                <button
                  onClick={handleGoBack}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Annuler
                </button>
                <button
                  onClick={handleSubmitProfile}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Formations */}
          {activeTab === 'formations' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                Formations Professionnelles
              </h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFormation}
                    onChange={(e) => setNewFormation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFormation())}
                    className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Ajouter une formation..."
                  />
                  <button
                    onClick={addFormation}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.FORMATIONS.map((formation, index) => (
                    <div
                      key={index}
                      className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30 flex items-center justify-between group hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <BookOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-white font-medium">{formation}</span>
                      </div>
                      <button
                        onClick={() => removeFormation(index)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {formData.FORMATIONS.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Aucune formation enregistrée</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                <button
                  onClick={handleGoBack}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Annuler
                </button>
                <button
                  onClick={handleSubmitProfile}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mot de passe */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Lock className="w-6 h-6" />
                Changer le mot de passe
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mot de passe actuel *
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <p className="mt-1 text-sm text-gray-400">Minimum 6 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                <button
                  onClick={handleGoBack}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Annuler
                </button>
                <button
                  onClick={handleSubmitPassword}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Changer le mot de passe
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;