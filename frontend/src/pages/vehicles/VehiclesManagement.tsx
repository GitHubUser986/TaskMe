import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehiculeAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';

interface Vehicle {
  _id: string;
  ID: string;
  IMMATRICULATION: string;
  MARQUE: string;
  MODELE: string;
  DISPONIBLE: boolean;
  CAPACITE: number;
}

const VehiclesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les véhicules depuis le backend
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehiculeAPI.getAll();
      setVehicles(response.data);
    } catch (err: any) {
      console.error('Erreur lors du chargement des véhicules:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const getStatusBadge = (disponible: boolean) => {
    if (disponible) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Disponible
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Non disponible
        </span>
      );
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/vehicles/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await vehiculeAPI.delete(id);
        // Recharger la liste après suppression
        fetchVehicles();
        alert('Véhicule supprimé avec succès');
      } catch (err: any) {
        console.error('Erreur lors de la suppression:', err);
        alert(err.response?.data?.message || 'Erreur lors de la suppression du véhicule');
      }
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchVehicles}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des véhicules</h1>
          <button
            onClick={() => navigate('/vehicles/add')}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
          >
            Nouveau véhicule
          </button>
        </div>
        <br />
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    ID
                  </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {vehicle.ID}
                    </td>
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
          </div>

          {vehicles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun véhicule disponible</p>
            </div>
          )}
        </div>

        {/* Légende des statuts */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Légende des statuts :</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Disponible
              </span>
              <span className="text-sm text-gray-600">Véhicule disponible pour affectation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Non disponible
              </span>
              <span className="text-sm text-gray-600">Véhicule non disponible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclesManagement;