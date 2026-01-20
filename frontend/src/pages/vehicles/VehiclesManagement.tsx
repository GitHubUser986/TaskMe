import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehiculeAPI } from '../../services/api';
import { Loader2, Search, X } from 'lucide-react';

interface Vehicle {
  _id: string;
  ID: string;
  IMMATRICULATION: string;
  MARQUE: string;
  MODELE: string;
  DISPONIBLE: boolean;
  CAPACITE: number;
}

interface VehicleStats {
  total: number;
  disponibles: number;
  nonDisponibles: number;
  parMarque: Array<{ marque: string; count: number }>;
  capaciteMoyenne: number;
}

const VehiclesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Available brands for filter
  const [brands, setBrands] = useState<string[]>([]);
  
  // Statistics
  const [stats, setStats] = useState<VehicleStats | null>(null);

  // Fetch vehicles with current filters and page
  const fetchVehicles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit: 10
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedBrand) params.marque = selectedBrand;
      if (selectedStatus !== '') params.disponible = selectedStatus;

      const response = await vehiculeAPI.getAll(params);

      if (response.data.success) {
        setVehicles(response.data.data);
        
        // Update pagination if available
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des véhicules:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available brands for filter
  const fetchBrands = async () => {
    try {
      const response = await vehiculeAPI.getBrands();
      if (response.data.success) {
        setBrands(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des marques:', err);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await vehiculeAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBrands();
    fetchStats();
  }, []);

  // Reload when filters change (reset to page 1)
  useEffect(() => {
    fetchVehicles(1);
  }, [searchTerm, selectedBrand, selectedStatus]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBrand('');
    setSelectedStatus('');
  };

  const getStatusBadge = (disponible: boolean) => {
    if (disponible) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Disponible
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        Non disponible
      </span>
    );
  };

  const handleEdit = (id: string) => {
    navigate(`/vehicles/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await vehiculeAPI.delete(id);
        fetchVehicles(pagination.currentPage);
        fetchStats();
        alert('Véhicule supprimé avec succès');
      } catch (err: any) {
        console.error('Erreur lors de la suppression:', err);
        alert(err.response?.data?.message || 'Erreur lors de la suppression du véhicule');
      }
    }
  };

  const activeFiltersCount = [searchTerm, selectedBrand, selectedStatus].filter(Boolean).length;

  if (loading && vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement des véhicules...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Gestion des véhicules</h1>
            <button
              onClick={() => navigate('/vehicles/add')}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
            >
              Nouveau véhicule
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="my-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Total véhicules</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Disponibles</div>
              <div className="text-2xl font-bold text-green-600">{stats.disponibles}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Non disponibles</div>
              <div className="text-2xl font-bold text-red-600">{stats.nonDisponibles}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600">Capacité moyenne</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.capaciteMoyenne.toFixed(1)} places
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rechercher par immatriculation, marque, modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Brand Filter */}
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-56"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">Toutes les marques</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-56"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="true">Disponible</option>
              <option value="false">Non disponible</option>
            </select>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Effacer ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => fetchVehicles(pagination.currentPage)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Immatriculation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Marque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Modèle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Capacité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="text-gray-900">{vehicle.IMMATRICULATION}</strong>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {vehicle.MARQUE}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {vehicle.MODELE}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {vehicle.CAPACITE} places
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vehicle.DISPONIBLE)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(vehicle.ID)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.ID)}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {vehicles.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {activeFiltersCount > 0 
                    ? 'Aucun véhicule ne correspond aux filtres' 
                    : 'Aucun véhicule disponible'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Affichage de {((pagination.currentPage - 1) * pagination.perPage) + 1} à{' '}
                {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} sur{' '}
                {pagination.totalItems} véhicules
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fetchVehicles(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>

                <div className="flex items-center gap-2">
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchVehicles(pageNum)}
                        disabled={loading}
                        className={`px-3 py-1 rounded-md transition-colors ${
                          pagination.currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => fetchVehicles(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehiclesManagement;