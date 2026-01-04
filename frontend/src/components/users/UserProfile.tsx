import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Award, Briefcase, GraduationCap, 
  BookOpen, Calendar, Edit2, Plus,
  CheckCircle, Clock, FileText, Star, Trophy, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

interface UserProfile {
  ID: string;
  NOM: string;
  PRENOM: string;
  EMAIL: string;
  ROLE: 'SUPERADMIN' | 'ADMIN' | 'USER';
  SPECIALITE: string;
  GRADE: 'A' | 'B' | 'C';
  FORMATIONS: string[];
  DIPLOMES: string[];
  ACTIF: boolean;
  DERNIERE_CONNEXION?: string;
  createdAt?: string;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'diplomas' | 'formations' | 'tasks'>('info');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Charger les données de l'utilisateur connecté
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getMe();
        setUser(response.data.data.user);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors du chargement du profil:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'from-purple-500 to-pink-600';
      case 'ADMIN': return 'from-blue-500 to-purple-600';
      case 'USER': return 'from-green-500 to-teal-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'Super Administrateur';
      case 'ADMIN': return 'Administrateur';
      case 'USER': return 'Utilisateur';
      default: return role;
    }
  };

  const getLevelIcon = (level: string) => {
    if (level.toLowerCase().includes('doctorat')) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (level.toLowerCase().includes('ingénieur')) return <Award className="w-5 h-5 text-purple-500" />;
    if (level.toLowerCase().includes('master')) return <Star className="w-5 h-5 text-blue-500" />;
    if (level.toLowerCase().includes('licence')) return <BookOpen className="w-5 h-5 text-green-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getYearsOfService = (joinDate?: string) => {
    if (!joinDate) return 'N/A';
    
    const now = new Date();
    const join = new Date(joinDate);
    const diffTime = Math.abs(now.getTime() - join.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calcul précis en années
    const years = now.getFullYear() - join.getFullYear();
    const monthDiff = now.getMonth() - join.getMonth();
    const dayDiff = now.getDate() - join.getDate();
    
    // Ajustement si l'anniversaire n'est pas encore passé cette année
    const adjustedYears = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? years - 1 : years;
    
    if (adjustedYears >= 1) {
      return `${adjustedYears} an${adjustedYears > 1 ? 's' : ''}`;
    }
    
    // Calcul en mois si moins d'un an
    const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;
    const totalMonths = adjustedYears * 12 + months;
    
    if (totalMonths >= 1) {
      return `${totalMonths} mois`;
    }
    
    // Affichage en jours si moins d'un mois
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md">
          <p className="text-red-400 text-center">{error || 'Utilisateur non trouvé'}</p>
        </div>
      </div>
    );
  }

  const fullName = `${user.PRENOM} ${user.NOM}`;

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Card */}
        <div className="bg-slate-800/100 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 mb-6">
          <div className={`bg-gradient-to-r ${getRoleColor(user.ROLE)} relative`}>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          <br />
          <br />
          <br />
          <div className="px-8 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-slate-800">
                  {user.PRENOM[0]}{user.NOM[0]}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-slate-800 ${user.ACTIF ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>

              {/* Info */}
              <div className="flex-1 mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-3">{fullName}</h1>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-4 py-2 bg-gradient-to-r ${getRoleColor(user.ROLE)} text-white rounded-full text-sm font-semibold shadow-lg`}>
                        {getRoleLabel(user.ROLE)}
                      </span>
                      <span className="px-4 py-2 bg-slate-700/70 text-white rounded-full text-sm font-semibold">
                        Grade {user.GRADE}
                      </span>
                      {!user.ACTIF && (
                        <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold border border-red-500/30">
                          Inactif
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 max-w-2xl leading-relaxed">{user.SPECIALITE}</p>
                  </div>
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Diplômes</p>
                    <p className="text-white font-bold text-lg">{user.DIPLOMES.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Formations</p>
                    <p className="text-white font-bold text-lg">{user.FORMATIONS.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ancienneté</p>
                    <p className="text-white font-bold text-lg">{getYearsOfService(user.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Dernière connexion</p>
                    <p className="text-white font-bold text-sm">
                      {user.DERNIERE_CONNEXION 
                        ? new Date(user.DERNIERE_CONNEXION).toLocaleDateString('fr-FR')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { key: 'info', label: 'Informations', icon: User },
            { key: 'diplomas', label: 'Diplômes', icon: GraduationCap },
            { key: 'formations', label: 'Formations', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-800/100 text-gray-400 hover:bg-slate-700/100 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800/100 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-slate-700/50">
          
          {/* Informations personnelles */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <User className="w-6 h-6" />
                Informations personnelles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <p className="text-gray-400 font-medium text-sm">Prénom</p>
                  </div>
                  <p className="text-white font-semibold">{user.PRENOM}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <p className="text-gray-400 font-medium text-sm">Nom</p>
                  </div>
                  <p className="text-white font-semibold">{user.NOM}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-green-400" />
                    <p className="text-gray-400 font-medium text-sm">Email</p>
                  </div>
                  <p className="text-white font-semibold">{user.EMAIL}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    <p className="text-gray-400 font-medium text-sm">Spécialité</p>
                  </div>
                  <p className="text-white font-semibold">{user.SPECIALITE}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <p className="text-gray-400 font-medium text-sm">Grade</p>
                  </div>
                  <p className="text-white font-semibold">{user.GRADE}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-5 h-5 text-orange-400" />
                    <p className="text-gray-400 font-medium text-sm">Rôle</p>
                  </div>
                  <p className="text-white font-semibold">{getRoleLabel(user.ROLE)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-gray-400 font-medium text-sm">Statut</p>
                  </div>
                  <p className="text-white font-semibold">{user.ACTIF ? 'Actif' : 'Inactif'}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <p className="text-gray-400 font-medium text-sm">Membre depuis</p>
                  </div>
                  <p className="text-white font-semibold">
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
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
              {user.DIPLOMES.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Aucun diplôme enregistré</p>
                  <button
                    onClick={handleEditProfile}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter des diplômes
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {user.DIPLOMES.map((diplome, index) => (
                    <div
                      key={index}
                      className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl">
                          {getLevelIcon(diplome)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{diplome}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formations */}
          {activeTab === 'formations' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                Formations Professionnelles
              </h2>
              {user.FORMATIONS.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Aucune formation enregistrée</p>
                  <button
                    onClick={handleEditProfile}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter des formations
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.FORMATIONS.map((formation, index) => (
                    <div
                      key={index}
                      className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-lg">
                          <BookOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{formation}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;