import React, { useState } from 'react';

interface VehicleFormData {
  registration: string;
  model: string;
  brand: string;
  capacity: number;
  year: number;
  color: string;
  fuelType: string;
  status: 'disponible' | 'maintenance' | 'mission';
  mileage: number;
  notes: string;
}

const AddVehicleForm: React.FC = () => {
  const [formData, setFormData] = useState<VehicleFormData>({
    registration: '',
    model: '',
    brand: '',
    capacity: 5,
    year: new Date().getFullYear(),
    color: '',
    fuelType: 'essence',
    status: 'disponible',
    mileage: 0,
    notes: ''
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log('Véhicule ajouté:', formData);
    alert('Véhicule ajouté avec succès!');
    // Réinitialiser le formulaire
    setFormData({
      registration: '',
      model: '',
      brand: '',
      capacity: 5,
      year: new Date().getFullYear(),
      color: '',
      fuelType: 'essence',
      status: 'disponible',
      mileage: 0,
      notes: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Ajouter un véhicule</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Immatriculation et Marque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immatriculation *
                </label>
                <input
                  type="text"
                  name="registration"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1234-AB-56"
                  value={formData.registration}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marque *
                </label>
                <select
                  name="brand"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.brand}
                  onChange={handleInputChange}
                >
                  <option value="">Sélectionner une marque</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Renault">Renault</option>
                  <option value="Peugeot">Peugeot</option>
                  <option value="Ford">Ford</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Mercedes">Mercedes</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Dacia">Dacia</option>
                </select>
              </div>
            </div>

            {/* Modèle et Année */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modèle *
                </label>
                <input
                  type="text"
                  name="model"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Corolla, Clio, Transit..."
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année *
                </label>
                <input
                  type="number"
                  name="year"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2024"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Capacité et Couleur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité (places) *
                </label>
                <input
                  type="number"
                  name="capacity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                  min="2"
                  max="50"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <input
                  type="text"
                  name="color"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Blanc, Noir, Gris..."
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Type de carburant et Kilométrage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de carburant *
                </label>
                <select
                  name="fuelType"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                >
                  <option value="essence">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybride">Hybride</option>
                  <option value="electrique">Électrique</option>
                  <option value="gpl">GPL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kilométrage
                </label>
                <input
                  type="number"
                  name="mileage"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  value={formData.mileage}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut initial *
              </label>
              <select
                name="status"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="disponible">Disponible</option>
                <option value="mission">Prise en mission</option>
                <option value="maintenance">En maintenance</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes / Observations
              </label>
              <textarea
                name="notes"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Informations supplémentaires sur le véhicule..."
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            {/* Bouton de soumission */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Ajouter le véhicule
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleForm;