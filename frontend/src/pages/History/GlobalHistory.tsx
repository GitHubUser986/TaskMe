import React, { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { affectationAPI, tacheAPI, userAPI } from '../../services/api';

interface GlobalHistoryItem {
  id: string;
  idTache?: string;
  idAuditeur?: string;
  userName: string;
  taskName: string;
  date: string;
  status: string;
  type: string;
  details?: string;
  source?: string;
}

interface RapportPDF {
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Tache {
  ID: string;
  NOM: string;
  [key: string]: any;
}

interface User {
  ID: string;
  PRENOM: string;
  NOM: string;
  [key: string]: any;
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
  const [rapportsMap, setRapportsMap] = useState<Map<string, RapportPDF>>(new Map());

  // Charger l'historique global depuis les affectations
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les affectations qui servent d'historique
      const response = await affectationAPI.getAll();
      const affectations = response.data;

      // Transformer les affectations en éléments d'historique
      const historyItems: GlobalHistoryItem[] = [];

      affectations.forEach((affectation: any) => {
        // Pour chaque auditeur dans l'affectation, créer une entrée d'historique
        if (affectation.ID_AUDITEURS && Array.isArray(affectation.ID_AUDITEURS)) {
          affectation.ID_AUDITEURS.forEach((auditeur: any) => {
            historyItems.push({
              id: affectation.ID,
              idTache: affectation.ID_TACHE,
              idAuditeur: auditeur.ID_AUDITEUR,
              userName: 'Auditeur', // Will be resolved later
              taskName: 'Tâche', // Will be resolved later
              date: affectation.DATE_AFFECTATION,
              status: auditeur.DECISION || 'En Attente',
              type: affectation.MODE_AFFECTATION || 'Manuel',
              details: `Affectation ${affectation.MODE_AFFECTATION}`,
              source: 'affectation'
            });
          });
        }
      });

      // Charger les rapports PDF
      await loadRapportsPDF();

      // Enrichir avec les noms des tâches et des utilisateurs
      const enrichedHistory = await enrichHistoryWithNames(historyItems);

      // Appliquer les filtres
      const filteredHistory = applyFilters(enrichedHistory);

      setHistory(filteredHistory);

      // Calculer les statistiques
      calculateStats(filteredHistory);

    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'historique global:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

// Enrichir l'historique avec les noms des tâches et des utilisateurs
  const enrichHistoryWithNames = async (historyItems: GlobalHistoryItem[]): Promise<GlobalHistoryItem[]> => {
    try {
      // Récupérer toutes les tâches
      const tachesResponse = await tacheAPI.getAllForSelect();
      const taches = tachesResponse.data.data.taches;
      const tachesMap = new Map<string, Tache>(taches.map((t: any) => [t.ID, t]));

      // Récupérer TOUS les utilisateurs sans pagination
      const usersResponse = await userAPI.getAllForSelect({});
      const users = usersResponse.data.data?.users || usersResponse.data.data || [];
      const usersMap = new Map<string, User>(users.map((u: any) => [u.ID, u]));

      // Enrichir chaque élément
      return historyItems.map(item => {
        const tache = tachesMap.get(item.idTache || '');
        const user = usersMap.get(item.idAuditeur || '');

        return {
          ...item,
          taskName: tache?.NOM || 'Tâche inconnue',
          userName: user ? `${user.PRENOM} ${user.NOM}` : `Utilisateur inconnu (${item.idAuditeur || 'N/A'})`
        };
      });
    } catch (err) {
      console.error('Erreur enrichissement:', err);
      return historyItems;
    }
  };

  // Appliquer les filtres
  const applyFilters = (items: GlobalHistoryItem[]): GlobalHistoryItem[] => {
    return items.filter(item => {
      // Filtre de recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.taskName.toLowerCase().includes(searchLower) ||
          item.userName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtre de date début
      if (filters.startDate) {
        const itemDate = new Date(item.date);
        const startDate = new Date(filters.startDate);
        if (itemDate < startDate) return false;
      }

      // Filtre de date fin
      if (filters.endDate) {
        const itemDate = new Date(item.date);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) return false;
      }

      // Filtre de statut
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      // Filtre de type
      if (filters.type && item.type !== filters.type) {
        return false;
      }

      return true;
    });
  };

  // Calculer les statistiques
  const calculateStats = (items: GlobalHistoryItem[]) => {
    setStats({
      total: items.length,
      affectations: items.filter(h => 
        h.type === 'Manuel' || h.type === 'Semi-automatisé' || h.type === 'Automatisé (IA)'
      ).length,
      algorithmes: items.filter(h => 
        h.status === 'Acceptée'
      ).length,
      refus: items.filter(h => h.status === 'Refusée').length,
      delegations: items.filter(h => h.status === 'Déléguée').length
    });
  };

  // Charger les rapports PDF depuis les affectations
  const loadRapportsPDF = async () => {
    try {
      const affectationsResponse = await affectationAPI.getAll();
      const affectations = affectationsResponse.data;

      const newRapportsMap = new Map<string, RapportPDF>();

      affectations.forEach((affectation: any) => {
        if (affectation.RAPPORT && affectation.RAPPORT.filePath) {
          const idTache = affectation.ID_TACHE;
          if (idTache) {
            newRapportsMap.set(idTache, affectation.RAPPORT);
          }
        }
      });

      setRapportsMap(newRapportsMap);
    } catch (err) {
      console.error('Erreur lors du chargement des rapports PDF:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      'Acceptée': 'bg-green-100 text-green-800',
      'En Attente': 'bg-yellow-100 text-yellow-800',
      'Refusée': 'bg-red-100 text-red-800',
      'Déléguée': 'bg-purple-100 text-purple-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const badges: { [key: string]: string } = {
      'Manuel': 'bg-blue-100 text-blue-800',
      'Semi-automatisé': 'bg-purple-200 text-purple-800',
      'Automatisé (IA)': 'bg-green-100 text-green-800'
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

  const openPDF = (filePath: string) => {
    const baseURL = 'http://localhost:5000';
    const fullURL = `${baseURL}${filePath}`;
    window.open(fullURL, '_blank');
  };

  const getRapportForItem = (item: GlobalHistoryItem): RapportPDF | null => {
    if (!item.idTache) {
      return null;
    }
    return rapportsMap.get(item.idTache) || null;
  };

  const exportToCSV = () => {
    const headers = ['Utilisateur', 'Tâche', 'Date', 'Statut', 'Type', 'Détails'];
    const rows = history.map(item => [
      item.userName,
      item.taskName,
      new Date(item.date).toLocaleDateString('fr-FR'),
      item.status,
      item.type,
      item.details || '-'
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
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
                <option value="En Attente">En Attente</option>
                <option value="Acceptée">Acceptée</option>
                <option value="Refusée">Refusée</option>
                <option value="Déléguée">Déléguée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode d'affectation
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="Manuel">Manuel</option>
                <option value="Semi-automatisé">Semi-automatisé</option>
                <option value="Automatisé (IA)">Automatisé (IA)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Réinitialiser
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
            <p className="text-sm text-gray-600">Acceptations</p>
            <p className="text-2xl font-bold text-green-600">{stats.algorithmes}</p>
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
                    Rapport PDF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item, index) => {
                  const rapport = getRapportForItem(item);

                  return (
                    <tr key={`${item.id}-${item.idAuditeur}-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.taskName}</p>
                          <p className="text-xs text-gray-500 mt-1">Par: {item.userName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {rapport ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openPDF(rapport.filePath)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                              title="Ouvrir le PDF"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Ouvrir</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Aucun rapport</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {history.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Aucun historique trouvé</p>
            <p className="text-gray-400 text-sm mt-2">Essayez de modifier les filtres</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalHistory;