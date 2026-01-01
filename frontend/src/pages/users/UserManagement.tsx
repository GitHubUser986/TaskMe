import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';

interface User {
  _id: string;
  ID: string;
  NOM: string;
  PRENOM: string;
  EMAIL: string;
  ROLE: 'SUPERADMIN' | 'ADMIN' | 'USER';
  GRADE: 'A' | 'B' | 'C';
  SPECIALITE: string;
  ACTIF: boolean;
  FORMATIONS?: string[];
  DIPLOMES?: string[];
}

const UsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0
  });

  // 📥 Charger les utilisateurs au montage du composant
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // 🔄 Recharger lors du changement de filtres
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedSpecialty]);

  // 📡 Récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (selectedSpecialty) params.specialite = selectedSpecialty;

      const response = await userAPI.getAll(params);
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setError('');
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // 📊 Récupérer les statistiques
  const fetchStats = async () => {
    try {
      const response = await userAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  // ✏️ Modifier un utilisateur
  const handleEdit = (id: string) => {
    navigate(`/users/edit/${id}`);
  };

  // 🔄 Basculer le statut actif/inactif
  const handleToggleStatus = async (id: string) => {
    try {
      const response = await userAPI.toggleStatus(id);
      
      if (response.data.success) {
        // Mise à jour locale
        setUsers(users.map(user => 
          user._id === id 
            ? { ...user, ACTIF: !user.ACTIF }
            : user
        ));
        
        // Mettre à jour les stats
        fetchStats();
        
        alert(response.data.message);
      }
    } catch (err: any) {
      console.error('Erreur lors du changement de statut:', err);
      alert(err.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  // 🗑️ Supprimer un utilisateur
  const handleDelete = async (id: string, nom: string, prenom: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${prenom} ${nom} ?`)) {
      return;
    }

    try {
      const response = await userAPI.delete(id);
      
      if (response.data.success) {
        setUsers(users.filter(user => user._id !== id));
        fetchStats();
        alert('Utilisateur supprimé avec succès');
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // 🎨 Badge de grade
  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 🎨 Badge de rôle
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-blue-100 text-blue-800';
      case 'USER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 🎨 Badge de statut
  const getStatusBadge = (actif: boolean) => {
    if (actif) {
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

  // 📝 Affichage du nom court de la spécialité
  const getShortSpecialty = (specialite: string) => {
    return specialite.replace('Auditeur ', '').replace('Auditeur d\'', '');
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
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
                <option value="Auditeur pédagogique">Pédagogique</option>
                <option value="Auditeur d'orientation">Orientation</option>
                <option value="Auditeur de planification">Planification</option>
                <option value="Auditeur des services financiers">Services financiers</option>
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

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Nom complet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Spécialité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <strong className="text-gray-900">{user.PRENOM} {user.NOM}</strong>
                        <div className="text-xs text-gray-500">{user.ID}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.EMAIL}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getShortSpecialty(user.SPECIALITE)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeBadgeColor(user.GRADE)}`}>
                        Grade {user.GRADE}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.ROLE)}`}>
                        {user.ROLE}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.ACTIF)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user._id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className={`px-3 py-1 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            user.ACTIF
                              ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                              : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          }`}
                        >
                          {user.ACTIF ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.NOM, user.PRENOM)}
                          className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Total utilisateurs</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Utilisateurs actifs</div>
            <div className="text-2xl font-bold text-green-600">{stats.actifs}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Utilisateurs inactifs</div>
            <div className="text-2xl font-bold text-red-600">{stats.inactifs}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;