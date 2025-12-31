import React, { useState } from 'react';
import { Car, Calendar, Gauge, Fuel, Palette, FileText, Save, X } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Véhicule ajouté:', formData);
    alert('Véhicule ajouté avec succès!');
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
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Ajouter un véhicule</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Immatriculation et Marque */}
            <div className="grid grid-2">
              <div className="form-group">
                <label>
                  <Car className="w-4 h-4 inline mr-2" />
                  Immatriculation *
                </label>
                <input
                  type="text"
                  name="registration"
                  className="form-control"
                  placeholder="Ex: 1234-AB-56"
                  value={formData.registration}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Marque *</label>
                <select
                  name="brand"
                  className="form-control"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
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
            <div className="grid grid-2">
              <div className="form-group">
                <label>Modèle *</label>
                <input
                  type="text"
                  name="model"
                  className="form-control"
                  placeholder="Ex: Corolla, Clio, Transit..."
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Année *
                </label>
                <input
                  type="number"
                  name="year"
                  className="form-control"
                  placeholder="2024"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Capacité et Couleur */}
            <div className="grid grid-2">
              <div className="form-group">
                <label>Capacité (places) *</label>
                <input
                  type="number"
                  name="capacity"
                  className="form-control"
                  placeholder="5"
                  min="2"
                  max="50"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Palette className="w-4 h-4 inline mr-2" />
                  Couleur
                </label>
                <input
                  type="text"
                  name="color"
                  className="form-control"
                  placeholder="Blanc, Noir, Gris..."
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Type de carburant et Kilométrage */}
            <div className="grid grid-2">
              <div className="form-group">
                <label>
                  <Fuel className="w-4 h-4 inline mr-2" />
                  Type de carburant *
                </label>
                <select
                  name="fuelType"
                  className="form-control"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="essence">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybride">Hybride</option>
                  <option value="electrique">Électrique</option>
                  <option value="gpl">GPL</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <Gauge className="w-4 h-4 inline mr-2" />
                  Kilométrage
                </label>
                <input
                  type="number"
                  name="mileage"
                  className="form-control"
                  placeholder="0"
                  min="0"
                  value={formData.mileage}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Statut */}
            <div className="form-group">
              <label>Statut initial *</label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="status-disponible"
                    name="status"
                    value="disponible"
                    checked={formData.status === 'disponible'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="status-disponible">Disponible</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="status-mission"
                    name="status"
                    value="mission"
                    checked={formData.status === 'mission'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="status-mission">En mission</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="status-maintenance"
                    name="status"
                    value="maintenance"
                    checked={formData.status === 'maintenance'}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="status-maintenance">En maintenance</label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>
                <FileText className="w-4 h-4 inline mr-2" />
                Notes / Observations
              </label>
              <textarea
                name="notes"
                className="form-control"
                placeholder="Informations supplémentaires sur le véhicule..."
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button type="submit" className="btn btn-success">
                <Save className="w-5 h-5 inline mr-2" />
                Ajouter le véhicule
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-8 py-2 mt-8 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleForm;