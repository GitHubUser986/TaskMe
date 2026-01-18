import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Eye, Search, X, Calendar, Users, Car, FileText } from 'lucide-react';
import { affectationAPI, tacheAPI, userAPI, vehiculeAPI } from '../../services/api';

interface Assignment {
  ID: string;
  ID_TACHE: string;
  STATUS: "En cours" | "Terminée" | "À venir";
  MODE_AFFECTATION: "Manuel" | "Semi-automatisé" | "Automatisé (IA)";
  DATE_AFFECTATION: string;
  ID_AUDITEURS: { ID_AUDITEUR: string; DECISION: string }[];
  ID_VEHICULE: string[];

  // Champs enrichis
  tacheNom: string;
  auditeursNoms: string;
  vehiculesInfo: string;
}

const AssignementList: React.FC = () => {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, statusFilter, modeFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await affectationAPI.getAll();
      const affectations = response.data;

      // Enrich data with task names, auditor names, and vehicle info
      const enrichedData = await Promise.all(
        affectations.map(async (aff: Assignment) => {
          let tacheNom = 'Tâche inconnue';
          let auditeursNoms = 'Aucun auditeur';
          let vehiculesInfo = '-';

          // Fetch task name
          try {
            const tacheResponse = await tacheAPI.getById(aff.ID_TACHE);
            tacheNom = tacheResponse.data.data.tache.NOM;
          } catch (error) {
            console.error(`Erreur lors du chargement de la tâche ${aff.ID_TACHE}:`, error);
          }

          // Fetch auditor names
          if (aff.ID_AUDITEURS && aff.ID_AUDITEURS.length > 0) {
            try {
              const auditeurPromises = aff.ID_AUDITEURS.map(async (auditeur: { ID_AUDITEUR: string }) => {
                try {
                  const userResponse = await userAPI.getById(auditeur.ID_AUDITEUR);
                  return `${userResponse.data.data.user.NOM} ${userResponse.data.data.user.PRENOM}`;
                } catch (error) {
                  console.error(`Erreur auditeur ${auditeur.ID_AUDITEUR}:`, error);
                  return 'Inconnu';
                }
              });
              const names = await Promise.all(auditeurPromises);
              auditeursNoms = names.join(', ');
            } catch (error) {
              console.error('Erreur lors du chargement des auditeurs:', error);
            }
          }

          // Fetch vehicle info
          if (aff.ID_VEHICULE && aff.ID_VEHICULE.length > 0) {
            try {
              const vehiculePromises = aff.ID_VEHICULE.map(async (vehId: string) => {
                try {
                  const vehResponse = await vehiculeAPI.getById(vehId);
                  const veh = vehResponse.data;
                  return `${veh.MARQUE} ${veh.MODELE} - ${veh.IMMATRICULATION}`;
                } catch (error) {
                  console.error(`Erreur véhicule ${vehId}:`, error);
                  return 'Véhicule inconnu';
                }
              });
              const vehicules = await Promise.all(vehiculePromises);
              vehiculesInfo = vehicules.join(', ');
            } catch (error) {
              console.error('Erreur lors du chargement des véhicules:', error);
            }
          }

          return {
            ...aff,
            tacheNom,
            auditeursNoms,
            vehiculesInfo
          };
        })
      );

      setAssignments(enrichedData);
    } catch (error) {
      console.error('Erreur lors du chargement des affectations:', error);
      alert('Erreur lors du chargement des données. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];

    if (searchTerm) {
      filtered = filtered.filter(aff => 
        aff.tacheNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aff.auditeursNoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aff.ID.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(aff => aff.STATUS === statusFilter);
    }

    if (modeFilter) {
      filtered = filtered.filter(aff => aff.MODE_AFFECTATION === modeFilter);
    }

    setFilteredAssignments(filtered);
  };

  const handleDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      await affectationAPI.delete(assignmentToDelete.ID);
      setAssignments(prev => prev.filter(a => a.ID !== assignmentToDelete.ID));
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      alert('Affectation supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'affectation. Veuillez réessayer.');
    }
  };

  const handleView = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const handleEdit = (id: Assignment["ID"]) => {
    // Navigate to edit page - adjust the route as needed
    navigate(`/assignment/edit/${id}`);
    setOpenMenuId(null);
  };

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const getStatusBadge = (status: Assignment["STATUS"]) => {
    const styles = {
      'En cours': 'bg-blue-100 text-blue-800',
      'Terminée': 'bg-green-100 text-green-800',
      'À venir': 'bg-yellow-100 text-yellow-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getModeBadge = (mode: Assignment["MODE_AFFECTATION"]) => {
    const styles = {
      'Manuel': 'bg-purple-100 text-purple-800',
      'Semi-automatisé': 'bg-indigo-100 text-indigo-800',
      'Automatisé (IA)': 'bg-pink-100 text-pink-800'
    };
    return styles[mode] || 'bg-gray-100 text-gray-800';
  };

  const getDecisionStats = (auditeurs: Assignment["ID_AUDITEURS"]) => {
    const accepted = auditeurs.filter(a => a.DECISION === 'Acceptée').length;
    const total = auditeurs.length;
    return `${accepted}/${total}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setModeFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-800">{assignments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">En cours</p>
            <p className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.STATUS === 'En cours').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">À venir</p>
            <p className="text-2xl font-bold text-yellow-600">
              {assignments.filter(a => a.STATUS === 'À venir').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600 mb-1">Terminées</p>
            <p className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.STATUS === 'Terminée').length}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 my-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par tâche, auditeur, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les statuts</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
                <option value="À venir">À venir</option>
              </select>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les modes</option>
                <option value="Manuel">Manuel</option>
                <option value="Semi-automatisé">Semi-automatisé</option>
                <option value="Automatisé (IA)">Automatisé (IA)</option>
              </select>

              {(searchTerm || statusFilter || modeFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-7xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500uppercase tracking-wider">Tâche</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500uppercase tracking-wider">Auditeurs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500uppercase tracking-wider">Véhicules</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white-500uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucune affectation trouvée
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <tr key={assignment.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{assignment.tacheNom}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={assignment.auditeursNoms}>
                          {assignment.auditeursNoms}
                        </div>
                        <div className="text-xs text-gray-500">{assignment.ID_AUDITEURS.length} auditeur(s)</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={assignment.vehiculesInfo}>
                          {assignment.vehiculesInfo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(assignment.DATE_AFFECTATION).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModeBadge(assignment.MODE_AFFECTATION)}`}>
                          {assignment.MODE_AFFECTATION}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === assignment.ID ? null : assignment.ID);
                          }}
                          className="p-2 rounded-full hover:bg-gray-200"
                        >
                          ⋮
                        </button>
                        {openMenuId === assignment.ID && (
                          <div className="absolute right-6 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                            <ul className="flex flex-col">
                              <li>
                                <button
                                  onClick={() => handleView(assignment)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir détails
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => handleEdit(assignment.ID)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Modifier
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => handleDeleteClick(assignment)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Affichage de {filteredAssignments.length} sur {assignments.length} affectation(s)
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  Détails de l'affectation
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* General Info */}
                <div className="border-b pb-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Informations générales</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ID Affectation</p>
                      <p className="font-medium text-gray-900">{selectedAssignment.ID}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date d'affectation</p>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(selectedAssignment.DATE_AFFECTATION).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedAssignment.STATUS)}`}>
                        {selectedAssignment.STATUS}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mode d'affectation</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getModeBadge(selectedAssignment.MODE_AFFECTATION)}`}>
                        {selectedAssignment.MODE_AFFECTATION}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Info */}
                <div className="border-b pb-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Tâche
                  </h4>
                  <div>
                    <p className="text-sm text-gray-600">Nom de la tâche</p>
                    <p className="font-medium text-gray-900">{selectedAssignment.tacheNom}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {selectedAssignment.ID_TACHE}</p>
                  </div>
                </div>

                {/* Auditors Info */}
                <div className="border-b pb-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Auditeurs ({selectedAssignment.ID_AUDITEURS.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedAssignment.ID_AUDITEURS.map((auditeur, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <span className="font-medium text-gray-900">
                          {selectedAssignment.auditeursNoms.split(', ')[index] || 'Inconnu'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          auditeur.DECISION === 'Acceptée' ? 'bg-green-100 text-green-800' :
                          auditeur.DECISION === 'Refusée' ? 'bg-red-100 text-red-800' :
                          auditeur.DECISION === 'Déléguée' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {auditeur.DECISION}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Acceptations: </span>
                    {getDecisionStats(selectedAssignment.ID_AUDITEURS)}
                  </div>
                </div>

                {/* Vehicles Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Véhicules
                  </h4>
                  <div className="text-gray-900">
                    {selectedAssignment.vehiculesInfo !== '-' ? (
                      <p className="font-medium">{selectedAssignment.vehiculesInfo}</p>
                    ) : (
                      <p className="text-gray-500 italic">Aucun véhicule assigné</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(selectedAssignment.ID);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'affectation <strong>{assignmentToDelete?.ID}</strong> pour la tâche <strong>{assignmentToDelete?.tacheNom}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignementList;