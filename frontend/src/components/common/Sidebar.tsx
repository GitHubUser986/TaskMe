import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListTodo, Users, Car, Clock, ChevronDown, ChevronUp, ClipboardCheck } from 'lucide-react';
import logo from '../../assets/taskme.png';

const Sidebar: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  const menuItems = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/my-tasks', icon: ClipboardCheck, label: 'Mes tâches' },
    { to: '/tasks', icon: ListTodo, label: 'Gestion des tâches' },
    { to: '/assignment', icon: ListTodo, label: 'Gestion des affectations' },
    { to: '/users', icon: Users, label: 'Gestion des utilisateurs' },
    { to: '/vehicles', icon: Car, label: 'Gestion des véhicules' },
  ];

  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl relative overflow-hidden">
      
      {/* Effet de fond animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      
      {/* Logo Section */}
      <div className="relative z-10 flex flex-col items-center py-8 border-b border-slate-700/50">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <img 
            src={logo} 
            alt="Taskme" 
            className="relative w-50 h-20 mb-3 rounded-lg shadow-xl" 
          />
        </div>
      </div>

      {/* Menu Navigation */}
      <nav className="mt-6 px-4 relative z-10">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} 
                />
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Historique avec dropdown sophistiqué */}
        <div className="mt-2">
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-300 group"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium">Historique</span>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 transition-transform duration-300" />
            ) : (
              <ChevronDown className="w-4 h-4 transition-transform duration-300" />
            )}
          </div>
          
          <div
            className={`overflow-hidden transition-all duration-300 ${
              expanded ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-4 space-y-1 border-l-2 border-slate-700 pl-4">
              <NavLink
                to="/history/individual"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white font-semibold border-l-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                Historique individuel
              </NavLink>
              <NavLink
                to="/history/global"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white font-semibold border-l-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                Historique global
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Sidebar;