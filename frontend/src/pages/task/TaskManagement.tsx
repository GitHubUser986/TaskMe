import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: number;
  taskName: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  direction: string;
  places: number;
  specialtyType: string;
  specialties: string[];
  grades: string[];
  isRemunerated: boolean;
  remunerationAmount: string;
  hasVehicle: boolean;
  status: 'En cours' | 'Terminée' | 'À venir';
}

const TaskManagement: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      taskName: 'Formation React.js',
      type: 'formateur',
      description: 'Formation intensive sur React.js pour les enseignants',
      startDate: '2025-01-15',
      endDate: '2025-01-20',
      direction: 'rabat-casa',
      places: 5,
      specialtyType: 'Particulière',
      specialties: ['Pédagogique'],
      grades: ['Grade A', 'Grade B'],
      isRemunerated: true,
      remunerationAmount: '5000',
      hasVehicle: true,
      status: 'À venir'
    },
    {
      id: 2,
      taskName: 'Jury Baccalauréat 2025',
      type: 'jury',
      description: 'Participation au jury du baccalauréat section sciences',
      startDate: '2025-01-05',
      endDate: '2025-01-10',
      direction: 'meknes-errachidia',
      places: 10,
      specialtyType: 'Commune',
      specialties: ['Pédagogique', 'Orientation'],
      grades: ['Grade A', 'Grade B', 'Grade C'],
      isRemunerated: false,
      remunerationAmount: '',
      hasVehicle: false,
      status: 'En cours'
    },
    {
      id: 3,
      taskName: 'Observation des pratiques',
      type: 'observateur',
      description: 'Observation et évaluation des pratiques pédagogiques',
      startDate: '2024-12-20',
      endDate: '2024-12-28',
      direction: 'marrakech-agadir',
      places: 3,
      specialtyType: 'Particulière',
      specialties: ['Pédagogique', 'Planification'],
      grades: ['Grade A'],
      isRemunerated: true,
      remunerationAmount: '3500',
      hasVehicle: true,
      status: 'Terminée'
    },
    {
      id: 4,
      taskName: 'Formation continue - Gestion budgétaire',
      type: 'beneficiaire',
      description: 'Formation sur la gestion budgétaire des établissements',
      startDate: '2025-02-01',
      endDate: '2025-02-05',
      direction: 'rabat-casa',
      places: 15,
      specialtyType: 'Commune',
      specialties: ['Services financiers', 'Planification'],
      grades: ['Grade B', 'Grade C'],
      isRemunerated: false,
      remunerationAmount: '',
      hasVehicle: false,
      status: 'À venir'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      formateur: 'Formateur',
      jury: 'Membre de jury',
      beneficiaire: 'Bénéficiaire',
      observateur: 'Observateur',
      concepteur: 'Concepteur'
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
      'rabat-casa': 'Rabat - Casa',
      'meknes-errachidia': 'Meknès - Errachidia',
      'marrakech-agadir': 'Marrakech - Agadir'
    };
    return directions[direction] || direction;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === '' || task.type === filterType;
    const matchesStatus = filterStatus === '' || task.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
  };

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
              ➕ Nouvelle tâche
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Total tâches</div>
            <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">En cours</div>
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'En cours').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">À venir</div>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'À venir').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">Terminées</div>
            <div className="text-2xl font-bold text-gray-600">
              {tasks.filter(t => t.status === 'Terminée').length}
            </div>
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
              <option value="formateur">Formateur</option>
              <option value="jury">Membre de jury</option>
              <option value="beneficiaire">Bénéficiaire</option>
              <option value="observateur">Observateur</option>
              <option value="concepteur">Concepteur</option>
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
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex-1">{task.taskName}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Type:</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                    {getTypeLabel(task.type)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">📍 Direction:</span>
                  <span>{getDirectionLabel(task.direction)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">📅 Période:</span>
                  <span>{new Date(task.startDate).toLocaleDateString('fr-FR')} - {new Date(task.endDate).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">👥 Places:</span>
                  <span className="font-bold text-blue-600">{task.places}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">💰</span>
                  <span>{task.isRemunerated ? `${task.remunerationAmount} MAD` : 'Non rémunérée'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">🚗</span>
                  <span>{task.hasVehicle ? 'Véhicule fourni' : 'Pas de véhicule'}</span>
                </div>
              </div>

              <button
                onClick={() => handleViewDetails(task)}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Voir les détails
              </button>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">Aucune tâche trouvée</p>
          </div>
        )}

        
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Type</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {getTypeLabel(selectedTask.type)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Direction</h3>
                  <p className="text-gray-700">{getDirectionLabel(selectedTask.direction)}</p>
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Nombre de places</h3>
                  <p className="text-2xl font-bold text-blue-600">{selectedTask.places}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Type de spécialité</h3>
                  <p className="text-gray-700">{selectedTask.specialtyType}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Spécialités concernées</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.specialties.map((spec, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Grades concernés</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.grades.map((grade, index) => (
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
                    {selectedTask.isRemunerated 
                      ? `${selectedTask.remunerationAmount} MAD` 
                      : 'Non rémunérée'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Véhicule</h3>
                  <p className="text-gray-700 font-medium">
                    {selectedTask.hasVehicle ? '✓ Véhicule fourni' : '✗ Pas de véhicule'}
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
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Modifier la tâche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;