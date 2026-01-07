import React, { useState, useEffect } from 'react';
import { affectationAPI, tacheAPI, userAPI } from '../../services/api';

interface MyTask {
  id: string;
  taskName: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  status: 'Affectée' | 'En attente' | 'Créée' | 'Terminée';
  decision: 'Acceptée' | 'Refusée' | 'Déléguée' | 'En Attente';
  description: string;
  direction: string;
  specialty: string;
  grade: string;
  isRemunerated: boolean;
  remunerationAmount: string;
  hasVehicle: boolean;
  affectationId?: string;
  dateAffectation?: Date;
  isDelegation?: boolean;
  idAuditeurDelegant?: string;
  delaiRestant?: string;
}

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [justificatif, setJustificatif] = useState('');

  const [auditeurs, setAuditeurs] = useState<any[]>([]);
  const [selectedAuditeur, setSelectedAuditeur] = useState('');

  const formatPeriod = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    return `${start.toLocaleDateString('fr-FR', { day: 'numeric' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const calculerDelaiRestant = (dateAffectation: Date): string => {
    const maintenant = new Date();
    const delaiLimite = new Date(dateAffectation.getTime() + 24 * 60 * 60 * 1000);
    const diffMs = delaiLimite.getTime() - maintenant.getTime();

    if (diffMs <= 0) {
      return "Délai dépassé";
    }

    const heures = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${heures}h ${minutes}min restantes`;
  };

  const transformTaskData = (apiTask: any, affectation: any): MyTask => {
    const tache = apiTask.data?.tache || apiTask;

    return {
      id: String(tache.ID),
      affectationId: affectation.ID,
      taskName: tache.NOM || 'Sans nom',
      type: tache.TYPE || tache.type || 'Non spécifié',
      period: formatPeriod(
        tache.PERIODE_EXECUTION?.DATE_DEBUT,
        tache.PERIODE_EXECUTION?.DATE_FIN
      ),
      startDate: tache.PERIODE_EXECUTION?.DATE_DEBUT,
      endDate: tache.PERIODE_EXECUTION?.DATE_FIN,
      status: affectation.STATUS || 'En attente',
      decision: affectation.DECISION || 'En Attente',
      description: tache.DESCRIPTION || tache.description || 'Aucune description disponible',
      direction: tache.DIRECTION || tache.direction || 'Non spécifiée',
      specialty: tache.SPECIALITES_CONCERNEES?.[0] || tache.SPECIALITE || 'Non spécifiée',
      grade: tache.GRADES_CONCERNES?.[0] || tache.GRADE || 'Non spécifié',
      isRemunerated: tache.REMUNEREE || false,
      remunerationAmount: tache.MONTANT || '0',
      hasVehicle: tache.NECESSITE_VEHICULE || false,
      dateAffectation: affectation.DATE_AFFECTATION ? new Date(affectation.DATE_AFFECTATION) : undefined,
      isDelegation: !!affectation.ID_AUDITEUR_DELEGANT,
      idAuditeurDelegant: affectation.ID_AUDITEUR_DELEGANT,
      delaiRestant: affectation.DECISION === 'En Attente' && affectation.DATE_AFFECTATION
        ? calculerDelaiRestant(new Date(affectation.DATE_AFFECTATION))
        : undefined
    };
  };

  useEffect(() => {
    fetchTasks();
    fetchAuditeurs();

    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => ({
          ...task,
          delaiRestant: task.decision === 'En Attente' && task.dateAffectation
            ? calculerDelaiRestant(task.dateAffectation)
            : undefined
        }))
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchAuditeurs = async () => {
    try {
      const response = await userAPI.getAll({ role: 'USER' });
      setAuditeurs(response.data.data.users || response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement auditeurs:', err);
    }
  };

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
          return transformTaskData(taskResponse.data, affectation);
        } catch {
          return null;
        }
      });

      const tasksData = (await Promise.all(tasksPromises)).filter(Boolean);
      setTasks(tasksData);

    } catch (err: any) {
      setError('Impossible de charger les tâches.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId?: string, isDelegation?: boolean) => {
    if (!taskId) return;

    try {
      const userDataString = localStorage.getItem('user');
      if (!userDataString) return;

      const userData = JSON.parse(userDataString);
      const userId = userData.ID || userData.id;

      if (isDelegation) {
        // CORRIGÉ: accepterDelegation prend (idAuditeur, idTache)
        await affectationAPI.accepterDelegation(userId, taskId);
        alert('Délégation acceptée avec succès !');
      } else {
        // CORRIGÉ: accepterAffectation prend (idAuditeur, idTache)
        await affectationAPI.accepterAffectation(userId, taskId);
        alert('Tâche acceptée avec succès !');
      }

      await fetchTasks();
      setSelectedTask(null);
    } catch (err: any) {
      console.error('Erreur acceptation:', err);
      alert('Erreur lors de l\'acceptation.');
    }
  };

  const handleRejectTask = (taskId?: string) => {
    if (!taskId) return;
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedTask) return;

    if (!justificatif || justificatif.trim().length < 10) {
      alert('Le justificatif doit contenir au moins 10 caractères.');
      return;
    }

    try {
      const userDataString = localStorage.getItem('user');
      if (!userDataString) return;

      const userData = JSON.parse(userDataString);
      const userId = userData.ID || userData.id;

      if (selectedTask.isDelegation) {
        // CORRIGÉ: refuserDelegation prend (idAuditeur, idTache) et le justificatif est dans le body
        await affectationAPI.refuserDelegation(userId, selectedTask.id);
        alert('Délégation refusée. La tâche est considérée comme refusée par l\'auditeur initial.');
      } else {
        // CORRIGÉ: refuserAffectation prend (idAuditeur, idTache, justificatif)
        await affectationAPI.refuserAffectation(userId, selectedTask.id, justificatif);
        alert('Tâche refusée.');
      }

      setShowRejectModal(false);
      setJustificatif('');
      await fetchTasks();
      setSelectedTask(null);
    } catch (err: any) {
      console.error('Erreur refus:', err);
      alert('Erreur lors du refus.');
    }
  };

  const handleDelegateTask = (taskId?: string) => {
    if (!taskId) {
      alert('Veuillez sélectionner une tâche.');
      return;
    }
    setShowDelegateModal(true);
  };

  const confirmDelegate = async () => {
    if (!selectedTask || !selectedAuditeur) {
      alert('Veuillez sélectionner un auditeur.');
      return;
    }

    if (!justificatif || justificatif.trim().length < 10) {
      alert('Le justificatif doit contenir au moins 10 caractères.');
      return;
    }

    try {
      const userDataString = localStorage.getItem('user');
      if (!userDataString) return;

      const userData = JSON.parse(userDataString);
      const userId = userData.ID || userData.id;

      // CORRIGÉ: deleguerAffectation prend (idAuditeur, idTache, idAuditeurDelegue, justificatif)
      await affectationAPI.deleguerAffectation(
        userId,
        selectedTask.id,
        selectedAuditeur,
        justificatif
      );

      alert('Tâche déléguée avec succès ! L\'auditeur a 24h pour répondre.');
      setShowDelegateModal(false);
      setSelectedAuditeur('');
      setJustificatif('');
      await fetchTasks();
      setSelectedTask(null);
    } catch (err: any) {
      console.error('Erreur délégation:', err);
      alert('Erreur lors de la délégation.');
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

  const getDecisionBadge = (decision: string) => {
    const badges = {
      'Acceptée': 'bg-green-100 text-green-800',
      'Refusée': 'bg-red-100 text-red-800',
      'Déléguée': 'bg-purple-100 text-purple-800',
      'En Attente': 'bg-yellow-100 text-yellow-800'
    };
    return badges[decision as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = (task: MyTask) => {
    setSelectedTask(task);
  };

  const handleCloseDetails = () => {
    setSelectedTask(null);
    setShowRejectModal(false);
    setShowDelegateModal(false);
    setJustificatif('');
  };

  const filteredTasks = tasks.filter(task => {
    const taskName = task.taskName || '';
    const matchesSearch = taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statsAcceptees = tasks.filter(t => t.decision === 'Acceptée').length;
  const statsEnAttente = tasks.filter(t => t.decision === 'En Attente').length;
  const statsRefusees = tasks.filter(t => t.decision === 'Refusée').length;
  const statsDelegues = tasks.filter(t => t.decision === 'Déléguée').length;

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
              <div className="text-sm text-gray-600">Acceptées</div>
              <div className="text-2xl font-bold text-green-600">{statsAcceptees}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">En attente</div>
              <div className="text-2xl font-bold text-yellow-600">{statsEnAttente}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Refusées</div>
              <div className="text-2xl font-bold text-red-600">{statsRefusees}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Déléguées</div>
              <div className="text-2xl font-bold text-purple-600">{statsDelegues}</div>
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
              <option value="En Attente">En Attente</option>
              <option value="Acceptée">Acceptée</option>
              <option value="Refusée">Refusée</option>
              <option value="Déléguée">Déléguée</option>
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
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Décision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Délai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">

                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task, index) => (
                  <tr
                    key={`${task.id}-${index}`}
                    className={`hover:bg-gray-50 transition-colors ${selectedTask?.id === task.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="px-6 py-4">
                      <strong className="text-gray-900">{task.taskName}</strong>
                      {task.isDelegation && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Délégation
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {task.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDecisionBadge(task.decision)}`}>
                        {task.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {task.delaiRestant && (
                        <span className={`font-medium ${task.delaiRestant === 'Délai dépassé'
                          ? 'text-red-600'
                          : 'text-orange-600'
                          }`}>
                          {task.delaiRestant}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(task);
                        }}
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

      {/* Modal de détails */}
      {selectedTask && !showRejectModal && !showDelegateModal && (
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
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDecisionBadge(selectedTask.decision)}`}>
                  {selectedTask.decision}
                </span>
                {selectedTask.isDelegation && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Délégation
                  </span>
                )}
              </div>

              {selectedTask.delaiRestant && (
                <div className={`p-4 rounded-lg ${selectedTask.delaiRestant === 'Délai dépassé'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-orange-50 border border-orange-200'
                  }`}>
                  <div className="flex items-center">
                    <span className="text-2xl mr-2"></span>
                    <div>
                      <p className={`font-semibold ${selectedTask.delaiRestant === 'Délai dépassé'
                        ? 'text-red-900'
                        : 'text-orange-900'
                        }`}>
                        {selectedTask.delaiRestant}
                      </p>
                      <p className={`text-sm ${selectedTask.delaiRestant === 'Délai dépassé'
                        ? 'text-red-700'
                        : 'text-orange-700'
                        }`}>
                        {selectedTask.delaiRestant === 'Délai dépassé'
                          ? 'La tâche sera acceptée automatiquement'
                          : 'pour répondre à cette ' + (selectedTask.isDelegation ? 'délégation' : 'affectation')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Informations importantes</h3>
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
              {selectedTask.decision === 'En Attente' && (
                <>
                  <button
                    onClick={() => handleAcceptTask(selectedTask.id, selectedTask.isDelegation)}
                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  >
                    ✓ Accepter
                  </button>
                  <button
                    onClick={() => handleRejectTask(selectedTask.id)}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    ✗ Refuser
                  </button>
                  {!selectedTask.isDelegation && (
                    <button
                      onClick={() => handleDelegateTask(selectedTask.id)}
                      className="px-6 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                    >
                      ⇄ Déléguer
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de refus */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Refuser la tâche</h3>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justificatif (minimum 10 caractères)
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                value={justificatif}
                onChange={(e) => setJustificatif(e.target.value)}
                placeholder="Expliquez pourquoi vous refusez cette tâche..."
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setJustificatif('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmReject}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de délégation */}
      {showDelegateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Déléguer la tâche</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un auditeur
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedAuditeur}
                  onChange={(e) => setSelectedAuditeur(e.target.value)}
                >
                  <option value="">-- Choisir un auditeur --</option>
                  {auditeurs.map((auditeur) => (
                    <option key={auditeur.ID} value={auditeur.ID}>
                      {auditeur.NOM} {auditeur.PRENOM} - {auditeur.SPECIALITE}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justificatif (minimum 10 caractères)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  value={justificatif}
                  onChange={(e) => setJustificatif(e.target.value)}
                  placeholder="Expliquez pourquoi vous déléguez cette tâche..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDelegateModal(false);
                  setSelectedAuditeur('');
                  setJustificatif('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelegate}
                disabled={!selectedAuditeur}
                className="px-6 py-2 bg-yellow-600 text-white font-medium rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer la délégation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;