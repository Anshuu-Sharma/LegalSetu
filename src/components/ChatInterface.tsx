import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Languages, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext';
import LocalizedText from './LocalizedText';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  language?: string;
}

const ChatInterface: React.FC = () => {
  const { language, t } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your AI legal assistant. I can help you with your legal queries. Please ask me any legal question.',
      sender: 'bot',
      timestamp: new Date(),
      language: 'en'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleResponses = [
    'In this case, Article 21 of the Indian Constitution gives you the right to life and personal liberty. You can appeal on this basis.',
    'For your case, I recommend the following legal actions: 1) File an FIR 2) Prepare legal documents 3) File a petition in court.',
    'This is a complex legal matter. You should consult an experienced lawyer. I can provide you with initial information.',
    'According to your document, this case falls under Section 420 of the Indian Penal Code. You can file a case for fraud.'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      language
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate bot response with translation
    setTimeout(async () => {
      const botText = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      const translatedBotText = await t(botText);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: translatedBotText,
        sender: 'bot',
        timestamp: new Date(),
        language
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInputText("I need help with my property matter");
      }, 2000);
    }
  };

  const toggleSpeech = (text: string) => {
    setIsSpeaking(!isSpeaking);
    if (!isSpeaking) {
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  // Quick action suggestions
  const quickSuggestions = [
    'Property matters',
    'Marriage law',
    'Business disputes',
    'Document review',
    'Court procedure'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <FileText className="w-7 h-7 text-white" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <LocalizedText text="Legal Assistant" />
                </h2>
                <p className="text-sm text-green-600 flex items-center font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <LocalizedText text="Online • Ready to help" />
                </p>
              </div>
            </div>
            
            {/* Language Selector (read-only) */}
            <div className="flex items-center space-x-3">
              <Languages className="w-5 h-5 text-gray-500" />
              <select
                value={language}
                disabled
                className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
                title="Change language from the top bar"
              >
                <option value={language}>{language}</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl h-96 overflow-y-auto p-6 border border-white/50 rounded-2xl shadow-xl mb-6"
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-lg ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">
                    <LocalizedText text={message.text} />
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs opacity-70 font-medium">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.sender === 'bot' && (
                      <button
                        onClick={() => toggleSpeech(message.text)}
                        className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-4 h-4 text-gray-600" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </motion.div>

        {/* Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your legal question here..."
                className="w-full px-6 py-4 pr-14 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500"
              />
              <button
                onClick={toggleRecording}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {quickSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInputText(`Tell me about ${suggestion.toLowerCase()}`)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl text-sm hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-gray-200 shadow-sm"
              >
                <LocalizedText text={suggestion} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;
