import React from 'react';

interface HourVolumeCardProps {
  totalHours: number;
  averageHours: number;
  maxHours: number;
  minHours: number;
}

const HourVolumeCard: React.FC<HourVolumeCardProps> = ({ 
  totalHours, 
  averageHours, 
  maxHours, 
  minHours 
}) => {
  return (
    <div className="card">
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
        Volume horaire global
      </h3>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981' }}>
            {totalHours}h
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Total des heures planifiées
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem' }}>Moyenne par auditeur</span>
            <span style={{ fontWeight: 600 }}>{averageHours.toFixed(0)}h</span>
          </div>
          <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
            <div style={{ 
              background: '#10b981', 
              width: '100%', 
              height: '100%', 
              borderRadius: '4px' 
            }}></div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem', 
          marginTop: '1.5rem' 
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '1rem', 
            background: '#f3f4f6', 
            borderRadius: '0.5rem' 
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {maxHours}h
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Maximum</div>
          </div>
          <div style={{ 
            textAlign: 'center', 
            padding: '1rem', 
            background: '#f3f4f6', 
            borderRadius: '0.5rem' 
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {minHours}h
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Minimum</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HourVolumeCard;