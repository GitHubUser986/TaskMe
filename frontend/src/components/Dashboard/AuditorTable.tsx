import React, { useState } from 'react';

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
  // Filtrer les auditeurs ayant au moins 1 tâche
  const auditorsWithTasks = auditors.filter(a => a.tasks > 0);
  const totalAuditors = auditors.length;
  const activeAuditors = auditorsWithTasks.length;

  // État de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculs de pagination
  const totalPages = Math.ceil(auditorsWithTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAuditors = auditorsWithTasks.slice(startIndex, endIndex);

  // Fonctions de navigation
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
          Répartition des tâches par auditeur
        </h3>
        <div style={{
          padding: '0.5rem 1rem',
          background: '#dbeafe',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#1e40af'
        }}>
          {activeAuditors} / {totalAuditors} auditeurs actifs
        </div>
      </div>

      {auditorsWithTasks.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '0.5rem'
        }}>
          Aucun auditeur avec des tâches assignées
        </div>
      ) : (
        <>
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
                {currentAuditors.map((auditor, index) => {
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
                  <td>{auditorsWithTasks.reduce((sum, a) => sum + a.tasks, 0)}</td>
                  <td>{auditorsWithTasks.reduce((sum, a) => sum + a.hours, 0)}h</td>
                  <td>{auditorsWithTasks.reduce((sum, a) => sum + a.remuneratedTasks, 0)}</td>
                  <td>{auditorsWithTasks.reduce((sum, a) => sum + a.nonRemuneratedTasks, 0)}</td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              {/* Info pagination */}
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Affichage de {startIndex + 1} à {Math.min(endIndex, auditorsWithTasks.length)} sur {auditorsWithTasks.length} auditeurs
              </div>

              {/* Contrôles de pagination */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  «
                </button>
                
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  ‹
                </button>

                {/* Numéros de pages */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Afficher toujours la première et dernière page
                    if (page === 1 || page === totalPages) return true;
                    // Afficher les pages autour de la page courante
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Ajouter "..." si nécessaire
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span style={{ padding: '0.5rem', color: '#9ca3af' }}>...</span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            background: currentPage === page ? '#3b82f6' : 'white',
                            color: currentPage === page ? 'white' : '#374151',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: currentPage === page ? 600 : 500,
                            minWidth: '2.5rem'
                          }}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  ›
                </button>

                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditorTable;