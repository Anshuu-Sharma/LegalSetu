// import React, { useState, useRef, useEffect } from 'react';
// import { Send, Mic, MicOff, Volume2, VolumeX, Languages, FileText, Sparkles } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useTranslation } from '../contexts/TranslationContext';
// import LocalizedText from './LocalizedText';

// interface Message {
//   id: string;
//   text: string;
//   sender: 'user' | 'bot';
//   timestamp: Date;
//   language?: string;
// }

// const ChatInterface: React.FC = () => {
//   const { language, t } = useTranslation();

//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: '1',
//       text: 'Hello! I am your AI legal assistant. I can help you with your legal queries. Please ask me any legal question.',
//       sender: 'bot',
//       timestamp: new Date(),
//       language: 'en'
//     }
//   ]);
//   const [inputText, setInputText] = useState('');
//   const [isRecording, setIsRecording] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const sampleResponses = [
//     'In this case, Article 21 of the Indian Constitution gives you the right to life and personal liberty. You can appeal on this basis.',
//     'For your case, I recommend the following legal actions: 1) File an FIR 2) Prepare legal documents 3) File a petition in court.',
//     'This is a complex legal matter. You should consult an experienced lawyer. I can provide you with initial information.',
//     'According to your document, this case falls under Section 420 of the Indian Penal Code. You can file a case for fraud.'
//   ];

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleSendMessage = async () => {
//     if (!inputText.trim()) return;

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       text: inputText,
//       sender: 'user',
//       timestamp: new Date(),
//       language
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInputText('');

//     // Simulate bot response with translation
//     setTimeout(async () => {
//       const botText = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
//       const translatedBotText = await t(botText);

//       const botResponse: Message = {
//         id: (Date.now() + 1).toString(),
//         text: translatedBotText,
//         sender: 'bot',
//         timestamp: new Date(),
//         language
//       };
//       setMessages(prev => [...prev, botResponse]);
//     }, 1000);
//   };

//   const toggleRecording = () => {
//     setIsRecording(!isRecording);
//     if (!isRecording) {
//       setTimeout(() => {
//         setIsRecording(false);
//         setInputText("I need help with my property matter");
//       }, 2000);
//     }
//   };

//   const toggleSpeech = (text: string) => {
//     setIsSpeaking(!isSpeaking);
//     if (!isSpeaking) {
//       setTimeout(() => setIsSpeaking(false), 3000);
//     }
//   };

//   // Quick action suggestions
//   const quickSuggestions = [
//     'Property matters',
//     'Marriage law',
//     'Business disputes',
//     'Document review',
//     'Court procedure'
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 pt-28">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 mb-6"
//         >
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <motion.div
//                 animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
//                 transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
//                 className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg"
//               >
//                 <FileText className="w-7 h-7 text-white" />
//                 <div className="absolute -top-1 -right-1">
//                   <Sparkles className="w-4 h-4 text-yellow-400" />
//                 </div>
//               </motion.div>
//               <div>
//                 <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   <LocalizedText text="Legal Assistant" />
//                 </h2>
//                 <p className="text-sm text-green-600 flex items-center font-medium">
//                   <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                   <LocalizedText text="Online • Ready to help" />
//                 </p>
//               </div>
//             </div>
            
//             {/* Language Selector (read-only) */}
//             <div className="flex items-center space-x-3">
//               <Languages className="w-5 h-5 text-gray-500" />
//               <select
//                 value={language}
//                 disabled
//                 className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
//                 title="Change language from the top bar"
//               >
//                 <option value={language}>{language}</option>
//               </select>
//             </div>
//           </div>
//         </motion.div>

//         {/* Chat Messages */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="bg-white/80 backdrop-blur-xl h-96 overflow-y-auto p-6 border border-white/50 rounded-2xl shadow-xl mb-6"
//         >
//           <AnimatePresence>
//             {messages.map((message) => (
//               <motion.div
//                 key={message.id}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -20 }}
//                 className={`mb-6 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-lg ${
//                   message.sender === 'user'
//                     ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
//                     : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
//                 }`}>
//                   <p className="text-sm leading-relaxed">
//                     <LocalizedText text={message.text} />
//                   </p>
//                   <div className="flex items-center justify-between mt-3">
//                     <span className="text-xs opacity-70 font-medium">
//                       {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                     </span>
//                     {message.sender === 'bot' && (
//                       <button
//                         onClick={() => toggleSpeech(message.text)}
//                         className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
//                       >
//                         {isSpeaking ? (
//                           <VolumeX className="w-4 h-4 text-gray-600" />
//                         ) : (
//                           <Volume2 className="w-4 h-4 text-gray-600" />
//                         )}
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </motion.div>
//             ))}
//           </AnimatePresence>
//           <div ref={messagesEndRef} />
//         </motion.div>

//         {/* Input Area */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50"
//         >
//           <div className="flex items-center space-x-4">
//             <div className="flex-1 relative">
//               <input
//                 type="text"
//                 value={inputText}
//                 onChange={(e) => setInputText(e.target.value)}
//                 onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//                 placeholder="Type your legal question here..."
//                 className="w-full px-6 py-4 pr-14 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500"
//               />
//               <button
//                 onClick={toggleRecording}
//                 className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
//                   isRecording 
//                     ? 'bg-red-500 text-white animate-pulse shadow-lg' 
//                     : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
//                 }`}
//               >
//                 {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
//               </button>
//             </div>
            
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={handleSendMessage}
//               disabled={!inputText.trim()}
//               className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
//             >
//               <Send className="w-5 h-5" />
//             </motion.button>
//           </div>
          
//           {/* Quick Actions */}
//           <div className="mt-6 flex flex-wrap gap-3">
//             {quickSuggestions.map((suggestion, index) => (
//               <motion.button
//                 key={index}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={() => setInputText(`Tell me about ${suggestion.toLowerCase()}`)}
//                 className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl text-sm hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-gray-200 shadow-sm"
//               >
//                 <LocalizedText text={suggestion} />
//               </motion.button>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default ChatInterface;



import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatHeader from './ChatHeader.tsx';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'typing';
  language?: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const chatRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Can my landlord evict me without notice in India?',
    'What should I do if I was fired without reason?',
    'How to file a workplace harassment complaint?',
    'Are verbal contracts valid under Indian law?',
    'What are my rights if police arrest me?',
  ];

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  const sendMessage = (msg?: string) => {
    if (isThinking) return;
    const text = msg || inputText.trim();
    if (!text) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    triggerBotReply(text);
  };

  const triggerBotReply = async (userMessage: string) => {
    setIsThinking(true);
    const thinkingMsg: Message = { id: 'typing', text: '', sender: 'typing' };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      // Extract last 5 user messages for context
      const userHistory = messages
        .filter((m) => m.sender === 'user')
        .map((m) => m.text)
        .slice(-5);

      const response = await fetch('http://localhost:5000/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          language: selectedLanguage,
          history: userHistory,
        }),
      });

      const data = await response.json();
      const botReply = data.reply || 'Sorry, I couldn’t find an answer.';

      setMessages((prev) => prev.filter((msg) => msg.id !== 'typing'));
      animateBotTyping(botReply);
    } catch (err) {
      console.error('❌ API Error:', err);
      setMessages((prev) => prev.filter((msg) => msg.id !== 'typing'));
      animateBotTyping('⚠️ Failed to get a response. Please try again.');
    }
  };

  const animateBotTyping = (fullText: string) => {
    const botId = Date.now().toString();
    const botMessage: Message = { id: botId, text: '', sender: 'bot' };
    setMessages((prev) => [...prev, botMessage]);
    setTypingId(botId);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= fullText.length) {
        clearInterval(interval);
        setTypingId(null);
        setIsThinking(false);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, text: fullText.slice(0, i + 1) } : m
          )
        );
        i++;
      }
    }, 20);
  };

  const toggleMic = () => {
    if (isThinking) return;
    setIsRecording((prev) => !prev);
    if (!isRecording) {
      setTimeout(() => {
        sendMessage('Tell me about employment clauses.');
        setIsRecording(false);
      }, 2000);
    }
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 max-w-3xl mx-auto">
      <ChatHeader selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />

      <div
        ref={chatRef}
        className="bg-white h-[420px] rounded-xl shadow border border-gray-200 p-4 overflow-y-auto"
      >
        <AnimatePresence>
          {messages.map((msg) =>
            msg.sender === 'typing' ? (
              <motion.div
                key="thinking"
                className="flex justify-start mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm">
                  <span className="flex space-x-1">
                    <span className="w-2 h-2 rounded-full bg-gray-600 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-gray-600 animate-bounce delay-150" />
                    <span className="w-2 h-2 rounded-full bg-gray-600 animate-bounce delay-300" />
                  </span>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={msg.id}
                className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-end gap-2 max-w-[80%]">
                  {msg.sender === 'bot' && (
                    <div
                      onClick={() => speakText(msg.text)}
                      className="cursor-pointer w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-lg font-bold"
                      title="Click to listen"
                    >
                      ⚖️
                    </div>
                  )}
                  <div
                    className={`relative px-4 py-2 text-sm rounded-xl shadow ${
                      msg.sender === 'user'
                        ? 'bg-gray-800 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 border border-gray-300 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center text-lg font-bold">
                      🙋
                    </div>
                  )}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            disabled={isThinking}
            onClick={() => sendMessage(s)}
            className={`px-3 py-1 text-sm rounded-full transition ${
              isThinking
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mt-4 flex items-center gap-3 bg-white p-4 rounded-xl border shadow">
        <div className="relative flex-1">
          <input
            type="text"
            className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 ${
              isThinking ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300'
            }`}
            placeholder="Ask something about Indian law..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isThinking}
          />
          <button
            onClick={toggleMic}
            disabled={isThinking}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => sendMessage()}
          disabled={!inputText.trim() || isThinking}
          className="bg-gray-800 text-white p-3 rounded-xl hover:bg-gray-700 disabled:opacity-50"
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  );
};

export default ChatInterface;
