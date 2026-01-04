import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, Loader2 } from 'lucide-react';
import { chatAPI, userAPI } from '../../services/api';
import onlineStatusService from '../../services/onlineStatusService';

interface Message {
  _id: string;
  ID: string;
  ID_EXPEDITEUR: string;
  ID_DESTINATAIRE: string;
  ID_TACHE: string;
  MESSAGE: string;
  DATE_ENVOI: string;
  expediteur?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: string;
  unread?: number;
}

interface ChatInternalProps {
  idTache: string; // ID de la tâche pour le chat
  currentUserId: string; // ID de l'utilisateur connecté
}

const ChatInternal: React.FC<ChatInternalProps> = ({ idTache, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialiser le service de statut en ligne
  useEffect(() => {
    onlineStatusService.initialize(currentUserId);
    
    return () => {
      onlineStatusService.cleanup();
    };
  }, [currentUserId]);

  // Charger les participants (contacts) de la tâche
  const loadContacts = async () => {
    try {
      const response = await chatAPI.getMessages({ 
        idTache,
        currentUserId 
      });
      
      // Extraire les participants uniques
      const participantIds = new Set<string>();
      response.data.forEach((msg: Message) => {
        participantIds.add(msg.ID_EXPEDITEUR);
        participantIds.add(msg.ID_DESTINATAIRE);
      });
      
      // Retirer l'utilisateur actuel
      participantIds.delete(currentUserId);
      
      // Charger les infos des participants
      const participantsData: Contact[] = [];
      
      for (const participantId of participantIds) {
        try {
          const userResponse = await userAPI.getById(participantId);
          const user = userResponse.data;
          
          // Trouver le dernier message de ce contact
          const lastMsg = response.data
            .filter((m: Message) => m.ID_EXPEDITEUR === participantId)
            .sort((a: Message, b: Message) => 
              new Date(b.DATE_ENVOI).getTime() - new Date(a.DATE_ENVOI).getTime()
            )[0];
          
          // Compter les messages non lus (pour cette démo, on compte juste les messages)
          const unreadCount = response.data.filter(
            (m: Message) => m.ID_EXPEDITEUR === participantId && m.ID_DESTINATAIRE === currentUserId
          ).length;
          
          participantsData.push({
            id: user.ID,
            name: `${user.PRENOM} ${user.NOM}`,
            email: user.EMAIL,
            status: onlineStatusService.getStatus(user.ID),
            lastMessage: lastMsg?.MESSAGE,
            unread: unreadCount > 0 ? unreadCount : undefined
          });

        } catch (err) {
          console.error(`Erreur lors du chargement de l'utilisateur ${participantId}:`, err);
        }
      }
      
      setContacts(participantsData);
      if (participantsData.length > 0 && !activeContact) {
        setActiveContact(participantsData[0]);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des contacts:', err);
      setError('Erreur lors du chargement des contacts');
    }
  };

  // Charger les messages de la tâche
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages({ idTache });
      setMessages(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du chargement des messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadMessages();
    loadContacts();
    
    // Polling pour les nouveaux messages (toutes les 5 secondes)
    pollInterval.current = setInterval(() => {
      loadMessages();
      // Mettre à jour les statuts
      setContacts(prevContacts => 
        prevContacts.map(contact => ({
          ...contact,
          status: onlineStatusService.getStatus(contact.id)
        }))
      );
    }, 5000);
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [idTache]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (input.trim() === '' || !activeContact) return;
    
    setSending(true);
    try {
      const newMessage = {
        ID_EXPEDITEUR: currentUserId,
        ID_DESTINATAIRE: activeContact.id,
        ID_TACHE: idTache,
        MESSAGE: input
      };
      
      await chatAPI.sendMessage(newMessage);
      setInput('');
      
      // Recharger les messages
      await loadMessages();
      
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du message:', err);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'away': return 'Absent';
      case 'offline': return 'Hors ligne';
      default: return 'Inconnu';
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer les messages pour le contact actif
  const displayedMessages = activeContact 
    ? messages.filter(msg => 
        (msg.ID_EXPEDITEUR === currentUserId && msg.ID_DESTINATAIRE === activeContact.id) ||
        (msg.ID_EXPEDITEUR === activeContact.id && msg.ID_DESTINATAIRE === currentUserId)
      )
    : [];

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen from-slate-900 via-slate-800 to-slate-900 py-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-white">Chargement du chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-slate-900 via-slate-800 to-slate-900 py-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Chat de la tâche</h1>
          <p className="text-gray-400">Communiquez avec votre équipe sur cette tâche</p>
          {error && (
            <div className="mt-2 bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-slate-800/100 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
          {/* Liste des contacts */}
          <div className="w-full md:w-80 border-r border-slate-700/50 bg-slate-900/30">
            {/* Header contacts */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  Aucun participant trouvé
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setActiveContact(contact)}
                    className={`p-4 cursor-pointer transition-all duration-300 border-b border-slate-700/100 ${
                      activeContact?.id === contact.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-l-4 border-l-blue-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {contact.name.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor(contact.status)} rounded-full border-2 border-slate-900`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white truncate">{contact.name}</h3>
                          {contact.unread && (
                            <span className="bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {contact.unread}
                            </span>
                          )}
                        </div>
                        {contact.lastMessage && (
                          <p className="text-sm text-gray-400 truncate">{contact.lastMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fenêtre de chat */}
          <div className="flex-1 flex flex-col">
            {activeContact ? (
              <>
                {/* Header chat */}
                <div className="p-4 border-b border-slate-700/50 bg-slate-900/100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {activeContact.name.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(activeContact.status)} rounded-full border-2 border-slate-900`}></div>
                      </div>
                      <div>
                        <h2 className="font-semibold text-white">{activeContact.name}</h2>
                        <p className="text-xs text-gray-400">{getStatusLabel(activeContact.status)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                  {displayedMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      Aucun message. Commencez la conversation !
                    </div>
                  ) : (
                    displayedMessages.map((msg) => {
                      const isSent = msg.ID_EXPEDITEUR === currentUserId;
                      const time = new Date(msg.DATE_ENVOI).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                      
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                        >
                          <div className={`max-w-[75%] ${isSent ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-lg ${
                                isSent
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                                  : 'bg-slate-700/50 text-white rounded-bl-sm'
                              }`}
                            >
                              {msg.MESSAGE}
                            </div>
                            <span className={`text-xs text-gray-400 mt-1 block ${isSent ? 'text-right' : 'text-left'}`}>
                              {time}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input zone */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                      <Smile className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Tapez votre message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || input.trim() === ''}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Sélectionnez un contact pour commencer la conversation
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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

export default ChatInternal;