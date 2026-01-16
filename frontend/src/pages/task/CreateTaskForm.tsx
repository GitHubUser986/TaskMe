import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Save, X } from 'lucide-react';
import { tacheAPI } from '../../services/api';

interface FormData {
  NOM: string;
  TYPE: string;
  DESCRIPTION: string;
  DATE_DEBUT: string;
  DATE_FIN: string;
  DIRECTION: string;
  NOMBRE_PLACES: number;
  COMMUNE_OU_PARTICULIERE: string;
  SPECIALITES_CONCERNEES: string[];
  GRADES_CONCERNES: string[];
  REMUNEREE: boolean;
  MONTANT: string;
  NECESSITE_VEHICULE: boolean;
  FICHIER_ADMINISTRATIF: File | null;
}

const CreateTaskForm: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    NOM: '',
    TYPE: '',
    DESCRIPTION: '',
    DATE_DEBUT: '',
    DATE_FIN: '',
    DIRECTION: '',
    NOMBRE_PLACES: 1,
    COMMUNE_OU_PARTICULIERE: 'Particulière',
    SPECIALITES_CONCERNEES: [],
    GRADES_CONCERNES: [],
    REMUNEREE: false,
    MONTANT: '',
    NECESSITE_VEHICULE: false,
    FICHIER_ADMINISTRATIF: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const typesOptions = [
    'Formateur',
    'Membre de jury',
    'Bénéficiaire de formation',
    'Observateur',
    "Concepteur d'évaluation"
  ];

  const directionsOptions = [
    'ligne Rabat-Casa',
    'ligne Meknès-Errachidia',
    'ligne Marrakech-Agadir'
  ];

  const specialitesOptions = [
    'Auditeur pédagogique',
    "Auditeur d'orientation",
    'Auditeur de planification',
    'Auditeur des services financiers'
  ];

  const gradesOptions = ['A', 'B', 'C'];

  // FONCTION POUR GÉNÉRER UN ID UNIQUE POUR LA TÂCHE
  const generateTaskID = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TACHE-${timestamp}-${random}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setErrorMessage('');
  };

  const handleCheckboxChange = (
    name: 'SPECIALITES_CONCERNEES' | 'GRADES_CONCERNES',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value],
    }));
  };

  const handleBooleanChange = (name: 'REMUNEREE' | 'NECESSITE_VEHICULE', value: boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Optional: Validate file type
    if (file.type !== 'application/pdf') {
      setErrors(prev => ({ 
        ...prev, 
        FICHIER_ADMINISTRATIF: 'Seuls les fichiers PDF sont acceptés' 
      }));
      return;
    }
    
    // Optional: Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        FICHIER_ADMINISTRATIF: 'Le fichier ne doit pas dépasser 5 MB' 
      }));
      return;
    }
    
    setFormData(prev => ({ ...prev, FICHIER_ADMINISTRATIF: file }));
    setErrors(prev => ({ ...prev, FICHIER_ADMINISTRATIF: '' }));
  }
};

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.NOM.trim()) {
      newErrors.NOM = 'Le nom de la tâche est requis';
    }

    if (!formData.TYPE) {
      newErrors.TYPE = 'Le type est requis';
    }

    if (!formData.DESCRIPTION.trim()) {
      newErrors.DESCRIPTION = 'La description est requise';
    }

    if (!formData.DATE_DEBUT) {
      newErrors.DATE_DEBUT = 'La date de début est requise';
    }

    if (!formData.DATE_FIN) {
      newErrors.DATE_FIN = 'La date de fin est requise';
    }

    if (formData.DATE_DEBUT && formData.DATE_FIN && new Date(formData.DATE_DEBUT) > new Date(formData.DATE_FIN)) {
      newErrors.DATE_FIN = 'La date de fin doit être après la date de début';
    }

    if (!formData.DIRECTION) {
      newErrors.DIRECTION = 'La direction est requise';
    }

    if (formData.NOMBRE_PLACES < 1) {
      newErrors.NOMBRE_PLACES = 'Le nombre de places doit être au moins 1';
    }

    if (formData.SPECIALITES_CONCERNEES.length === 0) {
      newErrors.SPECIALITES_CONCERNEES = 'Au moins une spécialité doit être sélectionnée';
    } 
    
    if(formData.TYPE == "Particulière" && formData.SPECIALITES_CONCERNEES.length != 1) {
      newErrors.SPECIALITES_CONCERNEES = 'Vous devez choisir une seule spécialité tant que le type de spécialité est particulier';
    }

    if (formData.GRADES_CONCERNES.length === 0) {
      newErrors.GRADES_CONCERNES = 'Au moins un grade doit être sélectionné';
    }

    if (formData.REMUNEREE && (!formData.MONTANT || parseFloat(formData.MONTANT) <= 0)) {
      newErrors.MONTANT = 'Le montant de la rémunération est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMessage('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const taskID = generateTaskID();

      // Create FormData object for file upload
      const formDataToSend = new FormData();
      
      // Add all fields
      formDataToSend.append('ID', taskID);
      formDataToSend.append('NOM', formData.NOM.trim());
      formDataToSend.append('TYPE', formData.TYPE);
      formDataToSend.append('DESCRIPTION', formData.DESCRIPTION.trim());
      formDataToSend.append('DATE_DEBUT', new Date(formData.DATE_DEBUT).toISOString());
      formDataToSend.append('DATE_FIN', new Date(formData.DATE_FIN).toISOString());
      formDataToSend.append('DIRECTION', formData.DIRECTION);
      formDataToSend.append('NOMBRE_PLACES', formData.NOMBRE_PLACES.toString());
      formDataToSend.append('COMMUNE_OU_PARTICULIERE', formData.COMMUNE_OU_PARTICULIERE);
      formDataToSend.append('SPECIALITES_CONCERNEES', JSON.stringify(formData.SPECIALITES_CONCERNEES));
      formDataToSend.append('GRADES_CONCERNES', JSON.stringify(formData.GRADES_CONCERNES));
      formDataToSend.append('REMUNEREE', formData.REMUNEREE.toString());
      formDataToSend.append('MONTANT', formData.REMUNEREE ? formData.MONTANT : '0');
      formDataToSend.append('NECESSITE_VEHICULE', formData.NECESSITE_VEHICULE.toString());
      
      // Add file if present
      if (formData.FICHIER_ADMINISTRATIF) {
        formDataToSend.append('FICHIER_ADMINISTRATIF', formData.FICHIER_ADMINISTRATIF);
      }

      const response = await tacheAPI.create(formDataToSend);

      if (response.data.success) {
        setSuccessMessage('Tâche créée avec succès !');
        
        setTimeout(() => {
          navigate('/tasks');
        }, 2000);
      } else {
        setErrorMessage(response.data.message || 'Erreur lors de la création de la tâche');
      }
    } catch (err: any) {
      console.error('Erreur complète:', err);
      console.error('Réponse du serveur:', err.response?.data);
      
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const backendErrors: Partial<Record<keyof FormData, string>> = {};
        err.response.data.errors.forEach((error: any) => {
          backendErrors[error.champ as keyof FormData] = error.message;
        });
        setErrors(backendErrors);
        setErrorMessage('Veuillez corriger les erreurs indiquées');
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Erreur lors de la création de la tâche. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler? Les données non enregistrées seront perdues.')) {
      navigate('/tasks');
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Succès !</h2>
          <p className="text-gray-600 mb-4">{successMessage}</p>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Créer une nouvelle tâche</h1>
          <p className="text-gray-600 mt-2">Définissez les détails de la nouvelle tâche</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erreur</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <div>
            {/* Nom et Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la tâche <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="NOM"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.NOM ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Formation React.js"
                  value={formData.NOM}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                {errors.NOM && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.NOM}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="TYPE"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.TYPE ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.TYPE}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Sélectionner le type</option>
                  {typesOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.TYPE && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.TYPE}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="DESCRIPTION"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.DESCRIPTION ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Description détaillée de la tâche..."
                rows={4}
                value={formData.DESCRIPTION}
                onChange={handleInputChange}
                disabled={loading}
              />
              {errors.DESCRIPTION && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.DESCRIPTION}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="DATE_DEBUT"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.DATE_DEBUT ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.DATE_DEBUT}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                {errors.DATE_DEBUT && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.DATE_DEBUT}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="DATE_FIN"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.DATE_FIN ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.DATE_FIN}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                {errors.DATE_FIN && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.DATE_FIN}
                  </p>
                )}
              </div>
            </div>

            {/* Direction, Places, Type spécialité */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direction <span className="text-red-500">*</span>
                </label>
                <select
                  name="DIRECTION"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.DIRECTION ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.DIRECTION}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Sélectionner</option>
                  {directionsOptions.map(dir => (
                    <option key={dir} value={dir}>{dir}</option>
                  ))}
                </select>
                {errors.DIRECTION && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.DIRECTION}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de places <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="NOMBRE_PLACES"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.NOMBRE_PLACES ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1"
                  value={formData.NOMBRE_PLACES}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                {errors.NOMBRE_PLACES && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.NOMBRE_PLACES}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de spécialité <span className="text-red-500">*</span>
                </label>
                <select
                  name="COMMUNE_OU_PARTICULIERE"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.COMMUNE_OU_PARTICULIERE}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="Particulière">Particulière</option>
                  <option value="Commune">Commune</option>
                </select>
              </div>
            </div>

            {/* Spécialités */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spécialités concernées <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {specialitesOptions.map(spec => (
                  <label key={spec} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.SPECIALITES_CONCERNEES.includes(spec)}
                      onChange={() => handleCheckboxChange('SPECIALITES_CONCERNEES', spec)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">{spec.replace('Auditeur ', '').replace("Auditeur d'", '')}</span>
                  </label>
                ))}
              </div>
              {errors.SPECIALITES_CONCERNEES && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.SPECIALITES_CONCERNEES}
                </p>
              )}
            </div>

            {/* Grades */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grades concernés <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {gradesOptions.map(grade => (
                  <label key={grade} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.GRADES_CONCERNES.includes(grade)}
                      onChange={() => handleCheckboxChange('GRADES_CONCERNES', grade)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Grade {grade}</span>
                  </label>
                ))}
              </div>
              {errors.GRADES_CONCERNES && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.GRADES_CONCERNES}
                </p>
              )}
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier administratif joint (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className={`text-sm ${errors.FICHIER_ADMINISTRATIF ? 'text-red-600' : 'text-blue-600'}`}
                disabled={loading}
              />
              {errors.FICHIER_ADMINISTRATIF && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.FICHIER_ADMINISTRATIF}
                </p>
              )}
              {formData.FICHIER_ADMINISTRATIF && (
                <p className="mt-1 text-sm text-gray-600">
                  Fichier sélectionné: {formData.FICHIER_ADMINISTRATIF.name}
                </p>
              )}
            </div>

            </div>

            {/* Rémunération */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Rémunération</label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.REMUNEREE}
                      onChange={() => handleBooleanChange('REMUNEREE', true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Rémunérée</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.REMUNEREE}
                      onChange={() => handleBooleanChange('REMUNEREE', false)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Non rémunérée</span>
                  </label>
                </div>

                {formData.REMUNEREE && (
                  <div className="max-w-xs">
                    <input
                      type="number"
                      name="MONTANT"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.MONTANT ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Montant en MAD"
                      min="0"
                      step="0.01"
                      value={formData.MONTANT}
                      onChange={handleInputChange}
                      disabled={loading}
                    />
                    {errors.MONTANT && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.MONTANT}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Véhicule */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Véhicule</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.NECESSITE_VEHICULE}
                    onChange={() => handleBooleanChange('NECESSITE_VEHICULE', true)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Véhicule fourni</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.NECESSITE_VEHICULE}
                    onChange={() => handleBooleanChange('NECESSITE_VEHICULE', false)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Pas de véhicule</span>
                </label>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Créer la tâche
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskForm;