import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ModeSelectionPage: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (!selectedMode) {
      alert('Veuillez sélectionner un mode d\'affectation.');
      return;
    }

    // Redirection vers la page dédiée selon le mode
    if (selectedMode === 'Manuelle') navigate('/assignment/manual');
    if (selectedMode === 'Semi-automatique') navigate('/assignment/semi-auto');
    if (selectedMode === 'Automatique') navigate('/assignment/auto');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Affectation des auditeurs</h1>
         <div className="cursor-pointer w-6/12 p-4 rounded-lg shadow-md transition-colors border-l-4 border-purple-400 my-6 bg-white hover:bg-gray-50"
        onClick={() => navigate('/assignment/list')}>

        <div className="text-xl font-semibold my-2">
          Voir les affectations
          <div className="text-gray-600 text-sm">
            Consultez et gérer tous les affectations
          </div>
        </div>
      </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded-md mb-6">
          Sélectionnez un mode d'affectation pour distribuer les tâches aux auditeurs.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['Automatique', 'Semi-automatique', 'Manuelle'].map((mode) => (
            <div
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`cursor-pointer p-6 rounded-lg shadow-md transition-colors border ${
                selectedMode === mode
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-xl font-semibold mb-2">{mode}</div>
              <div className="text-gray-600 text-sm">
                {mode === 'Automatique' &&
                  "L'algorithme attribue les tâches optimalement selon les disponibilités et compétences des auditeurs."}
                {mode === 'Semi-automatique' &&
                  "L'algorithme propose des affectations que vous pouvez ajuster manuellement avant validation."}
                {mode === 'Manuelle' &&
                  "Vous choisissez et affectez manuellement chaque tâche aux auditeurs de votre choix."}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Confirmer le mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectionPage;
