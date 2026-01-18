import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader, Users, Car, Calendar, FileText, X } from 'lucide-react';
import { affectationAPI, tacheAPI, userAPI, vehiculeAPI } from '../../services/api';

interface Auditeur {
  ID_AUDITEUR: string;
  DECISION: string;
  JUSTIFICATIF_REFUS?: string;
  ID_AUDITEUR_DELEGUE?: string;
  JUSTIFICATIF_DELEGATION?: string;
  DATE_LIMITE_REPONSE_DELEGATION?: Date;
  DATE_REPONSE?: Date;
  REPONSE_DANS_DELAI?: boolean;
}

interface Assignment {
  ID: string;
  ID_TACHE: string;
  STATUS: "En cours" | "Terminée" | "À venir";
  MODE_AFFECTATION: "Manuel" | "Semi-automatisé" | "Automatisé (IA)";
  DATE_AFFECTATION: string;
  ID_AUDITEURS: Auditeur[];
  ID_VEHICULE: string[];
}

interface User {
  ID: string;
  NOM: string;
  PRENOM: string;
  EMAIL: string;
  GRADE: string;
  SPECIALITE: string;
}

interface Vehicle {
  ID: string;
  IMMATRICULATION: string;
  MARQUE: string;
  MODELE: string;
  DISPONIBLE: boolean;
  CAPACITE: number;
}

interface Task {
  ID: string;
  NOM: string;
  DESCRIPTION: string;
  TYPE: string;
}

const AssignmentEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [status, setStatus] = useState<Assignment['STATUS']>('À venir');
  const [dateAffectation, setDateAffectation] = useState('');

  useEffect(() => {
    if (id) {
      fetchAssignmentData();
    }
  }, [id]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);

      // Fetch assignment
      const assignmentResponse = await affectationAPI.getAssignement(id!);
      const assignmentData = assignmentResponse.data;
      setAssignment(assignmentData);

      // Fetch task
      const taskResponse = await tacheAPI.getById(assignmentData.ID_TACHE);
      setTask(taskResponse.data.data.tache);

      // Fetch all users
      const usersResponse = await userAPI.getAll();
      setAllUsers(usersResponse.data.data.users || usersResponse.data);

      // Fetch all vehicles
      const vehiclesResponse = await vehiculeAPI.getAll();
      setAllVehicles(vehiclesResponse.data);

      // Set initial values
      setSelectedAuditors(assignmentData.ID_AUDITEURS.map((a: Auditeur) => a.ID_AUDITEUR));
      setSelectedVehicles(assignmentData.ID_VEHICULE || []);
      setStatus(assignmentData.STATUS);
      setDateAffectation(new Date(assignmentData.DATE_AFFECTATION).toISOString().split('T')[0]);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
     
    } finally {
      setLoading(false);
    }
  };

  const handleAuditorToggle = (auditorId: string) => {
    setSelectedAuditors(prev => {
      if (prev.includes(auditorId)) {
        return prev.filter(id => id !== auditorId);
      } else {
        return [...prev, auditorId];
      }
    });
  };

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAuditors.length === 0) {
      alert('Veuillez sélectionner au moins un auditeur');
      return;
    }

    try {
      setSaving(true);

      // Prepare updated data
      const updatedData = {
        STATUS: status,
        DATE_AFFECTATION: new Date(dateAffectation),
        ID_VEHICULE: selectedVehicles,
        ID_AUDITEURS: selectedAuditors.map(auditorId => {
          // Find existing auditor data to preserve their decision
          const existingAuditor = assignment?.ID_AUDITEURS.find(a => a.ID_AUDITEUR === auditorId);
          
          if (existingAuditor) {
            return existingAuditor;
          } else {
            // New auditor added
            return {
              ID_AUDITEUR: auditorId,
              DECISION: 'En Attente'
            };
          }
        })
      };

      await affectationAPI.update(id!, updatedData);
      alert('Affectation mise à jour avec succès');
      navigate('/assignment/list');

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = allUsers.find(u => u.ID === userId);
    return user ? `${user.NOM} ${user.PRENOM}` : 'Inconnu';
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = allVehicles.find(v => v.ID === vehicleId);
    return vehicle ? `${vehicle.MARQUE} ${vehicle.MODELE} - ${vehicle.IMMATRICULATION}` : 'Inconnu';
  };

  const getAuditorDecision = (auditorId: string) => {
    const auditor = assignment?.ID_AUDITEURS.find(a => a.ID_AUDITEUR === auditorId);
    return auditor?.DECISION || 'En Attente';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!assignment || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Affectation non trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/assignment/list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux affectations
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Modifier l'affectation</h1>
          <p className="text-gray-600 mt-1">ID: {assignment.ID}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Info (Read-only) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Tâche associée</h2>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="font-medium text-gray-900">{task.NOM}</p>
              <p className="text-sm text-gray-600 mt-1">{task.DESCRIPTION}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-gray-600">
                  <strong>Type:</strong> {task.TYPE}
                </span>
                <span className="text-gray-600">
                  <strong>ID:</strong> {task.ID}
                </span>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Informations générales</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'affectation
                </label>
                <input
                  type="date"
                  value={dateAffectation}
                  onChange={(e) => setDateAffectation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Assignment['STATUS'])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="À venir">À venir</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode d'affectation
                </label>
                <input
                  type="text"
                  value={assignment.MODE_AFFECTATION}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Auditors Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Auditeurs</h2>
              </div>
              <span className="text-sm text-gray-600">
                {selectedAuditors.length} sélectionné(s)
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allUsers.map((user) => {
                const isSelected = selectedAuditors.includes(user.ID);
                const decision = getAuditorDecision(user.ID);
                
                return (
                  <div
                    key={user.ID}
                    className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleAuditorToggle(user.ID)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.NOM} {user.PRENOM}
                        </p>
                        <p className="text-sm text-gray-600">
                          {user.SPECIALITE} - Grade {user.GRADE}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        decision === 'Acceptée' ? 'bg-green-100 text-green-800' :
                        decision === 'Refusée' ? 'bg-red-100 text-red-800' :
                        decision === 'Déléguée' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {decision}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedAuditors.length === 0 && (
              <p className="text-red-600 text-sm mt-2">
                Veuillez sélectionner au moins un auditeur
              </p>
            )}
          </div>

          {/* Vehicles Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Véhicules</h2>
              </div>
              <span className="text-sm text-gray-600">
                {selectedVehicles.length} sélectionné(s)
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allVehicles.map((vehicle) => {
                const isSelected = selectedVehicles.includes(vehicle.ID);
                
                return (
                  <div
                    key={vehicle.ID}
                    className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${!vehicle.DISPONIBLE ? 'opacity-50' : ''}`}
                    onClick={() => vehicle.DISPONIBLE && handleVehicleToggle(vehicle.ID)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={!vehicle.DISPONIBLE}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.MARQUE} {vehicle.MODELE}
                        </p>
                        <p className="text-sm text-gray-600">
                          {vehicle.IMMATRICULATION} - Capacité: {vehicle.CAPACITE} places
                        </p>
                      </div>
                    </div>
                    {!vehicle.DISPONIBLE && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Non disponible
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {allVehicles.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucun véhicule disponible</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/assignment/list')}
              disabled={saving}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || selectedAuditors.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentEditPage;