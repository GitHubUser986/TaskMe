import React, { useState } from 'react';

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

  const getBadgeClasses = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <span className="text-gray-600 font-medium">
            {unreadCount} non lues
          </span>
        </div>

        {/* Notifications list */}
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200 overflow-hidden">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex justify-between items-center px-6 py-4 ${
                notif.isRead ? 'bg-gray-50' : 'bg-white'
              } hover:bg-gray-100 transition-colors`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeClasses(
                    notif.type
                  )}`}
                >
                  {notif.type.toUpperCase()}
                </span>
                <div>
                  <h3 className="text-gray-900 font-semibold">{notif.title}</h3>
                  <p className="text-gray-700 text-sm">{notif.description}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(notif.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                >
                  Marquer comme lu
                </button>
              )}
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucune notification</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
