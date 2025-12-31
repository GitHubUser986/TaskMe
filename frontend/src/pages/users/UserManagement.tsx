import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface User {
  id: number;
  fullName: string;
  specialty: string;
  grade: string;
  role: string;
  status: 'actif' | 'inactif';
}

const UsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      fullName: 'Ahmed El Fassi',
      specialty: 'Pédagogique',
      grade: 'Grade A',
      role: 'Admin',
      status: 'actif'
    },
    {
      id: 2,
      fullName: 'Fatima Zahra',
      specialty: 'Orientation',
      grade: 'Grade B',
      role: 'User',
      status: 'actif'
    },
    {
      id: 3,
      fullName: 'Omar Benjelloun',
      specialty: 'Planification',
      grade: 'Grade A',
      role: 'User',
      status: 'inactif'
    },
    {
      id: 4,
      fullName: 'Salma Idrissi',
      specialty: 'Services financiers',
      grade: 'Grade C',
      role: 'User',
      status: 'actif'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const handleEdit = (id: number) => {
    console.log('Modifier utilisateur:', id);
    alert(`Modifier l'utilisateur ID: ${id}`);
  };

  const handleToggleStatus = (id: number) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: user.status === 'actif' ? 'inactif' : 'actif' }
        : user
    ));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === '' || user.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const getGradeBadgeColor = (grade: string) => {
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'actif') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Actif
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        Inactif
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Gestion des utilisateurs</h1>
            
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80"
                placeholder="Rechercher un auditeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <select
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-56"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">Toutes spécialités</option>
                <option value="Pédagogique">Pédagogique</option>
                <option value="Orientation">Orientation</option>
                <option value="Planification">Planification</option>
                <option value="Services financiers">Services financiers</option>
              </select>
              
              <button
                onClick={() => navigate('/users/create')}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
              >
                ➕ Nouvel utilisateur
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="text-gray-900">{user.fullName}</strong>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {user.specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeBadgeColor(user.grade)}`}>
                        {user.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            user.status === 'actif'
                              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}
                        >
                          {user.status === 'actif' ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Total utilisateurs</div>
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Utilisateurs actifs</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'actif').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Utilisateurs inactifs</div>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.status === 'inactif').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;