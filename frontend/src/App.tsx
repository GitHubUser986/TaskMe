import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userRole] = useState<'superAdmin' | 'admin' | 'user'>('admin');

  return (
    <div className="app">
      <Sidebar 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        userRole={userRole}
      />
      <div className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {/* Autres pages ici */}
      </div>
    </div>
  );
}

export default App;