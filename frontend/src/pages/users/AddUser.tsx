import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserFormData {
  fullName: string;
  specialty: string;
  grade: string;
  role: string;
  email: string;
  phone: string;
}

const AddUser: React.FC = () => {
    const navigate = useNavigate();
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    specialty: '',
    grade: '',
    role: 'User',
    email: '',
    phone: ''
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (!formData.specialty) {
      newErrors.specialty = 'La spécialité est requise';
    }

    if (!formData.grade) {
      newErrors.grade = 'Le grade est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData.phone && !/^[0-9+\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Formulaire soumis:', formData);
      alert(`Utilisateur ajouté avec succès!\n\nNom: ${formData.fullName}\nSpécialité: ${formData.specialty}\nGrade: ${formData.grade}`);
      
      setFormData({
        fullName: '',
        specialty: '',
        grade: '',
        role: 'User',
        email: '',
        phone: ''
      });
    }
  };

  const handleCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler? Les données non enregistrées seront perdues.')) {
      setFormData({
        fullName: '',
        specialty: '',
        grade: '',
        role: 'User',
        email: '',
        phone: ''
      });
      setErrors({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/users')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 flex items-center gap-2"
          >
            ← Retour à la liste
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Ajouter un nouvel utilisateur</h1>
          <p className="text-gray-600 mt-2">Remplissez les informations ci-dessous pour créer un nouveau compte utilisateur</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Ahmed El Fassi"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="exemple@education.ma"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+212 6XX XXX XXX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                Spécialité <span className="text-red-500">*</span>
              </label>
              <select
                id="specialty"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.specialty ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez une spécialité</option>
                <option value="Pédagogique">Pédagogique</option>
                <option value="Orientation">Orientation</option>
                <option value="Planification">Planification</option>
                <option value="Services financiers">Services financiers</option>
              </select>
              {errors.specialty && (
                <p className="mt-1 text-sm text-red-600">{errors.specialty}</p>
              )}
            </div>

            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Grade <span className="text-red-500">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.grade ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionnez un grade</option>
                <option value="Grade A">Grade A</option>
                <option value="Grade B">Grade B</option>
                <option value="Grade C">Grade C</option>
              </select>
              {errors.grade && (
                <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Rôle <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="User">Utilisateur</option>
                <option value="Admin">Administrateur</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Les administrateurs ont accès à toutes les fonctionnalités du système
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              ✓ Ajouter l'utilisateur
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Informations</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Les champs marqués d'un astérisque (*) sont obligatoires</li>
            <li>• L'utilisateur recevra un email de confirmation à l'adresse indiquée</li>
            <li>• Le compte sera activé par défaut lors de la création</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddUser;