import { useState, useEffect } from 'react';
import { Search, Users, Car, CheckCircle, XCircle, AlertTriangle, FileText, Loader, RefreshCw, Brain, TrendingUp, Calendar, Award } from 'lucide-react';
import { affectationAPI, tacheAPI } from '../../services/api';

// Types
interface Tache {
  ID: string;
  NOM: string;
  DESCRIPTION: string;
  TYPE: string;
  NOMBRE_PLACES: number;
  DIRECTION: string;
  REMUNEREE: boolean;
  NECESSITE_VEHICULE: boolean;
  GRADES_CONCERNES?: string[];
  SPECIALITES_CONCERNEES?: string[];
  PERIODE_EXECUTION?: {
    DATE_DEBUT: string;
    DATE_FIN: string;
  };
}

interface Auditeur {
  id: string;
  nom: string;
  grade: string;
  specialite: string;
  tachesRemunerees: number;
  score: number;
  historique?: {
    totalTaches: number;
    tauxAcceptation: number;
    derniereTache: string;
  };
  compatibilite?: {
    specialite: number;
    grade: number;
    disponibilite: number;
    charge: number;
  };
}

interface Vehicule {
  id: string;
  marque: string;
  modele: string;
  immatriculation: string;
  capacite: number;
}

interface PropositionIA {
  tache: {
    id: string;
    nom: string;
    nombrePlaces: number;
  };
  auditeurs: Auditeur[];
  vehicules: Vehicule[];
  details: {
    candidatsEvalues: number;
    candidatsCompatibles: number;
    candidatsDisponibles: number;
  };
  analyse: {
    conflitsPotentiels: number;
    surchargesDetectees: number;
    tauxConfiance: number;
    recommandations: string[];
  };
  rapport: string;
}

const AutoAssignmentPage = () => {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [selectedTache, setSelectedTache] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTaches, setLoadingTaches] = useState(true);
  const [proposition, setProposition] = useState<PropositionIA | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [showRapport, setShowRapport] = useState(false);

  useEffect(() => {
    chargerTaches();
  }, []);

  const extraireMessageErreur = (err: any): string => {
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.response?.data?.error) {
      return err.response.data.error;
    }
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
    if (err.message) {
      return err.message;
    }
    return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
  };

  const chargerTaches = async () => {
    setLoadingTaches(true);
    try {
      const responseTaches = await tacheAPI.getAll();
      const responseAffectations = await affectationAPI.getAll();
      
      const tachesAffecteesIds = new Set(
        responseAffectations.data.map((affectation: any) => affectation.ID_TACHE)
      );
      
      const tachesDisponibles = responseTaches.data.data.taches.filter(
        (tache: Tache) => !tachesAffecteesIds.has(tache.ID)
      );
      
      setTaches(tachesDisponibles);
    } catch (err) {
      console.error('Erreur chargement tâches:', err);
      setError(extraireMessageErreur(err));
    } finally {
      setLoadingTaches(false);
    }
  };

  const genererAffectationIA = async () => {
    if (!selectedTache) {
      setError('Veuillez sélectionner une tâche');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setProposition(null);

    try {
      console.log('Génération IA pour tâche:', selectedTache);
      const response = await affectationAPI.generateAuto({ idTache: selectedTache });
      console.log('Réponse génération IA:', response.data);
      
      if (response.data.success) {
        setProposition(response.data.proposition);
        setSuccess('Proposition générée avec succès par l\'IA !');
      } else {
        setError(response.data.message || 'Erreur lors de la génération');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Erreur génération IA:', err);
        setError(extraireMessageErreur(err));
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

      const response = await affectationAPI.confirmAuto({
        idTache: proposition.tache.id,
        auditeursIds,
        vehiculesIds,
        rapport: proposition.rapport
      });

      if (response.data.success) {
        setSuccess(`Affectation confirmée avec succès ! ${response.data.notificationsCreees} notification(s) envoyée(s).`);
        
        setTimeout(() => {
          setProposition(null);
          setSelectedTache('');
          setSuccess('');
          chargerTaches();
        }, 3000);
      }
    } catch (err: unknown) {
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

  const tacheSelectionnee = taches.find(t => t.ID === selectedTache);

  const getConfidenceColor = (taux: number) => {
    if (taux >= 85) return 'text-green-600 bg-green-100';
    if (taux >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Brain className="w-10 h-10 text-purple-600 mr-3" />
                <h1 className="text-4xl font-bold text-gray-800">
                  Affectation Automatique (IA)
                </h1>
              </div>
              <p className="text-gray-600 ml-13">
                L'intelligence artificielle analyse en profondeur l'historique, les compétences et la disponibilité pour optimiser les affectations
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

        {/* Critères IA */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Brain className="w-6 h-6 mr-2" />
            Critères d'analyse de l'IA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">Historique des affectations</p>
                <p className="text-sm text-purple-100">Analyse des performances passées et taux d'acceptation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">Compatibilité profil/tâche</p>
                <p className="text-sm text-purple-100">Matching avancé des compétences et spécialités</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">Détection des chevauchements</p>
                <p className="text-sm text-purple-100">Identification automatique des conflits temporels</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">Équilibrage de charge</p>
                <p className="text-sm text-purple-100">Prévention des surcharges et distribution équitable</p>
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
              <Search className="w-5 h-5 mr-2 text-purple-600" />
              Sélectionner une tâche pour analyse IA
            </h2>
            
            {loadingTaches ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-8 h-8 animate-spin text-purple-600" />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                {tacheSelectionnee && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-2">Détails de la tâche</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-purple-700 font-medium">ID:</span>
                        <span className="ml-2 text-purple-900">{tacheSelectionnee.ID}</span>
                      </div>
                      <div>
                        <span className="text-purple-700 font-medium">Places:</span>
                        <span className="ml-2 text-purple-900">{tacheSelectionnee.NOMBRE_PLACES}</span>
                      </div>
                      {tacheSelectionnee.PERIODE_EXECUTION && (
                        <>
                          <div>
                            <span className="text-purple-700 font-medium">Début:</span>
                            <span className="ml-2 text-purple-900">
                              {new Date(tacheSelectionnee.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-purple-700 font-medium">Fin:</span>
                            <span className="ml-2 text-purple-900">
                              {new Date(tacheSelectionnee.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                      {tacheSelectionnee.SPECIALITES_CONCERNEES && tacheSelectionnee.SPECIALITES_CONCERNEES.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-purple-700 font-medium">Spécialités:</span>
                          <span className="ml-2 text-purple-900">
                            {tacheSelectionnee.SPECIALITES_CONCERNEES.join(', ')}
                          </span>
                        </div>
                      )}
                      {tacheSelectionnee.GRADES_CONCERNES && tacheSelectionnee.GRADES_CONCERNES.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-purple-700 font-medium">Grades:</span>
                          <span className="ml-2 text-purple-900">
                            {tacheSelectionnee.GRADES_CONCERNES.join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-purple-700 font-medium">Véhicule requis:</span>
                        <span className="ml-2 text-purple-900">
                          {tacheSelectionnee.NECESSITE_VEHICULE ? 'Oui' : 'Non'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-purple-700 font-medium">Rémunérée:</span>
                        <span className="ml-2 text-purple-900">
                          {tacheSelectionnee.REMUNEREE ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={genererAffectationIA}
                  disabled={!selectedTache || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Analyse IA en cours...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Générer l'affectation avec l'IA
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Proposition IA */}
        {proposition && (
          <div className="space-y-6">
            {/* Analyse IA */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-purple-600" />
                  Analyse IA de l'affectation
                </h2>
                <div className={`px-4 py-2 rounded-full font-semibold ${getConfidenceColor(proposition.analyse.tauxConfiance)}`}>
                  Confiance: {proposition.analyse.tauxConfiance}%
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-purple-900 mb-2">{proposition.tache.nom}</p>
                <p className="text-sm text-purple-700">ID: {proposition.tache.id} • Places: {proposition.tache.nombrePlaces}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{proposition.details.candidatsEvalues}</p>
                  <p className="text-xs text-blue-700">Évalués</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{proposition.details.candidatsCompatibles}</p>
                  <p className="text-xs text-green-700">Compatibles</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{proposition.analyse.conflitsPotentiels}</p>
                  <p className="text-xs text-yellow-700">Conflits</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{proposition.analyse.surchargesDetectees}</p>
                  <p className="text-xs text-red-700">Surcharges</p>
                </div>
              </div>

              {proposition.analyse.recommandations.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Recommandations de l'IA
                  </h4>
                  <ul className="space-y-1">
                    {proposition.analyse.recommandations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-yellow-800">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Auditeurs sélectionnés */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Auditeurs sélectionnés par l'IA ({proposition.auditeurs.length})
              </h3>
              <div className="space-y-3">
                {proposition.auditeurs.map((auditeur, index) => (
                  <div key={auditeur.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                            #{index + 1}
                          </span>
                          <p className="font-semibold text-gray-800">{auditeur.nom}</p>
                          <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Score: {auditeur.score.toFixed(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <p className="text-gray-600">
                            <span className="font-medium">Spécialité:</span> {auditeur.specialite}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Grade:</span> {auditeur.grade}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Tâches rémunérées:</span> {auditeur.tachesRemunerees || 0}
                          </p>
                        </div>
                        {auditeur.historique && (
                          <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                            <p><span className="font-medium">Historique:</span> {auditeur.historique.totalTaches} tâches • Acceptation: {auditeur.historique.tauxAcceptation}%</p>
                          </div>
                        )}
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    </div>
                    {auditeur.compatibilite && (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${auditeur.compatibilite.specialite}%` }}></div>
                          </div>
                          <p className="mt-1 text-gray-600">Spécialité</p>
                        </div>
                        <div className="text-center">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${auditeur.compatibilite.grade}%` }}></div>
                          </div>
                          <p className="mt-1 text-gray-600">Grade</p>
                        </div>
                        <div className="text-center">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500" style={{ width: `${auditeur.compatibilite.disponibilite}%` }}></div>
                          </div>
                          <p className="mt-1 text-gray-600">Dispo</p>
                        </div>
                        <div className="text-center">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${auditeur.compatibilite.charge}%` }}></div>
                          </div>
                          <p className="mt-1 text-gray-600">Charge</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Véhicules */}
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
                            {vehicule.immatriculation} • Capacité: {vehicule.capacite} places
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
                  Rapport détaillé de l'IA
                </h3>
                <span className="text-gray-500">{showRapport ? '▼' : '▶'}</span>
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
                  L'IA a analysé {proposition.details.candidatsEvalues} candidats et recommande cette affectation avec un taux de confiance de {proposition.analyse.tauxConfiance}%. 
                  En confirmant, l'affectation sera enregistrée dans la base de données, un historique sera créé et des notifications seront envoyées aux auditeurs.
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
                      Confirmer l'affectation IA
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

export default AutoAssignmentPage;