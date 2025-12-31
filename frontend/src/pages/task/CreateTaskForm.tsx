import React, { useState } from 'react';
import '../../styles/form.css';

interface FormData {
  taskName: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  direction: string;
  places: number;
  specialtyType: string;
  specialties: string[];
  grades: string[];
  isRemunerated: boolean;
  remunerationAmount: string;
  hasVehicle: boolean;
}

const CreateTaskForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    taskName: '',
    type: '',
    description: '',
    startDate: '',
    endDate: '',
    direction: '',
    places: 1,
    specialtyType: 'Particulière',
    specialties: [],
    grades: [],
    isRemunerated: false,
    remunerationAmount: '',
    hasVehicle: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleCheckboxChange = (
  name: 'specialties' | 'grades',
  value: string
) => {
  setFormData(prev => ({
    ...prev,
    [name]: prev[name].includes(value)
      ? prev[name].filter(item => item !== value)
      : [...prev[name], value],
  }));
};


  const handleBooleanChange = (name: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Logique de soumission ici
  };

  return (
    <div id="create-task" className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Créer une nouvelle tâche</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>Nom de la tâche *</label>
                <input
                  type="text"
                  name="taskName"
                  className="form-control"
                  placeholder="Ex: Formation React.js"
                  value={formData.taskName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  name="type"
                  className="form-control"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner le type</option>
                  <option value="formateur">Formateur</option>
                  <option value="jury">Membre de jury</option>
                  <option value="beneficiaire">Bénéficiaire de formation</option>
                  <option value="observateur">Observateur</option>
                  <option value="concepteur">Concepteur d'évaluation</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                className="form-control"
                placeholder="Description détaillée de la tâche..."
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>Date de début *</label>
                <input
                  type="date"
                  name="startDate"
                  className="form-control"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Date de fin *</label>
                <input
                  type="date"
                  name="endDate"
                  className="form-control"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label>Direction *</label>
                <select
                  name="direction"
                  className="form-control"
                  value={formData.direction}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="rabat-casa">Rabat - Casa</option>
                  <option value="meknes-errachidia">Meknès - Errachidia</option>
                  <option value="marrakech-agadir">Marrakech - Agadir</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre de places *</label>
                <input
                  type="number"
                  name="places"
                  className="form-control"
                  placeholder="1"
                  min="1"
                  value={formData.places}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type de spécialité *</label>
                <select
                  name="specialtyType"
                  className="form-control"
                  value={formData.specialtyType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Particulière">Particulière</option>
                  <option value="Commune">Commune</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Spécialités concernées *</label>
              <div className="checkbox-grid">
                {['Pédagogique', 'Orientation', 'Planification', 'Services financiers'].map(
                  (spec) => (
                    <div className="checkbox-item" key={spec}>
                      <input
                        type="checkbox"
                        id={`spec-${spec}`}
                        checked={formData.specialties.includes(spec)}
                        onChange={() => handleCheckboxChange('specialties', spec)}
                      />
                      <label htmlFor={`spec-${spec}`}>{spec}</label>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Grades concernés *</label>
              <div className="grades-container">
                {['Grade A', 'Grade B', 'Grade C'].map((grade) => (
                  <div className="checkbox-item" key={grade}>
                    <input
                      type="checkbox"
                      id={`grade-${grade}`}
                      checked={formData.grades.includes(grade)}
                      onChange={() => handleCheckboxChange('grades', grade)}
                    />
                    <label htmlFor={`grade-${grade}`}>{grade}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* NOUVEAUX CHAMPS */}
            <div className="form-group">
              <label>Rémunération</label>
              <div className="remuneration-section">
                <div className="radio-group">
                  <div className="radio-item">
                    <input
                      type="radio"
                      id="remunerated-yes"
                      name="isRemunerated"
                      checked={formData.isRemunerated}
                      onChange={() => handleBooleanChange('isRemunerated', true)}
                    />
                    <label htmlFor="remunerated-yes">Rémunérée</label>
                  </div>
                  <div className="radio-item">
                    <input
                      type="radio"
                      id="remunerated-no"
                      name="isRemunerated"
                      checked={!formData.isRemunerated}
                      onChange={() => handleBooleanChange('isRemunerated', false)}
                    />
                    <label htmlFor="remunerated-no">Non rémunérée</label>
                  </div>
                </div>

                {formData.isRemunerated && (
                  <div className="amount-input">
                    <input
                      type="number"
                      name="remunerationAmount"
                      className="form-control"
                      placeholder="Montant en MAD"
                      min="0"
                      step="0.01"
                      value={formData.remunerationAmount}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Véhicule</label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="vehicle-yes"
                    name="hasVehicle"
                    checked={formData.hasVehicle}
                    onChange={() => handleBooleanChange('hasVehicle', true)}
                  />
                  <label htmlFor="vehicle-yes">Véhicule fourni</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="vehicle-no"
                    name="hasVehicle"
                    checked={!formData.hasVehicle}
                    onChange={() => handleBooleanChange('hasVehicle', false)}
                  />
                  <label htmlFor="vehicle-no">Pas de véhicule</label>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-success">
              Créer la tâche
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskForm;