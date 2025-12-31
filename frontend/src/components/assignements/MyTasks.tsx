import React, { useState } from 'react';

interface MyTask {
  id: number;
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
  const [tasks, setTasks] = useState<MyTask[]>([
    {
      id: 1,
      taskName: 'Formation React avancé',
      type: 'Formateur',
      period: '15-20 Jan 2026',
      startDate: '2026-01-15',
      endDate: '2026-01-20',
      status: 'Affectée',
      description: 'Formation intensive sur React.js avancé incluant les hooks, le state management avec Redux, et les tests unitaires.',
      direction: 'Rabat - Casa',
      specialty: 'Pédagogique',
      grade: 'Grade A',
      isRemunerated: true,
      remunerationAmount: '5000',
      hasVehicle: true
    },
    {
      id: 2,
      taskName: 'Jury PFE Info',
      type: 'Membre jury',
      period: '22 Jan 2026',
      startDate: '2026-01-22',
      endDate: '2026-01-22',
      status: 'En attente',
      description: 'Participation au jury d\'évaluation des projets de fin d\'études en informatique.',
      direction: 'Meknès - Errachidia',
      specialty: 'Pédagogique',
      grade: 'Grade A',
      isRemunerated: false,
      remunerationAmount: '',
      hasVehicle: false
    },
    {
      id: 3,
      taskName: 'Audit qualité',
      type: 'Observateur',
      period: '25-28 Jan 2026',
      startDate: '2026-01-25',
      endDate: '2026-01-28',
      status: 'Créée',
      description: 'Audit qualité des processus pédagogiques et administratifs de l\'établissement.',
      direction: 'Marrakech - Agadir',
      specialty: 'Planification',
      grade: 'Grade B',
      isRemunerated: true,
      remunerationAmount: '3500',
      hasVehicle: true
    },
    {
      id: 4,
      taskName: 'Formation gestion budgétaire',
      type: 'Bénéficiaire',
      period: '10-12 Fév 2026',
      startDate: '2026-02-10',
      endDate: '2026-02-12',
      status: 'Affectée',
      description: 'Formation continue sur la gestion budgétaire et le contrôle financier.',
      direction: 'Rabat - Casa',
      specialty: 'Services financiers',
      grade: 'Grade B',
      isRemunerated: false,
      remunerationAmount: '',
      hasVehicle: false
    },
    {
      id: 5,
      taskName: 'Évaluation des compétences',
      type: 'Concepteur',
      period: '5 Mars 2026',
      startDate: '2026-03-05',
      endDate: '2026-03-05',
      status: 'Terminée',
      description: 'Conception et validation des grilles d\'évaluation des compétences.',
      direction: 'Meknès - Errachidia',
      specialty: 'Orientation',
      grade: 'Grade A',
      isRemunerated: true,
      remunerationAmount: '2500',
      hasVehicle: false
    }
  ]);

  const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
    setSelectedTask(task);
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom de la tâche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
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
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
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

          {filteredTasks.length === 0 && (
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
                    {selectedTask.hasVehicle ? '✓ Véhicule fourni' : '✗ Pas de véhicule'}
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