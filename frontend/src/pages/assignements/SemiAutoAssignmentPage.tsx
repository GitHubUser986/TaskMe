import { useState, useEffect } from 'react';
import { Search, Users, Car, CheckCircle, XCircle, AlertTriangle, FileText, Loader, RefreshCw } from 'lucide-react';
import { affectationAPI, tacheAPI } from '../../services/api';

// Types
interface Tache {
  ID: string;
  NOM: string;
  DESCRIPTION: string;
  TYPE: string;
  NOMBRE_PLACES: number;
  DIRECTION: string;
  REMUNEREE : boolean;
  NECESSITE_VEHICULE: boolean;
  GRADES_CONCERNES?: string[];
  SPECIALITES_CONCERNEES?: string[];
  PERIODE_EXECUTION?: {
    DATE_DEBUT: string;
    DATE_FIN: string;
  };
}

interface Proposition {
  tache: {
    id: string;
    nom: string;
    nombrePlaces: number;
  };
  auditeurs: {
    id: string;
    nom: string;
    grade: string;
    specialite: string;
    tachesRemunerees: number;
    score: number;
  }[];
  vehicules: {
    id: string;
    marque: string;
    modele: string;
    immatriculation: string;
    capacite: number;
  }[];
  details: {
    candidatsEvalues: number;
    candidatsCompatibles: number;
    candidatsDisponibles: number;
  };
  rapport: string;
}

const SemiAutoAssignmentPage = () => {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [selectedTache, setSelectedTache] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTaches, setLoadingTaches] = useState(true);
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [showRapport, setShowRapport] = useState(false);

  // Charger les tâches disponibles depuis la base de données
  useEffect(() => {
    chargerTaches();
  }, []);

    // Fonction utilitaire pour extraire le message d'erreur
  const extraireMessageErreur = (err: any): string => {
    // Si l'erreur contient une réponse de l'API
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    
    // Si l'erreur contient des détails
    if (err.response?.data?.error) {
      return err.response.data.error;
    }
    
    // Gestion des codes d'erreur HTTP
    if (err.response?.status) {
      switch (err.response.status) {
        case 400:
          return 'Requête invalide. Veuillez vérifier les données saisies.';
        case 401:
          return 'Non autorisé. Veuillez vous reconnecter.';
        case 403:
          return 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
        case 404:
          return 'Ressource non trouvée. La tâche ou les données demandées n\'existent pas.';
        case 500:
          return 'Erreur serveur. Veuillez réessayer plus tard.';
        default:
          return `Erreur HTTP ${err.response.status}. Veuillez contacter l'administrateur.`;
      }
    }
    
    // Si l'erreur a un message générique
    if (err.message) {
      return err.message;
    }
    
    // Erreur par défaut
    return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
  };

const chargerTaches = async () => {
    setLoadingTaches(true);
    try {
      // Charger toutes les tâches
      const responseTaches = await tacheAPI.getAll();
      
      // Charger toutes les affectations pour filtrer les tâches déjà affectées
      const responseAffectations = await affectationAPI.getAll();
      
      // Extraire les IDs des tâches déjà affectées
      const tachesAffecteesIds = new Set(
        responseAffectations.data.map((affectation: any) => affectation.ID_TACHE)
      );
      
      // Filtrer les tâches pour ne garder que celles qui ne sont pas affectées
      const tachesDisponibles = responseTaches.data.data.taches.filter(
        (tache: Tache) => !tachesAffecteesIds.has(tache.ID)
      );
      
      console.log('Tâches chargées:', responseTaches.data.length);
      console.log('Tâches déjà affectées:', tachesAffecteesIds.size);
      console.log('Tâches disponibles:', tachesDisponibles.length);
      
      setTaches(tachesDisponibles);
    } catch (err) {
      console.error('Erreur chargement tâches:', err);
      setError(extraireMessageErreur(err));
    } finally {
      setLoadingTaches(false);
    }
  };

  const genererAffectation = async () => {
    if (!selectedTache) {
      setError('Veuillez sélectionner une tâche');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setProposition(null);

    try {
      console.log('Génération pour tâche:', selectedTache);
      const response = await affectationAPI.generateSemiAuto({ idTache: selectedTache });
      console.log('Réponse génération:', response.data);
      
      if (response.data.success) {
        setProposition(response.data.proposition);
        setSuccess('Proposition générée avec succès !');
      } else {
        setError(response.data.message || 'Erreur lors de la génération');
      }
    } catch (err : unknown) {
      if (err instanceof Error) {
        console.error('Erreur génération:', err);
        const errorMessage = err.message || 'Erreur lors de la génération';
        setError(extraireMessageErreur(err));
        // Afficher les détails si disponibles
        if (err.message) {
          console.log('Détails:', err.message);
      } 
      
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmerAffectation = async () => {
    setLoading(true);
    setError('');

    try {
      if (!proposition) {
        return null; 
      }

      const auditeursIds = proposition.auditeurs.map(a => a.id);
      const vehiculesIds = proposition.vehicules.map(v => v.id);

      console.log('Confirmation affectation:', {
        idTache: proposition.tache.id,
        auditeursIds,
        vehiculesIds
      });

      const response = await affectationAPI.confirmSemiAuto({
        idTache: proposition.tache.id,
        auditeursIds,
        vehiculesIds,
        rapport: proposition.rapport
      });

      console.log('Réponse confirmation:', response.data);

      if (response.data.success) {
        setSuccess(`Affectation confirmée avec succès ! ${response.data.notificationsCreees} notification(s) envoyée(s).`);
        
        // Réinitialiser après 3 secondes
        setTimeout(() => {
          setProposition(null);
          setSelectedTache('');
          setSuccess('');
          chargerTaches(); // Recharger les tâches
        }, 3000);
      }
    } catch (err : unknown) {
      if (err instanceof Error) {
        console.error('Erreur confirmation:', err);
        setError(extraireMessageErreur(err));

      }
    } finally {
      setLoading(false);
    }
  };

  const annulerProposition = () => {
    setProposition(null);
    setSuccess('');
    setError('');
  };

  // Trouver la tâche sélectionnée
  const tacheSelectionnee = taches.find(t => t.ID === selectedTache);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Affectation Semi-automatique
              </h1>
              <p className="text-gray-600">
                L'algorithme propose automatiquement les meilleures affectations selon des critères prédéfinis
              </p>
            </div>
            <button
              onClick={chargerTaches}
              disabled={loadingTaches}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTaches ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Critères de l'algorithme */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Critères d'affectation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Tour de rôle par ancienneté</p>
                <p className="text-sm text-gray-600">Les auditeurs les plus anciens sont prioritaires</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Compatibilité de spécialité</p>
                <p className="text-sm text-gray-600">Affectation selon les compétences requises</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Rémunération équitable</p>
                <p className="text-sm text-gray-600">Prioriser les auditeurs avec moins de tâches rémunérées</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Disponibilité temporelle</p>
                <p className="text-sm text-gray-600">Éviter les chevauchements de tâches</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'alerte */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
            <XCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Erreur</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Sélection de la tâche */}
        {!proposition && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-500" />
              Sélectionner une tâche
            </h2>
            
            {loadingTaches ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">Chargement des tâches...</span>
              </div>
            ) : taches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune tâche disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tâche à affecter ({taches.length} disponible{taches.length > 1 ? 's' : ''})
                  </label>
                  <select
                    value={selectedTache ?? ''}
                    onChange={(e) => setSelectedTache(e.target.value || null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">-- Sélectionnez une tâche --</option>
                    {taches.map((tache) => (
                      <option key={tache.ID} value={tache.ID}>
                        {tache.NOM} - {tache.NOMBRE_PLACES} place{tache.NOMBRE_PLACES > 1 ? 's' : ''} 
                        {tache.PERIODE_EXECUTION?.DATE_DEBUT && ` - Du ${new Date(tache.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Détails de la tâche sélectionnée */}
                {tacheSelectionnee && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">Détails de la tâche</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">ID:</span>
                        <span className="ml-2 text-blue-900">{tacheSelectionnee.ID}</span>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Places:</span>
                        <span className="ml-2 text-blue-900">{tacheSelectionnee.NOMBRE_PLACES}</span>
                      </div>
                      {tacheSelectionnee.PERIODE_EXECUTION && (
                        <>
                          <div>
                            <span className="text-blue-700 font-medium">Début:</span>
                            <span className="ml-2 text-blue-900">
                              {new Date(tacheSelectionnee.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">Fin:</span>
                            <span className="ml-2 text-blue-900">
                              {new Date(tacheSelectionnee.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                      {tacheSelectionnee.SPECIALITES_CONCERNEES && tacheSelectionnee.SPECIALITES_CONCERNEES.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-blue-700 font-medium">Spécialités:</span>
                          <span className="ml-2 text-blue-900">
                            {tacheSelectionnee.SPECIALITES_CONCERNEES.join(', ')}
                          </span>
                        </div>
                      )}
                      {tacheSelectionnee.GRADES_CONCERNES && tacheSelectionnee.GRADES_CONCERNES.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-blue-700 font-medium">Grades:</span>
                          <span className="ml-2 text-blue-900">
                            {tacheSelectionnee.GRADES_CONCERNES.join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-blue-700 font-medium">Véhicule requis:</span>
                        <span className="ml-2 text-blue-900">
                          {tacheSelectionnee.NECESSITE_VEHICULE ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-blue-700 font-medium">Rémunérée:</span>
                        <span className="ml-2 text-blue-900">
                          {tacheSelectionnee.REMUNEREE ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={genererAffectation}
                  disabled={!selectedTache || loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Générer l'affectation automatique
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Proposition d'affectation */}
        {proposition && (
          <div className="space-y-6">
            {/* Informations de la tâche */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Proposition d'affectation
              </h2>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-blue-900">{proposition.tache.nom}</p>
                <p className="text-sm text-blue-700">ID: {proposition.tache.id}</p>
                <p className="text-sm text-blue-700">Places: {proposition.tache.nombrePlaces}</p>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{proposition.details.candidatsEvalues}</p>
                  <p className="text-xs text-gray-600">Candidats évalués</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{proposition.details.candidatsCompatibles}</p>
                  <p className="text-xs text-gray-600">Compatibles</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">{proposition.details.candidatsDisponibles}</p>
                  <p className="text-xs text-gray-600">Disponibles</p>
                </div>
              </div>
            </div>

            {/* Auditeurs sélectionnés */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Auditeurs sélectionnés ({proposition.auditeurs.length})
              </h3>
              <div className="space-y-3">
                {proposition.auditeurs.map((auditeur, index) => (
                  <div key={auditeur.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                            #{index + 1}
                          </span>
                          <p className="font-semibold text-gray-800">{auditeur.nom}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Spécialité:</span> {auditeur.specialite}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Grade:</span> {auditeur.grade}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Tâches rémunérées:</span> {auditeur.tachesRemunerees}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Score:</span> {auditeur.score.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Véhicules sélectionnés */}
            {proposition.vehicules.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-purple-500" />
                  Véhicules sélectionnés ({proposition.vehicules.length})
                </h3>
                <div className="space-y-3">
                  {proposition.vehicules.map((vehicule) => (
                    <div key={vehicule.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {vehicule.marque} {vehicule.modele}
                          </p>
                          <p className="text-sm text-gray-600">
                            Immatriculation: {vehicule.immatriculation}
                          </p>
                          <p className="text-sm text-gray-600">
                            Capacité: {vehicule.capacite} places
                          </p>
                        </div>
                        <Car className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rapport détaillé */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={() => setShowRapport(!showRapport)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  Rapport détaillé de l'algorithme
                </h3>
                <span className="text-gray-500">
                  {showRapport ? '▼' : '▶'}
                </span>
              </button>
              {showRapport && (
                <pre className="mt-4 bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {proposition.rapport}
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  En confirmant, l'affectation sera enregistrée dans la base de données, un historique sera créé et des notifications seront envoyées aux auditeurs. 
                  Vous pourrez toujours l'annuler par la suite si nécessaire.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={confirmerAffectation}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirmer l'affectation
                    </>
                  )}
                </button>
                <button
                  onClick={annulerProposition}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemiAutoAssignmentPage;