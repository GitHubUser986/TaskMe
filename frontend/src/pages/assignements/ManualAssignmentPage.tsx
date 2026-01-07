import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Users, Car, FileText, AlertTriangle, Download, X } from 'lucide-react';
import { tacheAPI, affectationAPI } from '../../services/api';

// Types
interface Tache {
  ID: string;
  NOM: string;
  DESCRIPTION: string;
  TYPE: string;
  NOMBRE_PLACES: number;
  DIRECTION: string;
  NECESSITE_VEHICULE: boolean;
  GRADES_CONCERNES?: string[];
  SPECIALITES_CONCERNEES?: string[];
  PERIODE_EXECUTION?: {
    DATE_DEBUT: string;
    DATE_FIN: string;
  };
}

interface Auditeur {
  ID: string;
  NOM: string;
  PRENOM: string;
  GRADE: string;
  SPECIALITE: string;
}

interface Vehicule {
  ID: string;
  MARQUE: string;
  MODELE: string;
  IMMATRICULATION: string;
  CAPACITE: number;
}

interface Contrainte {
  type: string;
  message: string;
  details?: any;
}

interface ValidationResponse {
  success: boolean;
  valide: boolean;
  contraintesNonRespectees: Contrainte[];
  placesRestantes: number;
  tache: {
    id: string;
    nom: string;
    nombrePlaces: number;
  };
}

const ManualAssignmentInterface = () => {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [selectedTacheId, setSelectedTacheId] = useState<string>('');
  const [tache, setTache] = useState<Tache | null>(null);
  const [auditeurs, setAuditeurs] = useState<Auditeur[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [selectedAuditeurs, setSelectedAuditeurs] = useState<string[]>([]);
  const [selectedVehicules, setSelectedVehicules] = useState<string[]>([]);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTaches();
  }, []);

  useEffect(() => {
    if (selectedTacheId) {
      fetchDataForTask(selectedTacheId);
    }
  }, [selectedTacheId]);

  const fetchTaches = async () => {
    try {
      const response = await tacheAPI.getAll();
      setTaches(response.data.data.taches);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      setError('Impossible de charger les tâches');
    }
  };

  const fetchDataForTask = async (idTache: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await affectationAPI.getManualData(idTache);
      const data = response.data;

      if (data.success) {
        setTache(data.tache);
        setAuditeurs(data.auditeurs);
        setVehicules(data.vehicules);
        setSelectedAuditeurs([]);
        setSelectedVehicules([]);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAuditeurToggle = (auditeurId: string) => {
    setSelectedAuditeurs(prev =>
      prev.includes(auditeurId)
        ? prev.filter(id => id !== auditeurId)
        : [...prev, auditeurId]
    );
  };

  const handleVehiculeToggle = (vehiculeId: string) => {
    setSelectedVehicules(prev =>
      prev.includes(vehiculeId)
        ? prev.filter(id => id !== vehiculeId)
        : [...prev, vehiculeId]
    );
  };

  const validateAffectation = async () => {
    if (selectedAuditeurs.length === 0) {
      alert('Veuillez sélectionner au moins un auditeur');
      return;
    }

    try {
      const response = await affectationAPI.validateManual({
        idTache: selectedTacheId,
        auditeursIds: selectedAuditeurs,
        vehiculesIds: selectedVehicules
      });

      setValidation(response.data);
      setShowValidation(true);
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation');
    }
  };

  const submitAffectation = async () => {
    if (!validation || !validation.success) return;

    setSubmitting(true);
    try {
      const response = await affectationAPI.createManual({
        idTache: selectedTacheId,
        auditeursIds: selectedAuditeurs,
        vehiculesIds: selectedVehicules
      });

      const data = response.data;

      if (data.success) {
        alert('Affectation créée avec succès! Un rapport a été généré dans l\'historique.');
        setShowValidation(false);
        setSelectedTacheId('');
        setTache(null);
        setSelectedAuditeurs([]);
        setSelectedVehicules([]);
      } else {
        alert('Erreur: ' + data.message);
      }
    } catch (error) {
      console.error('Erreur soumission:', error);
      alert('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadRapport = () => {
    if (!validation || !tache) return;

    const rapport = validation.contraintesNonRespectees.length === 0
      ? '=== RAPPORT D\'AFFECTATION MANUELLE ===\n\n✓ Toutes les contraintes sont respectées.'
      : `=== RAPPORT D'AFFECTATION MANUELLE ===\n\nTâche: ${tache.NOM}\n\n⚠ CONTRAINTES NON RESPECTÉES:\n\n${validation.contraintesNonRespectees.map((c, i) =>
        `${i + 1}. ${c.type.toUpperCase()}\n   ${c.message}\n   ${JSON.stringify(c.details, null, 2)}`
      ).join('\n\n')}`;

    const blob = new Blob([rapport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_affectation_${selectedTacheId}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (error && !tache) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchTaches}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const placesRestantes = tache ? tache.NOMBRE_PLACES - selectedAuditeurs.length : 0;
  const capaciteTotale = selectedVehicules.reduce((sum, vId) => {
    const v = vehicules.find(vehic => vehic.ID === vId);
    return sum + (v?.CAPACITE || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Affectation Manuelle</h1>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner une tâche
            </label>
            <select
              value={selectedTacheId}
              onChange={(e) => setSelectedTacheId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choisir une tâche --</option>
              {taches.map(t => (
                <option key={t.ID} value={t.ID}>
                  {t.NOM} - {t.TYPE} ({t.NOMBRE_PLACES} places)
                </option>
              ))}
            </select>
          </div>
        </div>

        {tache && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{tache.NOM}</h2>
              <p className="text-gray-600 mb-4">{tache.DESCRIPTION}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Type:</span> {tache.TYPE}
                </div>
                <div>
                  <span className="font-semibold">Places:</span> {tache.NOMBRE_PLACES}
                </div>
                <div>
                  <span className="font-semibold">Direction:</span> {tache.DIRECTION}
                </div>
                <div>
                  <span className="font-semibold">Véhicule requis:</span> {tache.NECESSITE_VEHICULE ? 'Oui' : 'Non'}
                </div>
              </div>
              {tache.PERIODE_EXECUTION && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-semibold">Période:</span> {new Date(tache.PERIODE_EXECUTION.DATE_DEBUT).toLocaleDateString()} - {new Date(tache.PERIODE_EXECUTION.DATE_FIN).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-lg border-2 ${placesRestantes < 0
                ? 'bg-red-100 border-red-500'
                : placesRestantes === 0
                  ? 'bg-green-100 border-green-500'
                  : 'bg-blue-100 border-blue-500'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">Places restantes:</span>
                </div>
                <span className={`text-2xl font-bold ${placesRestantes < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {placesRestantes} / {tache.NOMBRE_PLACES}
                </span>
              </div>
              {placesRestantes < 0 && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Vous avez sélectionné {Math.abs(placesRestantes)} auditeur(s) de trop!
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Auditeurs ({selectedAuditeurs.length} sélectionné(s))
                  </h2>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto space-y-2">
                  {auditeurs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucun auditeur disponible</p>
                  ) : (
                    auditeurs.map(auditeur => {
                      const isSelected = selectedAuditeurs.includes(auditeur.ID);
                      const gradeOk = !tache.GRADES_CONCERNES?.length || tache.GRADES_CONCERNES.includes(auditeur.GRADE);
                      const specialiteOk = !tache.SPECIALITES_CONCERNEES?.length || tache.SPECIALITES_CONCERNEES.includes(auditeur.SPECIALITE);
                      const compatible = gradeOk && specialiteOk;

                      return (
                        <div
                          key={auditeur.ID}
                          onClick={() => handleAuditeurToggle(auditeur.ID)}
                          className={`p-3 rounded border-2 cursor-pointer transition ${isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{auditeur.NOM} {auditeur.PRENOM}</div>
                              <div className="text-sm text-gray-600">
                                Grade: {auditeur.GRADE} | {auditeur.SPECIALITE}
                              </div>
                            </div>
                            {!compatible && (
                              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          {!compatible && (
                            <div className="mt-2 text-xs text-orange-600">
                              {!gradeOk && <div>Grade non compatible</div>}
                              {!specialiteOk && <div>Spécialité non compatible</div>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Véhicules ({selectedVehicules.length} sélectionné(s))
                  </h2>
                  {selectedVehicules.length > 0 && (
                    <div className="text-sm mt-1">
                      Capacité totale: <span className={`font-semibold ${capaciteTotale < selectedAuditeurs.length ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {capaciteTotale} / {selectedAuditeurs.length} requis
                      </span>
                    </div>
                  )}
                  {tache.NECESSITE_VEHICULE && selectedVehicules.length === 0 && (
                    <div className="text-sm mt-1 text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Véhicule requis pour cette tâche
                    </div>
                  )}
                </div>
                <div className="p-4 max-h-96 overflow-y-auto space-y-2">
                  {vehicules.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucun véhicule disponible</p>
                  ) : (
                    vehicules.map(vehicule => {
                      const isSelected = selectedVehicules.includes(vehicule.ID);

                      return (
                        <div
                          key={vehicule.ID}
                          onClick={() => handleVehiculeToggle(vehicule.ID)}
                          className={`p-3 rounded border-2 cursor-pointer transition ${isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="font-medium">{vehicule.MARQUE} {vehicule.MODELE}</div>
                          <div className="text-sm text-gray-600">
                            {vehicule.IMMATRICULATION} | Capacité: {vehicule.CAPACITE} places
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={validateAffectation}
              disabled={selectedAuditeurs.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Valider l'affectation
            </button>
          </>
        )}

        {showValidation && validation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {validation.valide ? (
                    <>
                      <CheckCircle className="text-green-600 w-7 h-7" />
                      Validation réussie
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-orange-600 w-7 h-7" />
                      Contraintes non respectées
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setShowValidation(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {validation.valide ? (
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <p className="text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Toutes les vérifications sont passées. Vous pouvez soumettre l'affectation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-orange-50 border border-orange-200 rounded p-4">
                      <p className="font-semibold text-orange-800 mb-2">
                        Les contraintes suivantes ne sont pas respectées:
                      </p>
                    </div>

                    {validation.contraintesNonRespectees.map((contrainte, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-semibold text-red-900">{contrainte.type}</div>
                            <div className="text-red-800 text-sm mt-1">{contrainte.message}</div>
                            {contrainte.details && (
                              <pre className="text-xs bg-white p-2 rounded mt-2 overflow-x-auto">
                                {JSON.stringify(contrainte.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-gray-50 border rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold">Résumé</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Tâche: {tache?.NOM}</div>
                    <div>Auditeurs sélectionnés: {selectedAuditeurs.length}</div>
                    <div>Véhicules sélectionnés: {selectedVehicules.length}</div>
                    <div>Places restantes: {validation.placesRestantes}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={downloadRapport}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le rapport
                </button>
                <button
                  onClick={() => setShowValidation(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={submitAffectation}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : 'Confirmer et créer l\'affectation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualAssignmentInterface;