import React, { useState } from 'react';
import { 
  Bell, Info, CheckCircle, AlertTriangle, XCircle, 
  Check, Trash2, Filter, Search, Clock 
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Nouvelle tâche assignée',
      description: 'Vous avez été assigné à la formation React avancé.',
      date: '2026-01-15',
      type: 'info',
      isRead: false,
    },
    {
      id: 2,
      title: 'Rappel réunion',
      description: 'La réunion sur le projet PFE commencera à 14h.',
      date: '2026-01-14',
      type: 'warning',
      isRead: true,
    },
    {
      id: 3,
      title: 'Tâche terminée',
      description: 'La tâche "Audit qualité" a été validée par le responsable.',
      date: '2026-01-13',
      type: 'success',
      isRead: false,
    },
    {
      id: 4,
      title: 'Erreur système',
      description: 'Un problème technique est survenu lors de la sauvegarde des données.',
      date: '2026-01-12',
      type: 'error',
      isRead: true,
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getIconAndColor = (type: string) => {
    switch (type) {
      case 'info':
        return { icon: Info, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
      case 'success':
        return { icon: CheckCircle, color: 'from-green-500 to-green-600', bg: 'bg-green-500/20', border: 'border-green-500/30' };
      case 'warning':
        return { icon: AlertTriangle, color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
      case 'error':
        return { icon: XCircle, color: 'from-red-500 to-red-600', bg: 'bg-red-500/20', border: 'border-red-500/30' };
      default:
        return { icon: Bell, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications
    .filter((notif) => filter === 'all' || !notif.isRead)
    .filter((notif) => 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen relative overflow-hidden">

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray">Notifications</h1>
                <p className="text-gray-400 mt-1">
                  {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-all duration-300 flex items-center gap-2 border border-blue-500/30 font-semibold"
              >
                <Check className="w-4 h-4" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-slate-800/100 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une notification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-slate-700/50 text-gray-400 hover:text-white'
                }`}
              >
                <Filter className="w-4 h-4" />
                Toutes
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-slate-700/50 text-gray-400 hover:text-white'
                }`}
              >
                Non lues
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-slate-800/100 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchQuery ? 'Aucune notification trouvée' : 'Aucune notification'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const { icon: Icon, color, bg, border } = getIconAndColor(notif.type);
              
              return (
                <div
                  key={notif.id}
                  className={`bg-slate-800/100 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl ${
                    notif.isRead 
                      ? 'border-slate-700/100 opacity-75' 
                      : 'border-blue-500/70 shadow-lg shadow-blue-500/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-3 bg-gradient-to-br ${color} rounded-xl shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-bold text-white">{notif.title}</h3>
                        {!notif.isRead && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-gray-400 mb-3">{notif.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {new Date(notif.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all duration-300 flex items-center gap-2 border border-blue-500/30 text-sm font-semibold"
                            >
                              <Check className="w-4 h-4" />
                              Marquer lu
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300 border border-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;