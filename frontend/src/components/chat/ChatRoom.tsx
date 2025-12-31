import React, { useState, useRef, useEffect } from 'react';

const ChatInternal: React.FC = () => {
  const [messages, setMessages] = useState<{ text: string; type: 'sent' | 'received' }[]>([
    { text: "Bonjour, avez-vous terminé la tâche assignée?", type: 'received' },
    { text: "Oui, je l'ai finalisée hier soir.", type: 'sent' },
    { text: "Parfait! Merci pour votre réactivité.", type: 'received' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() === '') return;
    setMessages([...messages, { text: input, type: 'sent' }]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Chat interne</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-white rounded-lg shadow-md overflow-hidden">
          {/* Liste des contacts */}
          <div className="w-full md:w-1/4 border-r border-gray-200 p-4 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Contacts</h2>
            <div className="flex flex-col gap-2">
              {['Ahmed El Fassi', 'Fatima Zahra', 'Omar Benjelloun', 'Salma Idrissi'].map((name, idx) => (
                <div key={idx} className="p-2 rounded-md hover:bg-blue-100 cursor-pointer text-gray-800">
                  {name}
                </div>
              ))}
            </div>
          </div>

          {/* Fenêtre de chat */}
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 overflow-y-auto mb-4 space-y-3" style={{ maxHeight: '60vh' }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`px-4 py-2 rounded-lg max-w-[75%] ${
                    msg.type === 'sent'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tapez votre message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInternal;
