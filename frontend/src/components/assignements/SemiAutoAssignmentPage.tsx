import React from 'react';

const SemiAutoAssignmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">Affectation Semi-automatique</h1>
      <p className="mb-4 text-gray-700">
        L'algorithme propose des affectations selon :
      </p>
      <ul className="list-disc list-inside text-gray-600 mb-6">
        <li>Tour de rôle (initialement par ancienneté)</li>
        <li>Spécialité (tâches affectées selon la spécialité)</li>
        <li>Rémunération équitable</li>
        <li>Éviter les chevauchements temporels</li>
      </ul>
      {/* Ici tu peux ajouter prévisualisation et validation par le coordinateur */}
    </div>
  );
};

export default SemiAutoAssignmentPage;
