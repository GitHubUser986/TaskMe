import React, { useState } from 'react';

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

interface UserProfile {
  name: string;
  role: 'SuperAdmin' | 'Coordinateur' | 'Auditeur';
  specialty: string;
  grade: 'A' | 'B' | 'C';
  email: string;
  tasks: Task[];
  notifications: string[];
}

const ProfilePage: React.FC = () => {
  // Exemple de données utilisateur
  const [user, setUser] = useState<UserProfile>({
    name: 'Ahmed El Fassi',
    role: 'Coordinateur',
    specialty: 'Auditeur pédagogique',
    grade: 'A',
    email: 'ahmed.el.fassi@example.com',
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
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Profil Utilisateur</h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {user.role}
          </span>
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations personnelles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 font-medium">Nom</p>
              <p className="text-gray-800">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Email</p>
              <p className="text-gray-800">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Spécialité</p>
              <p className="text-gray-800">{user.specialty}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Grade</p>
              <p className="text-gray-800">{user.grade}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
