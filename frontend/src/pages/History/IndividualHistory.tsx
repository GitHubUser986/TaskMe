import React, { useState, useEffect } from 'react';
import { historiqueAPI } from '../../services/api';

interface HistoryItem {
  id: string;
  taskName: string;
  date: string;
  status: string;
  details: string;
  type: string;
  heures?: number;
  dateDebut?: string;
  dateFin?: string;
}

const IndividualHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    terminees: 0,
    enCours: 0,
    heuresTotal: 0
  });

  // Récupérer l'utilisateur connecté
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  // Charger l'historique individuel
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = getCurrentUser();
      if (!user || !user.ID) {
        setError("Utilisateur non connecté");
        return;
      }

      console.log('Chargement historique pour utilisateur:', user.ID);

      // Récupérer l'historique de l'utilisateur depuis le backend
      const response = await historiqueAPI.getByUser(user.ID, filters);
      
      const calculerHeures = (dateDebut?: string, dateFin?: string): number => {
        if (!dateDebut || !dateFin) return 0;

        const debut = new Date(dateDebut).getTime();
        const fin = new Date(dateFin).getTime();

        if (isNaN(debut) || isNaN(fin) || fin < debut) return 0;

        const diffMs = fin - debut;
        const diffHeures = diffMs / (1000 * 60 * 60);

        return Math.round(diffHeures * 100) / 100; // 2 décimales
      };


      // Transformer les données pour le format attendu
      const formattedHistory = response.data.map((item: any) => ({
        id: item.ID,
        taskName: item.NOM_TACHE || 'Tâche inconnue',
        date: item.createdAt || item.DATE_AFFECTATION,
        status: item.STATUT || 'N/A',
        details: item.DETAILS || item.RAPPORT || '-',
        type: item.ALGORITHME  || 'Affectation',
        heures: calculerHeures(item.DATE_DEBUT, item.DATE_FIN),
        dateDebut: item.DATE_DEBUT,
        dateFin: item.DATE_FIN
      }));

      setHistory(formattedHistory);

      // Calculer les statistiques
      setStats({
        total: formattedHistory.length,
        terminees: formattedHistory.filter((h: HistoryItem) => 
          h.status === 'En Attente').length,
        enCours: formattedHistory.filter((h: HistoryItem) => 
          h.status === 'Acceptée' || h.status === 'En cours').length,
        heuresTotal: formattedHistory.reduce((sum: number, h: HistoryItem) => 
          sum + (h.heures || 0), 0)
      });

    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'Acceptée': 'bg-green-100 text-green-800',
      'En Attente': 'bg-yellow-100 text-yellow-800',
      'Refusée': 'bg-red-100 text-blue-800',
      'Déléguée': 'bg-purple-100 text-gray-800',
      'N/A': 'bg-gray-100 text-gray-600'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const badges: { [key: string]: string } = {
      'Manuel': 'bg-blue-100 text-blue-800',
      'Semi-automatisé': 'bg-purple-200 text-purple-800',
      'Automatisé': 'bg-green-100 text-green-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', status: '', type: '' });
  };

  const exportToCSV = () => {
    const headers = ['Tâche', 'Date', 'Statut', 'Type', 'Heures', 'Période'];
    const rows = history.map(item => [
      item.taskName,
      new Date(item.date).toLocaleDateString('fr-FR'),
      item.status,
      item.type,
      item.heures || 0,
      item.dateDebut && item.dateFin 
        ? `${new Date(item.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(item.dateFin).toLocaleDateString('fr-FR')}`
        : '-',
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
    link.download = `historique_individuel_${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-3xl font-bold text-gray-800">Mon historique</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="En Attente">En Attente</option>
                <option value="Acceptée">Acceptée</option>
                <option value="Refusée">Réfusée</option>
                <option value="Déléguée">Déléguée</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                🔄 Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Total tâches</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">En Attente</p>
            <p className="text-2xl font-bold text-blue-600">{stats.terminees}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Acceptée</p>
            <p className="text-2xl font-bold text-green-600">{stats.enCours}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">Heures totales</p>
            <p className="text-2xl font-bold text-purple-600">{stats.heuresTotal}h</p>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Tâche
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Mode d'affectation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Heures
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-gray-900 font-medium">{item.taskName}</div>
                        {item.dateDebut && item.dateFin && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(item.dateDebut).toLocaleDateString('fr-FR')} - {new Date(item.dateFin).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(item.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
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
                    <td className="px-6 py-4 text-gray-700">{item.heures || 0}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {history.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">Aucun historique trouvé</p>
            <p className="text-gray-400 text-sm mt-2">
              Vos tâches assignées apparaîtront ici
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualHistory;