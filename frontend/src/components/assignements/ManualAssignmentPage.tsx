import React from 'react';

const ManualAssignmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">Affectation Manuelle</h1>
      <p className="mb-6 text-gray-700">
        Ici, le coordinateur affecte directement chaque tâche aux auditeurs (cas urgents ou spécifiques).
      </p>
      {/* Ici tu peux ajouter tableau interactif pour assigner chaque tâche */}
    </div>
  );
};

export default ManualAssignmentPage;
