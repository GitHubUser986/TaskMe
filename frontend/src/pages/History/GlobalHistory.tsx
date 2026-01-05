import React, { useState, useEffect } from 'react';
import { historiqueAPI } from '../../services/api';

interface GlobalHistoryItem {
  id: string;
  userName: string;
  taskName: string;
  date: string;
  status: string;
  type: string;
  details?: string;
  rapport?: string;
  algorithme?: string;
}

const GlobalHistory: React.FC = () => {
  const [history, setHistory] = useState<GlobalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    affectations: 0,
    algorithmes: 0,
    refus: 0,
    delegations: 0
  });

  // Charger l'historique global
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'historique avec filtres
      const response = await historiqueAPI.getAll(filters);
      
      console.log('Réponse API:', response);
      
      // Extraire les données selon le format de réponse
      const historyData = response.data?.success 
        ? response.data.data 
        : response.data;
      
      console.log('Historique reçu:', historyData);
      
      setHistory(Array.isArray(historyData) ? historyData : []);
      
      // Calculer les statistiques
      const data = Array.isArray(historyData) ? historyData : [];
      setStats({
        total: data.length,
        affectations: data.filter((h: GlobalHistoryItem) => 
          h.type === 'Affectation').length,
        algorithmes: data.filter((h: GlobalHistoryItem) => 
          h.type === 'Algorithme' || h.algorithme).length,
        refus: data.filter((h: GlobalHistoryItem) => 
          h.type === 'Refus').length,
        delegations: data.filter((h: GlobalHistoryItem) => 
          h.type === 'Délégation').length
      });

    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'historique global:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'Affectée': 'bg-green-100 text-green-800',
      'En attente': 'bg-yellow-100 text-yellow-800',
      'Créée': 'bg-blue-100 text-blue-800',
      'Terminée': 'bg-gray-100 text-gray-800',
      'En cours': 'bg-purple-100 text-purple-800',
      'N/A': 'bg-gray-100 text-gray-600'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const badges: { [key: string]: string } = {
      'Affectation': 'bg-blue-100 text-blue-800',
      'Refus': 'bg-red-100 text-red-800',
      'Délégation': 'bg-purple-100 text-purple-800',
      'Algorithme': 'bg-indigo-100 text-indigo-800',
      'Création': 'bg-teal-100 text-teal-800',
      'Modification': 'bg-orange-100 text-orange-800',
      'Validation': 'bg-green-100 text-green-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ 
      search: '', 
      startDate: '', 
      endDate: '', 
      status: '', 
      type: '' 
    });
  };

  const exportToCSV = () => {
    const headers = ['Utilisateur', 'Tâche', 'Date', 'Statut', 'Type', 'Détails'];
    const rows = history.map(item => [
      item.userName,
      item.taskName,
      new Date(item.date).toLocaleDateString('fr-FR'),
      item.status,
      item.type,
      item.details || item.rapport || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique_global_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Historique global</h1>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📥 Exporter CSV
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom ou tâche..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="Créée">Créée</option>
                <option value="Affectée">Affectée</option>
                <option value="En attente">En attente</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="Affectation">Affectation</option>
                <option value="Refus">Refus</option>
                <option value="Délégation">Délégation</option>
                <option value="Algorithme">Algorithme</option>
                <option value="Création">Création</option>
                <option value="Modification">Modification</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              🔄 Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Affectations</p>
            <p className="text-2xl font-bold text-blue-600">{stats.affectations}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Algorithmes</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.algorithmes}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Refus</p>
            <p className="text-2xl font-bold text-red-600">{stats.refus}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Délégations</p>
            <p className="text-2xl font-bold text-purple-600">{stats.delegations}</p>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tâche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900">{item.userName}</td>
                    <td className="px-6 py-4 text-gray-900">{item.taskName}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(item.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeBadge(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs">
                      <div className="space-y-1">
                        {item.algorithme && (
                          <div className="text-xs">
                            <span className="font-medium">Algo:</span> {item.algorithme}
                          </div>
                        )}
                        {(item.details || item.rapport) && (
                          <div className="text-xs truncate">
                            <span className="font-medium">Info:</span> {item.details || item.rapport}
                          </div>
                        )}
                        {!item.algorithme && !item.details && !item.rapport && '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {history.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun historique trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalHistory;