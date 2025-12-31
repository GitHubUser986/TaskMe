import React, { useState } from 'react';
import { 
  User, Mail, Award, Briefcase, GraduationCap, 
  BookOpen, Calendar, MapPin, Edit2, Save, X,
  CheckCircle, Clock, FileText, Star, Trophy
} from 'lucide-react';

interface Task {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  isRemunerated: boolean;
  specialty: string;
  grades: string;
  requiresVehicle: boolean;
  direction: string;
  pdfFile?: string;
  seats: number;
}

interface Formation {
  id: number;
  title: string;
  institution: string;
  date: string;
  duration: string;
  certificate?: string;
}

interface Diploma {
  id: number;
  title: string;
  institution: string;
  year: string;
  field: string;
  level: 'Licence' | 'Master' | 'Doctorat' | 'Ingénieur';
}

interface UserProfile {
  name: string;
  role: 'SuperAdmin' | 'Coordinateur' | 'Auditeur';
  specialty: string;
  grade: 'A' | 'B' | 'C';
  email: string;
  phone?: string;
  location?: string;
  joinDate?: string;
  bio?: string;
  tasks: Task[];
  notifications: string[];
  formations: Formation[];
  diplomas: Diploma[];
}

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'diplomas' | 'formations' | 'tasks'>('info');
  
  const [user, setUser] = useState<UserProfile>({
    name: 'Ahmed El Fassi',
    role: 'Coordinateur',
    specialty: 'Auditeur pédagogique',
    grade: 'A',
    email: 'ahmed.el.fassi@example.com',
    phone: '+212 6 12 34 56 78',
    location: 'Rabat, Maroc',
    joinDate: '2020-09-01',
    bio: 'Coordinateur expérimenté avec plus de 5 ans d\'expérience dans la gestion de projets pédagogiques et la formation professionnelle.',
    tasks: [
      {
        id: 1,
        name: 'Formation React avancé',
        type: 'Formateur',
        startDate: '2026-01-15',
        endDate: '2026-01-20',
        isRemunerated: true,
        specialty: 'Pédagogique',
        grades: 'A',
        requiresVehicle: true,
        direction: 'Rabat - Casa',
        pdfFile: 'formation_react.pdf',
        seats: 5,
      },
      {
        id: 2,
        name: 'Jury PFE Info',
        type: 'Membre jury',
        startDate: '2026-01-22',
        endDate: '2026-01-22',
        isRemunerated: false,
        specialty: 'Orientation',
        grades: 'A',
        requiresVehicle: false,
        direction: 'Meknès - Errachidia',
        seats: 3,
      },
    ],
    notifications: [
      'Nouvelle tâche assignée: Formation React avancé',
      'Tâche Jury PFE Info modifiée',
    ],
    formations: [
      {
        id: 1,
        title: 'Gestion de Projet Agile',
        institution: 'Institut de Formation Professionnelle',
        date: '2024-06-15',
        duration: '40 heures',
        certificate: 'cert_agile_2024.pdf'
      },
      {
        id: 2,
        title: 'Pédagogie Numérique',
        institution: 'Université Mohammed V',
        date: '2023-11-20',
        duration: '60 heures',
        certificate: 'cert_pedagogie_2023.pdf'
      },
      {
        id: 3,
        title: 'Leadership et Management',
        institution: 'ESCA École de Management',
        date: '2023-03-10',
        duration: '30 heures'
      },
    ],
    diplomas: [
      {
        id: 1,
        title: 'Master en Management de Projet',
        institution: 'Université Hassan II',
        year: '2019',
        field: 'Gestion de Projet',
        level: 'Master'
      },
      {
        id: 2,
        title: 'Licence en Sciences de l\'Éducation',
        institution: 'Université Mohammed V',
        year: '2017',
        field: 'Pédagogie',
        level: 'Licence'
      },
      {
        id: 3,
        title: 'Diplôme d\'Ingénieur Informatique',
        institution: 'ENSIAS',
        year: '2015',
        field: 'Informatique',
        level: 'Ingénieur'
      },
    ],
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'from-purple-500 to-pink-600';
      case 'Coordinateur': return 'from-blue-500 to-purple-600';
      case 'Auditeur': return 'from-green-500 to-teal-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Doctorat': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'Ingénieur': return <Award className="w-5 h-5 text-purple-500" />;
      case 'Master': return <Star className="w-5 h-5 text-blue-500" />;
      case 'Licence': return <BookOpen className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Card */}
        <div className="bg-slate-800/100 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 mb-6">
          <div className={` bg-gradient-to-r ${getRoleColor(user.role)} relative`}>
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
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-slate-800"></div>
              </div>

              {/* Info */}
              <div className="flex-1 mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-3">{user.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-4 py-2 bg-gradient-to-r ${getRoleColor(user.role)} text-white rounded-full text-sm font-semibold shadow-lg`}>
                        {user.role}
                      </span>
                      <span className="px-4 py-2 bg-slate-700/70 text-white rounded-full text-sm font-semibold">
                        Grade {user.grade}
                      </span>
                    </div>
                    {user.bio && (
                      <p className="text-gray-300 max-w-2xl leading-relaxed">{user.bio}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all duration-300 flex items-center gap-2"
                  >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    {isEditing ? 'Annuler' : 'Modifier'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Briefcase className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tâches</p>
                    <p className="text-white font-bold text-lg">{user.tasks.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Diplômes</p>
                    <p className="text-white font-bold text-lg">{user.diplomas.length}</p>
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
                    <p className="text-white font-bold text-lg">{user.formations.length}</p>
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
                    <p className="text-white font-bold text-lg">
                      {user.joinDate ? `${new Date().getFullYear() - new Date(user.joinDate).getFullYear()} ans` : 'N/A'}
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
            { key: 'tasks', label: 'Tâches', icon: Briefcase },
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
                    <p className="text-gray-400 font-medium text-sm">Nom complet</p>
                  </div>
                  <p className="text-white font-semibold">{user.name}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-green-400" />
                    <p className="text-gray-400 font-medium text-sm">Email</p>
                  </div>
                  <p className="text-white font-semibold">{user.email}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    <p className="text-gray-400 font-medium text-sm">Spécialité</p>
                  </div>
                  <p className="text-white font-semibold">{user.specialty}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <p className="text-gray-400 font-medium text-sm">Grade</p>
                  </div>
                  <p className="text-white font-semibold">{user.grade}</p>
                </div>
                {user.phone && (
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-orange-400" />
                      <p className="text-gray-400 font-medium text-sm">Téléphone</p>
                    </div>
                    <p className="text-white font-semibold">{user.phone}</p>
                  </div>
                )}
                {user.location && (
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <p className="text-gray-400 font-medium text-sm">Localisation</p>
                    </div>
                    <p className="text-white font-semibold">{user.location}</p>
                  </div>
                )}
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
              <div className="grid grid-cols-1 gap-4">
                {user.diplomas.map((diploma) => (
                  <div
                    key={diploma.id}
                    className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl">
                          {getLevelIcon(diploma.level)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{diploma.title}</h3>
                          <div className="space-y-1">
                            <p className="text-gray-400 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              {diploma.institution}
                            </p>
                            <p className="text-gray-400 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {diploma.field}
                            </p>
                            <p className="text-gray-400 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {diploma.year}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold border border-blue-500/30">
                        {diploma.level}
                      </span>
                    </div>
                  </div>
                ))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.formations.map((formation) => (
                  <div
                    key={formation.id}
                    className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-lg">
                        <BookOpen className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{formation.title}</h3>
                        <p className="text-gray-400 text-sm">{formation.institution}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(formation.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-gray-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formation.duration}
                      </p>
                      {formation.certificate && (
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                            <CheckCircle className="w-3 h-3" />
                            Certifié
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tâches */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Briefcase className="w-6 h-6" />
                Tâches Assignées
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {user.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{task.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                            {task.type}
                          </span>
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                            {task.specialty}
                          </span>
                          {task.isRemunerated && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                              Rémunéré
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <p className="text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Du {new Date(task.startDate).toLocaleDateString('fr-FR')} au {new Date(task.endDate).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-gray-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {task.direction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;