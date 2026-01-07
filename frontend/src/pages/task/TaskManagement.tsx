import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tacheAPI } from '../../services/api';

interface Task {
  _id?: string;
  ID: string;
  NOM: string;
  TYPE: string;
  DESCRIPTION: string;
  PERIODE_EXECUTION: {
    DATE_DEBUT: string;
    DATE_FIN: string;
  };
  DIRECTION: string;
  NOMBRE_PLACES: number;
  COMMUNE_OU_PARTICULIERE: string;
  SPECIALITES_CONCERNEES: string[];
  GRADES_CONCERNES: string[];
  REMUNEREE: boolean;
  MONTANT: number;
  NECESSITE_VEHICULE: boolean;
}

const TaskManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tacheAPI.getAll();

      setTasks(response.data.data.taches);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des tâches');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (task: Task): 'En cours' | 'Terminée' | 'À venir' => {
    const now = new Date();
    const startDate = new Date(task.PERIODE_EXECUTION.DATE_DEBUT);
    const endDate = new Date(task.PERIODE_EXECUTION.DATE_FIN);

    if (now > endDate) return 'Terminée';
    if (now >= startDate && now <= endDate) return 'En cours';
    return 'À venir';
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'Formateur': 'Formateur',
      'Membre de jury': 'Membre de jury',
      'Bénéficiaire de formation': 'Bénéficiaire',
      'Observateur': 'Observateur',
      'Concepteur d\'évaluation': 'Concepteur'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'En cours': 'bg-blue-100 text-blue-800',
      'Terminée': 'bg-gray-100 text-gray-800',
      'À venir': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDirectionLabel = (direction: string) => {
    const directions: { [key: string]: string } = {
      'ligne Rabat-Casa': 'Rabat - Casa',
      'ligne Meknès-Errachidia': 'Meknès - Errachidia',
      'ligne Marrakech-Agadir': 'Marrakech - Agadir'
    };
    return directions[direction] || direction;
  };

  const filteredTasks = tasks.filter(task => {
    const status = getTaskStatus(task);
    const matchesSearch = task.NOM.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === '' || task.TYPE === filterType;
    const matchesStatus = filterStatus === '' || status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      NOM: task.NOM,
      DESCRIPTION: task.DESCRIPTION,
      TYPE: task.TYPE,
      PERIODE_EXECUTION: task.PERIODE_EXECUTION,
      DIRECTION: task.DIRECTION,
      NOMBRE_PLACES: task.NOMBRE_PLACES,
      COMMUNE_OU_PARTICULIERE: task.COMMUNE_OU_PARTICULIERE,
      SPECIALITES_CONCERNEES: task.SPECIALITES_CONCERNEES,
      GRADES_CONCERNES: task.GRADES_CONCERNES,
      REMUNEREE: task.REMUNEREE,
      MONTANT: task.MONTANT,
      NECESSITE_VEHICULE: task.NECESSITE_VEHICULE
    });
    setSelectedTask(null);
  };

  const handleCloseEdit = () => {
    setEditingTask(null);
    setFormData({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Task] as any),
          [child]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (field: 'SPECIALITES_CONCERNEES' | 'GRADES_CONCERNES', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.ID) return;

    try {
      setSubmitting(true);
      await tacheAPI.update(editingTask.ID, formData);
      await fetchTasks();
      handleCloseEdit();
      alert('Tâche modifiée avec succès');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la modification de la tâche');
      console.error('Erreur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      await tacheAPI.delete(taskId);
      await fetchTasks();
      setSelectedTask(null);
      alert('Tâche supprimée avec succès');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression de la tâche');
      console.error('Erreur:', err);
    }
  };

  const taskStats = {
    total: tasks.length,
    enCours: tasks.filter(t => getTaskStatus(t) === 'En cours').length,
    aVenir: tasks.filter(t => getTaskStatus(t) === 'À venir').length,
    terminees: tasks.filter(t => getTaskStatus(t) === 'Terminée').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Gestion des tâches</h1>

            <button
              onClick={() => navigate('/create-task')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
            >
              Nouvelle tâche
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Total tâches</div>
              <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">En cours</div>
              <div className="text-2xl font-bold text-blue-600">{taskStats.enCours}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">À venir</div>
              <div className="text-2xl font-bold text-green-600">{taskStats.aVenir}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Terminées</div>
              <div className="text-2xl font-bold text-gray-600">{taskStats.terminees}</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <input
              type="text"
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80"
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-56"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="Formateur">Formateur</option>
              <option value="Membre de jury">Membre de jury</option>
              <option value="Bénéficiaire de formation">Bénéficiaire</option>
              <option value="Observateur">Observateur</option>
              <option value="Concepteur d'évaluation">Concepteur</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-56"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="À venir">À venir</option>
              <option value="Terminée">Terminée</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const status = getTaskStatus(task);
            return (
              <div key={task._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex-1">{task.NOM}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Type:</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {getTypeLabel(task.TYPE)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">📍 Direction:</span>
                    <span>{getDirectionLabel(task.DIRECTION)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">📅 Période:</span>
                    <span>
                      {new Date(task.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString('fr-FR')} - {new Date(task.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">👥 Places:</span>
                    <span className="font-bold text-blue-600">{task.NOMBRE_PLACES}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">💰</span>
                    <span>{task.REMUNEREE ? `${task.MONTANT} MAD` : 'Non rémunérée'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">🚗</span>
                    <span>{task.NECESSITE_VEHICULE ? 'Véhicule fourni' : 'Pas de véhicule'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewDetails(task)}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Voir les détails
                </button>
              </div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">Aucune tâche trouvée</p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseDetails}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedTask.NOM}</h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(getTaskStatus(selectedTask))}`}>
                  {getTaskStatus(selectedTask)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
                <p className="text-gray-700">{selectedTask.DESCRIPTION}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Type</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {getTypeLabel(selectedTask.TYPE)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Direction</h3>
                  <p className="text-gray-700">{getDirectionLabel(selectedTask.DIRECTION)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Date de début</h3>
                  <p className="text-gray-700">
                    {new Date(selectedTask.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString('fr-FR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Date de fin</h3>
                  <p className="text-gray-700">
                    {new Date(selectedTask.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString('fr-FR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Nombre de places</h3>
                  <p className="text-2xl font-bold text-blue-600">{selectedTask.NOMBRE_PLACES}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Type de spécialité</h3>
                  <p className="text-gray-700">{selectedTask.COMMUNE_OU_PARTICULIERE}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Spécialités concernées</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.SPECIALITES_CONCERNEES.map((spec, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Grades concernés</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.GRADES_CONCERNES.map((grade, index) => (
                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {grade}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Rémunération</h3>
                  <p className="text-gray-700 font-medium">
                    {selectedTask.REMUNEREE ? `${selectedTask.MONTANT} MAD` : 'Non rémunérée'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Véhicule</h3>
                  <p className="text-gray-700 font-medium">
                    {selectedTask.NECESSITE_VEHICULE ? '✓ Véhicule fourni' : '✗ Pas de véhicule'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={handleCloseDetails}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => handleEditTask(selectedTask)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Modifier la tâche
              </button>
              <button
                onClick={() => selectedTask.ID && handleDeleteTask(selectedTask.ID)}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseEdit}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Modifier la tâche</h2>
              <button
                onClick={handleCloseEdit}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la tâche *</label>
                  <input
                    type="text"
                    name="NOM"
                    value={formData.NOM || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    name="TYPE"
                    value={formData.TYPE || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="Formateur">Formateur</option>
                    <option value="Membre de jury">Membre de jury</option>
                    <option value="Bénéficiaire de formation">Bénéficiaire de formation</option>
                    <option value="Observateur">Observateur</option>
                    <option value="Concepteur d'évaluation">Concepteur d'évaluation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="DESCRIPTION"
                  value={formData.DESCRIPTION || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de début *</label>
                  <input
                    type="date"
                    name="PERIODE_EXECUTION.DATE_DEBUT"
                    value={formData.PERIODE_EXECUTION?.DATE_DEBUT?.split('T')[0] || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin *</label>
                  <input
                    type="date"
                    name="PERIODE_EXECUTION.DATE_FIN"
                    value={formData.PERIODE_EXECUTION?.DATE_FIN?.split('T')[0] || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Direction *</label>
                  <select
                    name="DIRECTION"
                    value={formData.DIRECTION || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner une direction</option>
                    <option value="ligne Rabat-Casa">Rabat - Casa</option>
                    <option value="ligne Meknès-Errachidia">Meknès - Errachidia</option>
                    <option value="ligne Marrakech-Agadir">Marrakech - Agadir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de places *</label>
                  <input
                    type="number"
                    name="NOMBRE_PLACES"
                    value={formData.NOMBRE_PLACES || ''}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de spécialité *</label>
                <select
                  name="COMMUNE_OU_PARTICULIERE"
                  value={formData.COMMUNE_OU_PARTICULIERE || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Commune">Commune</option>
                  <option value="Particulière">Particulière</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialités concernées (séparées par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.SPECIALITES_CONCERNEES?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('SPECIALITES_CONCERNEES', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pédagogique, Orientation, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grades concernés (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.GRADES_CONCERNES?.join(', ') || ''}
                  onChange={(e) => handleArrayChange('GRADES_CONCERNES', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Grade A, Grade B, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="REMUNEREE"
                    checked={formData.REMUNEREE || false}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">Tâche rémunérée</label>
                </div>

                {formData.REMUNEREE && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant (MAD)</label>
                    <input
                      type="number"
                      name="MONTANT"
                      value={formData.MONTANT || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="NECESSITE_VEHICULE"
                  checked={formData.NECESSITE_VEHICULE || false}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Véhicule nécessaire</label>
              </div>

              <div className="border-t border-gray-200 pt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;