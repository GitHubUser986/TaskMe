import React, { useState } from 'react';
import { User, Mail, Phone, Award, Briefcase, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface UserFormData {
  fullName: string;
  specialty: string;
  grade: string;
  role: string;
  email: string;
  phone: string;
}

const AddUser: React.FC = () => {
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
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (formData.phone && !/^[0-9+\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Ajouter un nouvel utilisateur</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Nom complet */}
            <div className="form-group">
              <label htmlFor="fullName">
                <User className="w-4 h-4 inline mr-2" />
                Nom complet <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`form-control ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder="Ex: Ahmed El Fassi"
              />
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email et Téléphone */}
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="exemple@education.ma"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`form-control ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+212 6XX XXX XXX"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Spécialité et Grade */}
            <div className="grid grid-2">
              <div className="form-group">
                <label htmlFor="specialty">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Spécialité <span className="text-red-400">*</span>
                </label>
                <select
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  className={`form-control ${errors.specialty ? 'border-red-500' : ''}`}
                >
                  <option value="">Sélectionnez une spécialité</option>
                  <option value="Pédagogique">Pédagogique</option>
                  <option value="Orientation">Orientation</option>
                  <option value="Planification">Planification</option>
                  <option value="Services financiers">Services financiers</option>
                </select>
                {errors.specialty && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.specialty}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="grade">
                  <Award className="w-4 h-4 inline mr-2" />
                  Grade <span className="text-red-400">*</span>
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className={`form-control ${errors.grade ? 'border-red-500' : ''}`}
                >
                  <option value="">Sélectionnez un grade</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                </select>
                {errors.grade && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.grade}
                  </p>
                )}
              </div>
            </div>

            {/* Rôle */}
            <div className="form-group">
              <label htmlFor="role">
                Rôle <span className="text-red-400">*</span>
              </label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="role-user"
                    name="role"
                    value="User"
                    checked={formData.role === 'User'}
                    onChange={handleChange}
                  />
                  <label htmlFor="role-user">Utilisateur</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="role-admin"
                    name="role"
                    value="Admin"
                    checked={formData.role === 'Admin'}
                    onChange={handleChange}
                  />
                  <label htmlFor="role-admin">Administrateur</label>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Les administrateurs ont accès à toutes les fonctionnalités du système
              </p>
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button type="submit" className="btn btn-success">
                <Save className="w-5 h-5 inline mr-2" />
                Ajouter l'utilisateur
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-2 mt-8 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Informations
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mb-1">•</span>
              <span>Les champs marqués d'un astérisque (*) sont obligatoires</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mb-1">•</span>
              <span>L'utilisateur recevra un email de confirmation à l'adresse indiquée</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mb-1">•</span>
              <span>Le compte sera activé par défaut lors de la création</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddUser;