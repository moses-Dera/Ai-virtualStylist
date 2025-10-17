import React, { useState, useRef, useEffect } from 'react';
import { getFashionAdvice } from '../services/geminiService';
import { ChatMessage, Product, UserProfile } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { CloseIcon } from './icons/CloseIcon';

interface FashionAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  products: Product[];
}

const FashionAssistant: React.FC<FashionAssistantProps> = ({ isOpen, onClose, userProfile, products }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: "Hello! I'm your personal stylist. How can I help you today? Try asking for 'a casual outfit for the weekend' or 'something for a business meeting'." },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await getFashionAdvice(input, userProfile, products);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'system', text: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[90vw] max-w-md h-[70vh] max-h-[600px] z-50 flex flex-col">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col h-full border border-gray-200">
        <header className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="font-bold text-lg text-gray-800">AI Fashion Assistant</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
              <div
                className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 ${
                  msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
                } ${msg.sender === 'system' ? 'bg-red-100 text-red-800 w-full text-center' : ''}`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>
               <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-white rounded-b-xl">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for style advice..."
              className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FashionAssistant;
