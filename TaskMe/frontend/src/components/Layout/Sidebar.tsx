import React, { useState } from 'react';
import '../../styles/sidebar.css';
import logo from '../../assets/taskme.png';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  userRole: 'superAdmin' | 'admin' | 'user';
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  roles: string[];
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, userRole }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['tasks', 'reports']);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: '📊',
      roles: ['superAdmin', 'admin', 'user']
    },
    {
      id: 'tasks',
      label: 'Gestion des tâches',
      icon: '📋',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'create-task', label: 'Créer une tâche', icon: '➕', roles: ['superAdmin', 'admin'] },
        { id: 'list-tasks', label: 'Liste des tâches', icon: '📝', roles: ['superAdmin', 'admin', 'user'] },
        { id: 'affectation', label: 'Affectation', icon: '👥', roles: ['superAdmin', 'admin'] }
      ]
    },
    {
      id: 'my-tasks',
      label: 'Mes tâches',
      icon: '✅',
      roles: ['superAdmin', 'admin', 'user']
    },
    {
      id: 'users',
      label: 'Gestion utilisateurs',
      icon: '👤',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'create-user', label: 'Créer utilisateur', icon: '➕', roles: ['superAdmin', 'admin'] },
        { id: 'list-users', label: 'Liste utilisateurs', icon: '📋', roles: ['superAdmin', 'admin'] }
      ]
    },
    {
      id: 'vehicles',
      label: 'Gestion véhicules',
      icon: '🚗',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'add-vehicle', label: 'Ajouter véhicule', icon: '➕', roles: ['superAdmin', 'admin'] },
        { id: 'list-vehicles', label: 'Liste véhicules', icon: '📋', roles: ['superAdmin', 'admin'] }
      ]
    },
    {
      id: 'reports',
      label: 'Historique & Rapports',
      icon: '📈',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'individual-history', label: 'Historique individuel', icon: '👤', roles: ['superAdmin', 'admin', 'user'] },
        { id: 'global-history', label: 'Historique global', icon: '🌍', roles: ['superAdmin', 'admin'] },
        { id: 'reports', label: 'Rapports', icon: '📄', roles: ['superAdmin', 'admin'] }
      ]
    },
    {
      id: 'chat',
      label: 'Communication',
      icon: '💬',
      roles: ['superAdmin', 'admin', 'user']
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      roles: ['superAdmin', 'admin', 'user']
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: '⚙️',
      roles: ['superAdmin', 'admin']
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const hasAccess = (roles: string[]) => {
    return roles.includes(userRole);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    if (!hasAccess(item.roles)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = currentPage === item.id;

    return (
      <div key={item.id}>
        <div
          className={`sidebar-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${level * 1 + 1}rem` }}
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              onPageChange(item.id);
            }
          }}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span className="sidebar-label">{item.label}</span>
          {hasChildren && (
            <span className="sidebar-arrow">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="sidebar-submenu">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logo} alt="Taskme Logo" />
        </div>
        <p className="sidebar-subtitle">Gestion des tâches</p>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {userRole === 'superAdmin' ? '👑' : userRole === 'admin' ? '👨‍💼' : '👤'}
        </div>
        <div className="user-info">
          <div className="user-name">Ahmed El Fassi</div>
          <div className="user-role">
            {userRole === 'superAdmin' ? 'Super Admin' : 
             userRole === 'admin' ? 'Coordinateur' : 'Auditeur'}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-item" onClick={() => onPageChange('profile')}>
          <span className="sidebar-icon">👤</span>
          <span className="sidebar-label">Mon profil</span>
        </div>
        <div className="sidebar-item" onClick={() => onPageChange('logout')}>
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">Déconnexion</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;