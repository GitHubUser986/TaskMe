import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../styles/sidebar.css';
import logo from '../../assets/taskme.png';

interface SidebarProps {
  userRole: 'superAdmin' | 'admin' | 'user';
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  roles: string[];
  path?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊', roles: ['superAdmin', 'admin', 'user'], path: '/dashboard' },
    {
      id: 'tasks',
      label: 'Gestion des tâches',
      icon: '📋',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'create-task', label: 'Créer une tâche', icon: '➕', roles: ['superAdmin', 'admin'], path: '/create-task' },
        { id: 'list-tasks', label: 'Liste des tâches', icon: '📝', roles: ['superAdmin', 'admin', 'user'], path: '/tasks' },
        { id: 'affectation', label: 'Affectation', icon: '👥', roles: ['superAdmin', 'admin'], path: '/affectation' }
      ]
    },
    { id: 'my-tasks', label: 'Mes tâches', icon: '✅', roles: ['superAdmin', 'admin', 'user'], path: '/my-tasks' },
    {
      id: 'users',
      label: 'Gestion utilisateurs',
      icon: '👤',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'create-user', label: 'Créer utilisateur', icon: '➕', roles: ['superAdmin', 'admin'], path: '/users/create' },
        { id: 'list-users', label: 'Liste utilisateurs', icon: '📋', roles: ['superAdmin', 'admin'], path: '/users' }
      ]
    },
    {
      id: 'vehicles',
      label: 'Gestion véhicules',
      icon: '🚗',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'add-vehicle', label: 'Ajouter véhicule', icon: '➕', roles: ['superAdmin', 'admin'], path: '/vehicles/add' },
        { id: 'list-vehicles', label: 'Liste véhicules', icon: '📋', roles: ['superAdmin', 'admin'], path: '/vehicles' }
      ]
    },
    {
      id: 'reports',
      label: 'Historique & Rapports',
      icon: '📈',
      roles: ['superAdmin', 'admin'],
      children: [
        { id: 'individual-history', label: 'Historique individuel', icon: '👤', roles: ['superAdmin', 'admin', 'user'], path: '/history/individual' },
        { id: 'global-history', label: 'Historique global', icon: '🌍', roles: ['superAdmin', 'admin'], path: '/history/global' },
        { id: 'reports', label: 'Rapports', icon: '📄', roles: ['superAdmin', 'admin'], path: '/reports' }
      ]
    },
    { id: 'chat', label: 'Communication', icon: '💬', roles: ['superAdmin', 'admin', 'user'], path: '/chat' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', roles: ['superAdmin', 'admin', 'user'], path: '/notifications' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️', roles: ['superAdmin', 'admin'], path: '/settings' }
  ];

  const hasAccess = (roles: string[]) => roles.includes(userRole);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasAccess(item.roles)) return null;

    const hasChildren = !!item.children?.length;
    const isExpanded = expandedMenus.includes(item.id);

    // Check if current URL matches any child path for active highlighting
    const isActive =
      item.path
        ? location.pathname === item.path
        : item.children?.some(child => location.pathname === child.path);

    return (
      <div key={item.id}>
        {hasChildren ? (
          <div
            className={`sidebar-item ${isActive ? 'active' : ''}`}
            style={{ paddingLeft: `${level + 1}rem` }}
            onClick={() => toggleMenu(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
            <span className="sidebar-arrow">{isExpanded ? '▼' : '▶'}</span>
          </div>
        ) : (
          <NavLink
            to={item.path!}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            style={{ paddingLeft: `${level + 1}rem` }}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        )}

        {hasChildren && isExpanded && (
          <div className="sidebar-submenu">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Taskme Logo" />
        <p className="sidebar-subtitle">Gestion des tâches</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="sidebar-item">
          <span className="sidebar-icon">👤</span>
          <span className="sidebar-label">Mon profil</span>
        </NavLink>

        <NavLink to="/logout" className="sidebar-item">
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">Déconnexion</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
