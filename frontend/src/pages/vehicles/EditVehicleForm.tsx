import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Car, Save, X, Loader2 } from 'lucide-react';
import { vehiculeAPI } from '../../services/api';

interface VehicleFormData {
  ID: string;
  IMMATRICULATION: string;
  MARQUE: string;
  MODELE: string;
  DISPONIBLE: boolean;
  CAPACITE: number;
}

const EditVehicleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
    const generateVehicleID = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `V-${timestamp}-${random}`;
  };
  
  const [formData, setFormData] = useState<VehicleFormData>({
    ID: generateVehicleID(),
    IMMATRICULATION: '',
    MARQUE: '',
    MODELE: '',
    DISPONIBLE: true,
    CAPACITE: 5
  });

  // Charger les données du véhicule
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id) return;
      
      try {
        setLoadingData(true);
        const response = await vehiculeAPI.getById(id);
        setFormData({
          ID: response.data.data.ID,
          IMMATRICULATION: response.data.data.IMMATRICULATION,
          MARQUE: response.data.data.MARQUE,
          MODELE: response.data.data.MODELE,
          DISPONIBLE: response.data.data.DISPONIBLE,
          CAPACITE: response.data.data.CAPACITE
        });
      } catch (err: any) {
        console.error('Erreur lors du chargement du véhicule:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement du véhicule');
      } finally {
        setLoadingData(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'CAPACITE') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Mettre à jour les données dans le backend
      await vehiculeAPI.update(id, formData);
      
      alert('Véhicule modifié avec succès!');
      
      // Rediriger vers la liste des véhicules
      navigate('/vehicles');
      
    } catch (err: any) {
      console.error('Erreur lors de la modification du véhicule:', err);
      setError(err.response?.data?.message || 'Erreur lors de la modification du véhicule');
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="page">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement des données...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Modifier le véhicule</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* ID et Immatriculation */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
              <div className="form-group">
                <label>
                  <Car className="w-4 h-4 inline mr-2" />
                  ID Véhicule <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ID"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.ID}
                  disabled
                  title="L'ID ne peut pas être modifié"
                />
              </div>

              <div className="form-group">
                <label>
                  <Car className="w-4 h-4 inline mr-2" />
                  Immatriculation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="IMMATRICULATION"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1234-AB-56"
                  value={formData.IMMATRICULATION}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Marque et Modèle */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
              <div className="form-group">
                <label>Marque <span className="text-red-500">*</span></label>
                <select
                  name="MARQUE"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.MARQUE}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
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
                  <option value="Citroën">Citroën</option>
                  <option value="Fiat">Fiat</option>
                </select>
              </div>

              <div className="form-group">
                <label>Modèle <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="MODELE"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Corolla, Clio, Transit..."
                  value={formData.MODELE}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Capacité et Disponibilité */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
              <div className="form-group">
                <label>Capacité (places) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="CAPACITE"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                  min="2"
                  max="50"
                  value={formData.CAPACITE}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Disponibilité</label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    name="DISPONIBLE"
                    id="disponible"
                    checked={formData.DISPONIBLE}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="disponible" className="text-sm text-gray-700">
                    Véhicule disponible
                  </label>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-4 mt-6">
              <button 
                type="submit" 
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                    Modification en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 inline mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
                className="px-8 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold"
                disabled={loading}
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

export default EditVehicleForm;