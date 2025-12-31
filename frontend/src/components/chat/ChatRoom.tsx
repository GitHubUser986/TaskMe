import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, Smile, Paperclip, User } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: string;
  unread?: number;
}

const ChatInternal: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; type: 'sent' | 'received'; time: string }[]>([
    { text: "Bonjour, avez-vous terminé la tâche assignée?", type: 'received', time: '10:30' },
    { text: "Oui, je l'ai finalisée hier soir.", type: 'sent', time: '10:32' },
    { text: "Parfait! Merci pour votre réactivité.", type: 'received', time: '10:33' },
  ]);
  
  const [contacts] = useState<Contact[]>([
    { id: 1, name: 'Ahmed El Fassi', status: 'online', lastMessage: 'Parfait! Merci...', unread: 2 },
    { id: 2, name: 'Fatima Zahra', status: 'online', lastMessage: 'Je termine ça demain' },
    { id: 3, name: 'Omar Benjelloun', status: 'away', lastMessage: 'D\'accord, à plus tard' },
    { id: 4, name: 'Salma Idrissi', status: 'offline', lastMessage: 'Super, merci!' },
  ]);
  
  const [activeContact, setActiveContact] = useState<Contact>(contacts[0]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === '') return;
    const now = new Date();
    const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    setMessages([...messages, { text: input, type: 'sent', time }]);
    setInput('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen from-slate-900 via-slate-800 to-slate-900 py-8 relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray mb-2">Chat Interne</h1>
          <p className="text-gray-400">Communiquez avec votre équipe en temps réel</p>
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
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`p-4 cursor-pointer transition-all duration-300 border-b border-slate-700/100 ${
                    activeContact.id === contact.id
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
              ))}
            </div>
          </div>

          {/* Fenêtre de chat */}
          <div className="flex-1 flex flex-col">
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
                    <p className="text-xs text-gray-400 capitalize">{activeContact.status}</p>
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
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`max-w-[75%] ${msg.type === 'sent' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg ${
                        msg.type === 'sent'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                          : 'bg-slate-700/50 text-white rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className={`text-xs text-gray-400 mt-1 block ${msg.type === 'sent' ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
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
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 flex items-center gap-2 font-semibold"
                >
                  <Send className="w-5 h-5" />
                  Envoyer
                </button>
              </div>
            </div>
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