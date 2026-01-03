import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, User, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ChatInternal from './chat/ChatInternal';
import { tacheAPI } from '../services/api';

interface Task {
  ID: string;
  TITRE: string;
  DESCRIPTION: string;
  STATUT: string;
  PRIORITE: string;
  DATE_DEBUT: string;
  DATE_FIN: string;
  ID_AFFECTATION?: string;
}

interface TaskDetailPageProps {
  // Si vous utilisez un context d'authentification
  currentUserId: string; // Ex: "USER123"
}

const TaskDetailPage: React.FC<TaskDetailPageProps> = ({ currentUserId }) => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      if (!id) return;
      
      try {
        const response = await tacheAPI.getById(id);
        setTask(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement de la tâche:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-gray-600">Chargement de la tâche...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-red-600">Tâche non trouvée</div>
      </div>
    );
  }

  const getStatusBadge = (statut: string) => {
    const config = {
      'EN_COURS': { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Clock },
      'TERMINEE': { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'EN_ATTENTE': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    };

    const statusInfo = config[statut as keyof typeof config] || config['EN_ATTENTE'];
    const Icon = statusInfo.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        <Icon className="w-4 h-4" />
        {statusInfo.label}
      </span>
    );
  };

  const getPriorityBadge = (priorite: string) => {
    const config = {
      'HAUTE': { label: 'Haute', color: 'bg-red-100 text-red-800' },
      'MOYENNE': { label: 'Moyenne', color: 'bg-orange-100 text-orange-800' },
      'BASSE': { label: 'Basse', color: 'bg-gray-100 text-gray-800' },
    };

    const priorityInfo = config[priorite as keyof typeof config] || config['MOYENNE'];

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.color}`}>
        {priorityInfo.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête de la tâche */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{task.TITRE}</h1>
              <div className="flex items-center gap-4">
                {getStatusBadge(task.STATUT)}
                {getPriorityBadge(task.PRIORITE)}
              </div>
            </div>
            
            {/* Bouton pour afficher/masquer le chat */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                showChat
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              {showChat ? 'Masquer le chat' : 'Afficher le chat'}
            </button>
          </div>

          {/* Informations de la tâche */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <span className="text-sm text-gray-500">Date de début :</span>
                <p className="font-medium">
                  {new Date(task.DATE_DEBUT).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <div>
                <span className="text-sm text-gray-500">Date de fin :</span>
                <p className="font-medium">
                  {new Date(task.DATE_FIN).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{task.DESCRIPTION}</p>
          </div>
        </div>

        {/* Section Chat - Conditionnellement affichée */}
        {showChat && (
          <div className="mb-6 animate-fadeIn">
            <ChatInternal 
              idTache={task.ID} 
              currentUserId={currentUserId} 
            />
          </div>
        )}

        {/* Autres sections de la tâche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Documents attachés */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
            <p className="text-gray-500 text-sm">Aucun document attaché</p>
          </div>

          {/* Membres de l'équipe */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Équipe</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div>
                <p className="font-medium text-gray-800">Ahmed El Fassi</p>
                <p className="text-sm text-gray-500">Responsable</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default TaskDetailPage;