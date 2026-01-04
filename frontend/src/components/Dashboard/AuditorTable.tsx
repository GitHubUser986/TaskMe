import React from 'react';

interface Auditor {
  name: string;
  tasks: number;
  hours: number;
  remuneratedTasks: number;
  nonRemuneratedTasks: number;
}

interface AuditorTableProps {
  auditors: Auditor[];
  totalHours: number;
}

const AuditorTable: React.FC<AuditorTableProps> = ({ auditors, totalHours }) => {
  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
        Répartition des tâches par auditeur
      </h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Auditeur</th>
              <th>Nombre de tâches</th>
              <th>Volume horaire</th>
              <th>Rémunérées</th>
              <th>Non rémunérées</th>
              <th>Charge (%)</th>
            </tr>
          </thead>
          <tbody>
            {auditors.map((auditor, index) => {
              const chargePercentage = ((auditor.hours / totalHours) * 100).toFixed(1);
              return (
                <tr key={index}>
                  <td><strong>{auditor.name}</strong></td>
                  <td>{auditor.tasks}</td>
                  <td>{auditor.hours}h</td>
                  <td><span className="badge badge-success">{auditor.remuneratedTasks}</span></td>
                  <td><span className="badge badge-warning">{auditor.nonRemuneratedTasks}</span></td>
                  <td>{chargePercentage}%</td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: 'bold', background: '#f9fafb' }}>
              <td>TOTAL</td>
              <td>{auditors.reduce((sum, a) => sum + a.tasks, 0)}</td>
              <td>{auditors.reduce((sum, a) => sum + a.hours, 0)}h</td>
              <td>{auditors.reduce((sum, a) => sum + a.remuneratedTasks, 0)}</td>
              <td>{auditors.reduce((sum, a) => sum + a.nonRemuneratedTasks, 0)}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditorTable;