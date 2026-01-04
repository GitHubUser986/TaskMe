import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, Loader2, MessageSquare, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI, userAPI, affectationAPI } from '../../services/api';

interface Message {
  _id: string;
  ID: string;
  ID_EXPEDITEUR: string;
  ID_DESTINATAIRE: string;
  ID_TACHE: string;
  MESSAGE: string;
  DATE_ENVOI: string;
  LU?: boolean;
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
  lastMessageDate?: string;
  unread?: number;
  lastActivity?: Date;
}

interface Task {
  ID: string;
  NOM: string;
}

const ChatInternal: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollInterval = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charger les tâches de l'utilisateur
  const loadUserTasks = async () => {
    if (!user?.ID) return;

    try {
      const response = await affectationAPI.getUserTasks(user.ID);
      setTasks(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des tâches:", err);
    }
  };

  // Charger les contacts depuis la collection Affectation
  const loadContacts = async () => {
    if (!selectedTask || !user?.ID) return;
    
    try {
      const affectationsResponse = await affectationAPI.getByTask(selectedTask.ID);
      const affectations = affectationsResponse.data;
      
      const auditeurIds = affectations
        .flatMap((aff: any) => {
          if (Array.isArray(aff.ID_AUDITEUR)) {
            return aff.ID_AUDITEUR;
          }
          return [aff.ID_AUDITEUR];
        })
        .filter((id: string) => id && id !== user.ID);
      
      const uniqueAuditeurIds = [...new Set(auditeurIds)];
      
      if (uniqueAuditeurIds.length === 0) {
        setContacts([]);
        setActiveContact(null);
        return;
      }
      
      const participantsData: Contact[] = [];
      
      for (const auditeurId of uniqueAuditeurIds as string[]) {
        try {
          const userResponse = await userAPI.getById(auditeurId);
          const userData = userResponse.data.data.user;
          
          participantsData.push({
            id: userData.ID,
            name: `${userData.PRENOM} ${userData.NOM}`,
            email: userData.EMAIL,
            status: 'online',
            lastActivity: userData.DERNIERE_CONNEXION ? new Date(userData.DERNIERE_CONNEXION) : undefined,
            lastMessage: undefined,
            lastMessageDate: undefined,
            unread: undefined
          });
        } catch (err) {
          console.error(`Erreur lors du chargement de l'utilisateur ${auditeurId}:`, err);
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

  // Mettre à jour les contacts avec les infos des messages
  const updateContactsWithMessages = React.useCallback(() => {
    if (messages.length === 0) return;
    
    setContacts(prevContacts => 
      prevContacts.map(contact => {
        const contactMessages = messages.filter(m => 
          m.ID_EXPEDITEUR === contact.id || m.ID_DESTINATAIRE === contact.id
        );
        
        const lastMsg = contactMessages
          .sort((a, b) => 
            new Date(b.DATE_ENVOI).getTime() - new Date(a.DATE_ENVOI).getTime()
          )[0];
        
        const unreadCount = messages.filter(m => 
          m.ID_EXPEDITEUR === contact.id && 
          m.ID_DESTINATAIRE === user?.ID &&
          m.LU === false
        ).length;
        
        return {
          ...contact,
          status: 'online' as const,
          lastMessage: lastMsg?.MESSAGE,
          lastMessageDate: lastMsg?.DATE_ENVOI,
          unread: unreadCount > 0 ? unreadCount : undefined
        };
      }).sort((a, b) => {
        if (!a.lastMessageDate && !b.lastMessageDate) return 0;
        if (!a.lastMessageDate) return 1;
        if (!b.lastMessageDate) return -1;
        return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
      })
    );
  }, [messages, user?.ID]);

  // Charger les messages de la tâche
  const loadMessages = async () => {
    if (!selectedTask) return;
    
    try {
      setLoading(true);
      const response = await chatAPI.getMessages({ idTache: selectedTask.ID });
      setMessages(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du chargement des messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  // Marquer les messages comme lus quand on sélectionne un contact
  const markMessagesAsRead = async (contactId: string) => {
    if (!user?.ID || !selectedTask) return;
    
    const unreadMessages = messages.filter(m => 
      m.ID_EXPEDITEUR === contactId && 
      m.ID_DESTINATAIRE === user.ID &&
      m.LU === false
    );
    
    for (const msg of unreadMessages) {
      try {
        setMessages(prev => 
          prev.map(m => 
            m.ID === msg.ID ? { ...m, LU: true } : m
          )
        );
      } catch (err) {
        console.error('Erreur lors du marquage comme lu:', err);
      }
    }
  };

  // Charger les tâches au montage
  useEffect(() => {
    if (user?.ID) {
      loadUserTasks();
    }
  }, [user?.ID]);

  // Charger les contacts et messages quand la tâche change
  useEffect(() => {
    if (selectedTask) {
      loadContacts();
      loadMessages();
      
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      
      pollInterval.current = setInterval(() => {
        loadMessages();
        loadContacts();
      }, 5000);
    }
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [selectedTask?.ID]);

  // Mettre à jour les contacts quand les messages changent
  useEffect(() => {
    updateContactsWithMessages();
  }, [messages.length]); // Utiliser messages.length au lieu de messages

  // Marquer les messages comme lus quand on change de contact
  useEffect(() => {
    if (activeContact?.id) {
      markMessagesAsRead(activeContact.id);
    }
  }, [activeContact?.id, selectedTask?.ID]); // Ajouter selectedTask pour éviter les appels multiples

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (input.trim() === '' || !activeContact || !selectedTask || !user?.ID) return;
    
    setSending(true);
    try {
      const newMessage = {
        ID_EXPEDITEUR: user.ID,
        ID_DESTINATAIRE: activeContact.id,
        ID_TACHE: selectedTask.ID,
        MESSAGE: input
      };
      
      await chatAPI.sendMessage(newMessage);
      setInput('');
      await loadMessages();
      
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du message:', err);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedMessages = activeContact && user?.ID
    ? messages.filter(msg => 
        (msg.ID_EXPEDITEUR === user.ID && msg.ID_DESTINATAIRE === activeContact.id) ||
        (msg.ID_EXPEDITEUR === activeContact.id && msg.ID_DESTINATAIRE === user.ID)
      )
    : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Vous devez être connecté pour accéder au chat</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 relative">
          <div className="flex flex-col md:flex-row gap-4 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 p-8 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Chat Interne</h1>
              </div>
              <p className="text-gray-600">Communiquez avec votre équipe sur vos tâches</p>
              
              {/* Sélecteur de tâche */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border-1 border-white-500 mt-3">
                <label className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Sélectionner une tâche
                </label>
                <select
              value={selectedTask?.ID || ''}
              onChange={(e) => {
                const task = tasks.find(t => t.ID === e.target.value);
                setSelectedTask(task || null);
                setActiveContact(null);
              }}
              className="w-full md:w-96 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100"
            >
              <option value="">-- Sélectionner une tâche --</option>
              {tasks.map(task => (
                <option key={task.ID} value={task.ID}>
                  {task.NOM}
                </option>
              ))}
            </select>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-2xl font-semibold shadow-lg">
              {error}
            </div>
          )}
        </div>

        {selectedTask ? (
          <div className="flex flex-col md:flex-row gap-4 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="w-full md:w-80 border-r border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(200vh - 450px)' }}>
                {loading && contacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Chargement...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {contacts.length === 0 
                      ? 'Aucun autre auditeur affecté à cette tâche'
                      : 'Aucun contact trouvé'}
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-200 ${
                        activeContact?.id === contact.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {contact.name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 truncate">{contact.name}</h3>
                            {contact.unread && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {contact.unread}
                              </span>
                            )}
                          </div>
                          {contact.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {activeContact ? (
                <>
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {activeContact.name.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-800">{activeContact.name}</h2>
                          <p className="text-xs text-gray-500">{activeContact.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                          <Phone className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                          <Video className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50" style={{ maxHeight: 'calc(100vh - 450px)' }}>
                    {displayedMessages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun message. Commencez la conversation !</p>
                      </div>
                    ) : (
                      displayedMessages.map((msg) => {
                        const isSent = msg.ID_EXPEDITEUR === user.ID;
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
                                className={`px-4 py-3 rounded-2xl shadow-sm ${
                                  isSent
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
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

                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <Smile className="w-5 h-5" />
                      </button>
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tapez votre message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || input.trim() === ''}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">Sélectionnez un contact pour commencer la conversation</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sélectionnez une tâche</h3>
            <p className="text-gray-500">Choisissez une tâche ci-dessus pour voir les discussions</p>
          </div>
        )}
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