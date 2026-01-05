import React, { useState, useEffect } from 'react';
import { affectationAPI, tacheAPI } from '../../services/api';

interface MyTask {
  id: string;
  taskName: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  status: 'Affectée' | 'En attente' | 'Créée' | 'Terminée';
  description: string;
  direction: string;
  specialty: string;
  grade: string;
  isRemunerated: boolean;
  remunerationAmount: string;
  hasVehicle: boolean;
}

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPeriod = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    return `${start.toLocaleDateString('fr-FR', { day: 'numeric'})} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

const transformTaskData = (apiTask: any): MyTask => {
  const tache = apiTask.data?.tache || apiTask; // si data.tache existe, on l'utilise, sinon fallback

  return {
    id: String(tache.ID),
    taskName: tache.NOM || 'Sans nom',
    type: tache.TYPE || tache.type || 'Non spécifié',
    period: formatPeriod(
      tache.PERIODE_EXECUTION?.DATE_DEBUT,
      tache.PERIODE_EXECUTION?.DATE_FIN
    ),
    startDate: tache.PERIODE_EXECUTION?.DATE_DEBUT,
    endDate: tache.PERIODE_EXECUTION?.DATE_FIN,
    status: apiTask.STATUS || 'Affectée',
    description: tache.DESCRIPTION || tache.description || 'Aucune description disponible',
    direction: tache.DIRECTION || tache.direction || 'Non spécifiée',
    specialty: tache.SPECIALITES_CONCERNEES?.[0] || tache.SPECIALITE || tache.specialty || 'Non spécifiée',
    grade: tache.GRADES_CONCERNES?.[0] || tache.GRADE || tache.grade || 'Non spécifié',
    isRemunerated: tache.REMUNEREE || tache.EST_REMUNERE || tache.estRemunere || tache.isRemunerated || false,
    remunerationAmount: tache.MONTANT || tache.MONTANT_REMUNERATION || tache.montantRemuneration || tache.remunerationAmount || '0',
    hasVehicle: tache.NECESSITE_VEHICULE || tache.VEHICULE_FOURNI || tache.vehiculeFourni || tache.hasVehicle || false
  };
};


useEffect(() => {
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const userDataString = localStorage.getItem('user');
      if (!userDataString) {
        setError('Utilisateur non connecté.');
        return;
      }

      const userData = JSON.parse(userDataString);
      const userId = userData.ID || userData.id;
      if (!userId) {
        setError('ID utilisateur introuvable.');
        return;
      }

      const response = await affectationAPI.getAll();

      const userAffectations = response.data.filter(
        (affectation: any) =>
          Array.isArray(affectation.ID_AUDITEUR) &&
          affectation.ID_AUDITEUR.includes(userId)
      );

      const tasksPromises = userAffectations.map(async (affectation: any) => {
        try {
          const taskResponse = await tacheAPI.getById(affectation.ID_TACHE);
          return {
            ...taskResponse.data,
            STATUT: affectation.STATUS
          };
        } catch {
          return null;
        }
      });

      const tasksData = (await Promise.all(tasksPromises)).filter(Boolean);
      console.log(tasksData)
      setTasks(tasksData.map(transformTaskData));

    } catch (err: any) {
      setError('Impossible de charger les tâches.');
    } finally {
      setLoading(false);
    }
  };

  fetchTasks();
}, []);


  const fetchTaskDetails = async (taskId: string) => {
    try {
      const response = await tacheAPI.getById(taskId);
      const detailedTask = transformTaskData(response.data);
      setSelectedTask(detailedTask);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des détails:', err);
      alert('Impossible de charger les détails de la tâche.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'Affectée': 'bg-green-100 text-green-800',
      'En attente': 'bg-yellow-100 text-yellow-800',
      'Créée': 'bg-blue-100 text-blue-800',
      'Terminée': 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (task: MyTask) => {
    fetchTaskDetails(task.id);
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    const taskName = task.taskName || '';
    const matchesSearch = taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-600 text-center mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Erreur</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Mes tâches assignées</h1>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Total tâches</div>
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Affectées</div>
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'Affectée').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">En attente</div>
              <div className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'En attente').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Terminées</div>
              <div className="text-2xl font-bold text-gray-600">
                {tasks.filter(t => t.status === 'Terminée').length}
              </div>
            </div>
          </div>
          <br />
          
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-80"
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-56"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="Affectée">Affectée</option>
              <option value="En attente">En attente</option>
              <option value="Créée">Créée</option>
              <option value="Terminée">Terminée</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Nom de la tâche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Période
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
                {filteredTasks.map((task, index) => (
                  <tr key={`${task.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="text-gray-900">{task.taskName}</strong>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {task.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {task.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(task)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucune tâche trouvée</p>
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCloseDetails}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedTask.taskName}</h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
                <p className="text-gray-700">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Type de tâche</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {selectedTask.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Direction</h3>
                  <p className="text-gray-700">{selectedTask.direction}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Date de début</h3>
                  <p className="text-gray-700">{new Date(selectedTask.startDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Date de fin</h3>
                  <p className="text-gray-700">{new Date(selectedTask.endDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Spécialité</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {selectedTask.specialty}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Grade requis</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {selectedTask.grade}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Rémunération</h3>
                  <p className="text-gray-700 font-medium">
                    {selectedTask.isRemunerated 
                      ? `💰 ${selectedTask.remunerationAmount} MAD` 
                      : '❌ Non rémunérée'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Véhicule</h3>
                  <p className="text-gray-700 font-medium">
                    {selectedTask.hasVehicle ? '✔ Véhicule fourni' : '✗ Pas de véhicule'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Informations importantes</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Assurez-vous d'être disponible pendant toute la période</li>
                  <li>• Vous recevrez une confirmation par email</li>
                  <li>• Contactez l'administration en cas d'empêchement</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={handleCloseDetails}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Fermer
              </button>
              {selectedTask.status === 'En attente' && (
                <button
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  onClick={() => alert('Tâche acceptée !')}
                >
                  ✓ Accepter la tâche
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;