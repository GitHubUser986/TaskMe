import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Vehicle {
  id: number;
  registration: string;
  model: string;
  capacity: number;
  status: 'disponible' | 'maintenance' | 'mission';
}

const VehiclesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 1,
      registration: '1234-AB-56',
      model: 'Toyota Corolla',
      capacity: 5,
      status: 'disponible'
    },
    {
      id: 2,
      registration: '7890-CD-12',
      model: 'Ford Transit',
      capacity: 12,
      status: 'maintenance'
    },
    {
      id: 3,
      registration: '3456-EF-34',
      model: 'Nissan NV200',
      capacity: 7,
      status: 'mission'
    },
    {
      id: 4,
      registration: '5678-GH-90',
      model: 'Renault Kangoo',
      capacity: 5,
      status: 'disponible'
    }
  ]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponible: {
        label: 'Disponible',
        className: 'bg-green-100 text-green-800'
      },
      maintenance: {
        label: 'En maintenance',
        className: 'bg-yellow-100 text-yellow-800'
      },
      mission: {
        label: 'Prise en mission',
        className: 'bg-blue-100 text-blue-800'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleEdit = (id: number) => {
    console.log('Modifier véhicule:', id);
    alert(`Modifier le véhicule ID: ${id}`);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des véhicules</h1>
          <button
            onClick={() => navigate('/vehicles/add')}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
            >
                ➕ Nouvel véhicule
              </button>
        </div>
<br />
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider">
                    Immatriculation
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
                  <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="text-gray-900">{vehicle.registration}</strong>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {vehicle.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {vehicle.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vehicle.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(vehicle.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
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
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Prise en mission
              </span>
              <span className="text-sm text-gray-600">Véhicule actuellement en mission</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                En maintenance
              </span>
              <span className="text-sm text-gray-600">Véhicule en réparation ou entretien</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclesManagement;