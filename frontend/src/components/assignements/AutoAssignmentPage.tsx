import React from 'react';

const AutoAssignmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">Affectation Automatique (IA)</h1>
      <p className="mb-4 text-gray-700">
        Affectation via IA selon :
      </p>
      <ul className="list-disc list-inside text-gray-600 mb-6">
        <li>Mêmes critères que semi-automatique mais plus approfondis</li>
        <li>Historique des affectations</li>
        <li>Compatibilité profil/tâche</li>
        <li>Détection des chevauchements et surcharges</li>
      </ul>
      {/* Ajouter résultats automatiques, rapport et validation */}
    </div>
  );
};

export default AutoAssignmentPage;
