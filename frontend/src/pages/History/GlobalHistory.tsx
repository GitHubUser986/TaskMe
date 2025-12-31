import React, { useState } from 'react';

interface GlobalHistoryItem {
  id: number;
  userName: string;
  taskName: string;
  date: string;
  status: 'Affectée' | 'En attente' | 'Créée' | 'Terminée';
}

const GlobalHistory: React.FC = () => {
  const [history, setHistory] = useState<GlobalHistoryItem[]>([
    { id: 1, userName: 'Ahmed El Fassi', taskName: 'Formation React avancé', date: '2026-01-15', status: 'Terminée' },
    { id: 2, userName: 'Fatima Zahra', taskName: 'Jury PFE Info', date: '2026-01-22', status: 'En attente' },
    { id: 3, userName: 'Omar Benjelloun', taskName: 'Audit qualité', date: '2026-01-25', status: 'Terminée' },
    { id: 4, userName: 'Salma Idrissi', taskName: 'Formation gestion budgétaire', date: '2026-02-10', status: 'Affectée' },
  ]);

  const getStatusBadge = (status: string) => {
    const badges = {
      'Affectée': 'bg-green-100 text-green-800',
      'En attente': 'bg-yellow-100 text-yellow-800',
      'Créée': 'bg-blue-100 text-blue-800',
      'Terminée': 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Historique global</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tâche</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900">{item.userName}</td>
                  <td className="px-6 py-4 text-gray-900">{item.taskName}</td>
                  <td className="px-6 py-4 text-gray-700">{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun historique trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalHistory;
