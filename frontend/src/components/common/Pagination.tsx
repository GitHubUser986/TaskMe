import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1.5rem',
      paddingTop: '1rem',
      borderTop: '1px solid #e5e7eb'
    }}>
      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        Affichage de {startIndex + 1} à {endIndex} sur {totalItems}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <PaginationButton
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          «
        </PaginationButton>
        
        <PaginationButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </PaginationButton>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => {
            if (page === 1 || page === totalPages) return true;
            return Math.abs(page - currentPage) <= 1;
          })
          .map((page, index, array) => {
            const prevPage = array[index - 1];
            const showEllipsis = prevPage && page - prevPage > 1;

            return (
              <React.Fragment key={page}>
                {showEllipsis && (
                  <span style={{ padding: '0.5rem', color: '#9ca3af' }}>...</span>
                )}
                <PaginationButton
                  onClick={() => onPageChange(page)}
                  active={currentPage === page}
                >
                  {page}
                </PaginationButton>
              </React.Fragment>
            );
          })}

        <PaginationButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ›
        </PaginationButton>

        <PaginationButton
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          »
        </PaginationButton>
      </div>
    </div>
  );
};

// Composant bouton réutilisable
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

const PaginationButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled, 
  active, 
  children 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '0.5rem 0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      background: disabled ? '#f3f4f6' : active ? '#3b82f6' : 'white',
      color: disabled ? '#9ca3af' : active ? 'white' : '#374151',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '0.875rem',
      fontWeight: active ? 600 : 500,
      minWidth: '2.5rem'
    }}
  >
    {children}
  </button>
);

export default Pagination;