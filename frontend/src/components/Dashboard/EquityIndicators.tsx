import React from 'react';

interface Auditor {
  name: string;
  tasks: number;
  hours: number;
  remuneratedTasks: number;
  nonRemuneratedTasks: number;
}

interface EquityIndicatorsProps {
  auditors: Auditor[];
  remunerated: number;
  total: number;
}

const EquityIndicators: React.FC<EquityIndicatorsProps> = ({ 
  auditors, 
  remunerated, 
  total 
}) => {
  // Filtrer les auditeurs avec au moins 1 tâche
  const auditorsWithTasks = auditors.filter(a => a.tasks > 0);
  const auditorsWithHours = auditors.filter(a => a.hours > 0);

  const maxTasks = Math.max(...auditors.map(a => a.tasks));
  const minTasks = auditorsWithTasks.length > 0
    ? Math.min(...auditorsWithTasks.map(a => a.tasks))
    : 0;
  const taskDistributionEquity = maxTasks > 0
    ? ((1 - (maxTasks - minTasks) / maxTasks) * 100).toFixed(0)
    : '100';
  
  const maxHours = Math.max(...auditors.map(a => a.hours));
  const minHours = auditorsWithHours.length > 0
    ? Math.min(...auditorsWithHours.map(a => a.hours))
    : 0;
  const hourDistributionEquity = maxHours > 0
    ? ((1 - (maxHours - minHours) / maxHours) * 100).toFixed(0)
    : '100';

  const remuneratedPercentage = ((remunerated / total) * 100).toFixed(0);

  const getEquityColor = (value: number) => {
    if (value > 85) return '#10b981';
    if (value > 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
        Indicateurs d'équité
      </h3>
      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <strong>Objectif :</strong> Maintenir une distribution équitable des tâches et des 
        volumes horaires entre tous les auditeurs.
      </div>
      
      <div className="grid grid-3">
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.5rem' 
          }}>
            <span style={{ fontSize: '0.875rem' }}>Distribution des tâches</span>
            <span style={{ fontWeight: 600 }}>{taskDistributionEquity}%</span>
          </div>
          <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
            <div style={{ 
              background: getEquityColor(parseInt(taskDistributionEquity)), 
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.5rem' 
          }}>
            <span style={{ fontSize: '0.875rem' }}>Équilibre volume horaire</span>
            <span style={{ fontWeight: 600 }}>{hourDistributionEquity}%</span>
          </div>
          <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
            <div style={{ 
              background: getEquityColor(parseInt(hourDistributionEquity)), 
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.5rem' 
          }}>
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
            {remunerated} sur {total} tâches
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquityIndicators;