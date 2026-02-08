import React, { useMemo } from 'react';
import StatCard from '../components/Dashboard/StatsCard';
import AuditorTable from '../components/Dashboard/AuditorTable';
import HourVolumeCard from '../components/Dashboard/HourVolumeCard';
import RemunerationCard from '../components/Dashboard/RemunerationCard';
import EquityIndicators from '../components/Dashboard/EquityIndicators';
import { useDashboard } from '../hooks/useDashboard';
import '../styles/dashboard.css';

const Dashboard: React.FC = () => {
  const { data, loading, error } = useDashboard();

  // Calculs dérivés optimisés avec useMemo
  const calculations = useMemo(() => {
    if (!data || !data.auditors.length) {
      return {
        totalHoursPerAuditor: 0,
        maxHours: 0,
        minHours: 0
      };
    }

    // Filtrer les auditeurs ayant au moins 1 heure
    const auditorsWithHours = data.auditors.filter(a => a.hours > 0);

    const totalHoursPerAuditor = data.auditors.reduce((sum, a) => sum + a.hours, 0) / data.auditors.length;
    const maxHours = Math.max(...data.auditors.map(a => a.hours));
    console.log(maxHours);
    
    // Calculer le minimum seulement sur les auditeurs avec des heures
    const minHours = auditorsWithHours.length > 0 
      ? Math.min(...auditorsWithHours.map(a => a.hours))
      : 0;

    return { totalHoursPerAuditor, maxHours, minHours };
  }, [data]);

  // État de chargement
  if (loading) {
    return (
      <div className="page active" id="dashboard">
        <div className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div className="spinner"></div>
            <p style={{ color: '#6b7280' }}>Chargement des données du dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="page active" id="dashboard">
        <div className="container">
          <div className="alert alert-error" style={{ marginTop: '2rem' }}>
            <strong>Erreur :</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  // Pas de données
  if (!data) {
    return (
      <div className="page active" id="dashboard">
        <div className="container">
          <div className="alert alert-info" style={{ marginTop: '2rem' }}>
            Aucune donnée disponible pour le moment.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" id="dashboard" >
      <div className="container">

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard 
            label="Tâches totales" 
            value={data.stats.total} 
            color="blue" 
          />
          <StatCard 
            label="Volume horaire global" 
            value={`${data.stats.totalHours}h`} 
            color="green" 
          />
          <StatCard 
            label="Tâches rémunérées" 
            value={data.stats.remunerated} 
            color="purple" 
          />
          <StatCard 
            label="Tâches non rémunérées" 
            value={data.stats.nonRemunerated} 
            color="yellow" 
          />
        </div>

        {/* Répartition par auditeur */}
        <AuditorTable 
          auditors={data.auditors} 
          totalHours={data.stats.totalHours} 
        />

        <div className="grid grid-2">
          {/* Volume horaire global */}
          <HourVolumeCard 
            totalHours={data.stats.totalHours}
            averageHours={calculations.totalHoursPerAuditor}
            maxHours={calculations.maxHours}
            minHours={calculations.minHours}
          />

          {/* Tâches rémunérées / non rémunérées */}
          <RemunerationCard 
            remunerated={data.stats.remunerated}
            nonRemunerated={data.stats.nonRemunerated}
            total={data.stats.total}
          />
        </div>

        {/* Indicateurs d'équité */}
        <EquityIndicators 
          auditors={data.auditors.map(a => ({
            name: a.name,
            tasks: a.tasks,
            hours: a.hours,
            remuneratedTasks: a.remuneratedTasks,
            nonRemuneratedTasks: a.nonRemuneratedTasks
          }))}
          remunerated={data.stats.remunerated}
          total={data.stats.total}
        />
      </div>
    </div>
  );
};

export default Dashboard;