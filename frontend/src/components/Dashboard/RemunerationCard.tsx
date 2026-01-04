import React from 'react';

interface RemunerationCardProps {
  remunerated: number;
  nonRemunerated: number;
  total: number;
}

const RemunerationCard: React.FC<RemunerationCardProps> = ({ 
  remunerated, 
  nonRemunerated, 
  total 
}) => {
  const remuneratedPercentage = ((remunerated / total) * 100).toFixed(0);
  const ratio = (remunerated / nonRemunerated).toFixed(2);

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
        Tâches rémunérées / non rémunérées
      </h3>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '1.5rem', 
          background: '#ede9fe', 
          borderRadius: '0.5rem' 
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {remunerated}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rémunérées</div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#8b5cf6', 
            marginTop: '0.5rem' 
          }}>
            {remuneratedPercentage}%
          </div>
        </div>
        
        <div style={{ 
          flex: 1, 
          textAlign: 'center', 
          padding: '1.5rem', 
          background: '#fef3c7', 
          borderRadius: '0.5rem' 
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {nonRemunerated}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Non rémunérées</div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#f59e0b', 
            marginTop: '0.5rem' 
          }}>
            {100 - parseInt(remuneratedPercentage)}%
          </div>
        </div>
      </div>

      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '0.5rem' 
        }}>
          <span style={{ fontSize: '0.875rem' }}>Ratio rémunérées/non rémunérées</span>
          <span style={{ fontWeight: 600 }}>{ratio}:1</span>
        </div>
        <div style={{ 
          background: '#e5e7eb', 
          height: '8px', 
          borderRadius: '4px', 
          overflow: 'hidden', 
          display: 'flex' 
        }}>
          <div style={{ 
            background: '#8b5cf6', 
            width: `${remuneratedPercentage}%`, 
            height: '100%' 
          }}></div>
          <div style={{ 
            background: '#f59e0b', 
            width: `${100 - parseInt(remuneratedPercentage)}%`, 
            height: '100%' 
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default RemunerationCard;