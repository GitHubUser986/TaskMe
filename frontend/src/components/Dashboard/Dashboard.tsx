import React, { useState } from 'react';
import '../../styles/dashboard.css';

interface StatCardProps {
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

interface Auditor {
  name: string;
  tasks: number;
  hours: number;
  remuneratedTasks: number;
  nonRemuneratedTasks: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [stats] = useState({
    total: 127,
    inProgress: 43,
    pending: 12,
    remunerated: 72,
    nonRemunerated: 55,
    totalHours: 3840
  });

  const [auditors] = useState<Auditor[]>([
    { name: 'Ahmed El Fassi', tasks: 35, hours: 280, remuneratedTasks: 22, nonRemuneratedTasks: 13 },
    { name: 'Fatima Zahra', tasks: 32, hours: 256, remuneratedTasks: 20, nonRemuneratedTasks: 12 },
    { name: 'Omar Benjelloun', tasks: 30, hours: 240, remuneratedTasks: 18, nonRemuneratedTasks: 12 },
    { name: 'Salma Idrissi', tasks: 30, hours: 240, remuneratedTasks: 12, nonRemuneratedTasks: 18 }
  ]);

  // Calculs pour les indicateurs d'équité
  const totalHoursPerAuditor = auditors.reduce((sum, a) => sum + a.hours, 0) / auditors.length;
  const maxTasks = Math.max(...auditors.map(a => a.tasks));
  const minTasks = Math.min(...auditors.map(a => a.tasks));
  const taskDistributionEquity = ((1 - (maxTasks - minTasks) / maxTasks) * 100).toFixed(0);
  
  const maxHours = Math.max(...auditors.map(a => a.hours));
  const minHours = Math.min(...auditors.map(a => a.hours));
  const hourDistributionEquity = ((1 - (maxHours - minHours) / maxHours) * 100).toFixed(0);

  const remuneratedPercentage = ((stats.remunerated / stats.total) * 100).toFixed(0);

  return (
    <div className="page active" id="dashboard">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Tableau de bord</h1>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard label="Tâches totales" value={stats.total} color="blue" />
          <StatCard label="Volume horaire global" value={`${stats.totalHours}h`} color="green" />
          <StatCard label="Tâches rémunérées" value={stats.remunerated} color="purple" />
          <StatCard label="Tâches non rémunérées" value={stats.nonRemunerated} color="yellow" />
        </div>

        {/* Répartition par auditeur */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Répartition des tâches par auditeur</h3>
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
                  const chargePercentage = ((auditor.hours / stats.totalHours) * 100).toFixed(1);
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

        <div className="grid grid-2">
          {/* Volume horaire global */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Volume horaire global</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981' }}>
                  {stats.totalHours}h
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total des heures planifiées</div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>Moyenne par auditeur</span>
                  <span style={{ fontWeight: 600 }}>{totalHoursPerAuditor.toFixed(0)}h</span>
                </div>
                <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
                  <div style={{ background: '#10b981', width: '100%', height: '100%', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {maxHours}h
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Maximum</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {minHours}h
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Minimum</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tâches rémunérées / non rémunérées */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Tâches rémunérées / non rémunérées</h3>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '1.5rem', background: '#ede9fe', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {stats.remunerated}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rémunérées</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '0.5rem' }}>
                  {remuneratedPercentage}%
                </div>
              </div>
              
              <div style={{ flex: 1, textAlign: 'center', padding: '1.5rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {stats.nonRemunerated}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Non rémunérées</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.5rem' }}>
                  {(100 - parseInt(remuneratedPercentage))}%
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Ratio rémunérées/non rémunérées</span>
                <span style={{ fontWeight: 600 }}>{(stats.remunerated / stats.nonRemunerated).toFixed(2)}:1</span>
              </div>
              <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ background: '#8b5cf6', width: `${remuneratedPercentage}%`, height: '100%' }}></div>
                <div style={{ background: '#f59e0b', width: `${100 - parseInt(remuneratedPercentage)}%`, height: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs d'équité */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Indicateurs d'équité</h3>
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            <strong>Objectif :</strong> Maintenir une distribution équitable des tâches et des volumes horaires entre tous les auditeurs.
          </div>
          
          <div className="grid grid-3">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Distribution des tâches</span>
                <span style={{ fontWeight: 600 }}>{taskDistributionEquity}%</span>
              </div>
              <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
                <div style={{ 
                  background: parseInt(taskDistributionEquity) > 85 ? '#10b981' : parseInt(taskDistributionEquity) > 70 ? '#f59e0b' : '#ef4444', 
                  width: `${taskDistributionEquity}%`, 
                  height: '100%', 
                  borderRadius: '4px' 
                }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Écart: {maxTasks - minTasks} tâches
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Équilibre volume horaire</span>
                <span style={{ fontWeight: 600 }}>{hourDistributionEquity}%</span>
              </div>
              <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
                <div style={{ 
                  background: parseInt(hourDistributionEquity) > 85 ? '#10b981' : parseInt(hourDistributionEquity) > 70 ? '#f59e0b' : '#ef4444', 
                  width: `${hourDistributionEquity}%`, 
                  height: '100%', 
                  borderRadius: '4px' 
                }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Écart: {maxHours - minHours}h
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>Taux de rémunération</span>
                <span style={{ fontWeight: 600 }}>{remuneratedPercentage}%</span>
              </div>
              <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
                <div style={{ 
                  background: '#8b5cf6', 
                  width: `${remuneratedPercentage}%`, 
                  height: '100%', 
                  borderRadius: '4px' 
                }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                {stats.remunerated} sur {stats.total} tâches
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
