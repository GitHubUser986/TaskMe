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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    inactifs: 0
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    PRENOM: '',
    NOM: '',
    EMAIL: '',
    ROLE: '',
    GRADE: '',
    SPECIALITE: '',
  });

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Recharger lors du changement de filtres
  useEffect(() => {
    fetchUsers(1); // Reset to page 1 when filters change
  }, [searchTerm, selectedSpecialty]);

  // Récupérer les utilisateurs
   const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSpecialty && { specialite: selectedSpecialty })
      };

      const response = await userAPI.getAll(params);

      if (response.data.success) {
        // Filter out any invalid user objects
        const allUsers = response.data.data.users || [];
        const validUsers = allUsers.filter(
          (user: any) => user && user.NOM && user.PRENOM && user.EMAIL
        );
        
        // Log warning if some users were filtered out
        if (allUsers.length !== validUsers.length) {
          console.warn(
            `Filtered out ${allUsers.length - validUsers.length} invalid user(s). ` +
            `Invalid users:`, 
            allUsers.filter((u: any) => !u || !u.NOM || !u.PRENOM || !u.EMAIL)
          );
        }
        
        setUsers(validUsers);
        
        // Handle pagination data
        if (response.data.data.pagination) {
          setPagination(response.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Erreur lors du chargement des utilisateurs. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };


  // Récupérer les statistiques
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

  // Modifier un utilisateur
  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      PRENOM: user.PRENOM,
      NOM: user.NOM,
      EMAIL: user.EMAIL,
      ROLE: user.ROLE,
      GRADE: user.GRADE,
      SPECIALITE: user.SPECIALITE,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      // Préparer les données en fonction du rôle
      const updatedData = {
        ...formData,
        SPECIALITE: formData.ROLE === 'USER' ? formData.SPECIALITE : 
                   (formData.ROLE === 'ADMIN' ? 'Auditeur élu' : '')
      };

      const response = await userAPI.update(selectedUser._id, updatedData);
      if (response.data.success) {
        // Mettre à jour localement la liste des users
        setUsers(users.map(u => u._id === selectedUser._id ? response.data.user : u));
        fetchStats(); // rafraîchir les stats
        setIsEditModalOpen(false);
        alert('Utilisateur mis à jour avec succès');
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  // Basculer le statut actif/inactif
  const handleToggleStatus = async (ID: string) => {
    try {
      const response = await userAPI.toggleStatus(ID);

      if (response.data.success) {
        // Mise à jour locale
        setUsers(users.map(user =>
          user.ID === ID
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

  // Supprimer un utilisateur
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

  //  Badge de grade
  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: 'SUPERADMIN' | 'ADMIN' | 'USER') => {
    switch (role) {
      case 'SUPERADMIN':
        return 'Administrateur';
      case 'ADMIN':
        return 'Coordinateur';
      case 'USER':
        return 'Auditeur';
      default:
        return role;
    }
  };

  //  Badge de rôle
  const getRoleBadgeColor = (role: 'SUPERADMIN' | 'ADMIN' | 'USER') => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  //  Badge de statut
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

  // Affichage du nom court de la spécialité
  const getShortSpecialty = (specialite: string) => {
    // Supprime "Auditeur " ou "Auditeur d'/de/des " en début de chaîne
    const clean = specialite.replace(/^Auditeur (d'|d’|de |des )?/, '');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
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
                Nouvel utilisateur
              </button>
            </div>
          </div>
        </div>

          {/* Statistiques */}
        <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.filter(user => user && user.NOM && user.PRENOM).map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-bold text-gray-900">
                          {user.NOM} {user.PRENOM}
                        </span>
                        <span
                          className={`inline-flex w-fit items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${getRoleBadgeColor(user.ROLE)}`}
                        >
                          {getRoleLabel(user.ROLE)}
                        </span>
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
                      {getStatusBadge(user.ACTIF)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === user._id ? null : user._id);
                        }}
                        className="p-2 rounded-full hover:bg-gray-200"
                      >
                        ⋮
                      </button>
                      {openMenuId === user._id && (
                        <div className="absolute right-6 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <ul className="flex flex-col">
                            <li>
                              <button
                                onClick={() => handleEdit(user)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Editer
                              </button>
                            </li>

                            <li>
                              <button
                                onClick={() => {
                                  handleToggleStatus(user.ID);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                {user.ACTIF ? 'Désactiver' : 'Activer'}
                              </button>
                            </li>

                            <li>
                              <button
                                onClick={() => {
                                  handleDelete(user._id, user.NOM, user.PRENOM);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Supprimer
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600 mx-7">
                Affichage de {((pagination.currentPage - 1) * pagination.perPage) + 1} à{' '}
                {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} sur{' '}
                {pagination.totalItems} utilisateurs
              </div>
              
              <div className="flex gap-2 my-4 mx-16">
                <button
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Précédent
                </button>
                
                <span className="px-4 py-2">
                  Page {pagination.currentPage} sur {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 border-b border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Modifier l'utilisateur</h2>
                      <p className="text-blue-100 mt-1 text-sm">Mettez à jour les informations de l'utilisateur</p>
                    </div>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleEditSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                  <div className="p-8 space-y-6">
                    {/* Personal Information Section */}
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prénom <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Entrez le prénom"
                            value={formData.PRENOM}
                            onChange={e => setFormData({ ...formData, PRENOM: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Entrez le nom"
                            value={formData.NOM}
                            onChange={e => setFormData({ ...formData, NOM: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact & Access Section */}
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            placeholder="exemple@email.com"
                            value={formData.EMAIL}
                            onChange={e => setFormData({ ...formData, EMAIL: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rôle <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.ROLE}
                            onChange={e => {
                              const newRole = e.target.value;
                              setFormData({ 
                                ...formData, 
                                ROLE: newRole,
                                SPECIALITE: newRole === 'USER' ? formData.SPECIALITE : ''
                              });
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            required
                          >
                            <option value="SUPERADMIN">Super Administrateur</option>
                            <option value="ADMIN">Coordinateur</option>
                            <option value="USER">Auditeur</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Professional Information Section */}
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grade <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.GRADE}
                            onChange={e => setFormData({ ...formData, GRADE: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            required
                          >
                            <option value="A">Grade A</option>
                            <option value="B">Grade B</option>
                            <option value="C">Grade C</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Spécialité {formData.ROLE === 'USER' && <span className="text-red-500">*</span>}
                          </label>
                          {formData.ROLE === 'ADMIN' ? (
                            <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-blue-50 text-gray-700 flex items-center gap-2">
                              <span className="font-medium">Auditeur élu</span>
                            </div>
                          ) : formData.ROLE === 'SUPERADMIN' ? (
                            <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-purple-50 text-gray-700 flex items-center gap-2">
                              <span className="font-medium">Aucune spécialité</span>
                            </div>
                          ) : (
                            <select
                              value={formData.SPECIALITE}
                              onChange={e => setFormData({ ...formData, SPECIALITE: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                              required
                            >
                              <option value="">Sélectionner une spécialité...</option>
                              <option value="Auditeur pédagogique">Auditeur pédagogique</option>
                              <option value="Auditeur d'orientation">Auditeur d'orientation</option>
                              <option value="Auditeur de planification">Auditeur de planification</option>
                              <option value="Auditeur des services financiers">Auditeur des services financiers</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t border-gray-200 px-8 py-6 bg-gray-50 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}


          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;