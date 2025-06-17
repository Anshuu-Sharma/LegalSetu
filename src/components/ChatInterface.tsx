/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';

import { Send, Mic, MicOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatHeader from './ChatHeader.tsx';
import { useTranslation } from '../contexts/TranslationContext';
const apiUrl = import.meta.env.VITE_API_URL;
import { Sparkles } from 'lucide-react';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'typing';
  language?: string;
}

const defaultSuggestions = [
  'Can my landlord evict me without notice in India?',
  'What should I do if I was fired without reason?',
  'How to file a workplace harassment complaint?',
  'Are verbal contracts valid under Indian law?',
  'What are my rights if police arrest me?',
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { language, headerTitle, headerSubtitle, t } = useTranslation();
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [inputPlaceholder, setInputPlaceholder] = useState('Ask something about Indian law...');

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    const translateAll = async () => {
      const translatedSuggestions = await Promise.all(defaultSuggestions.map((s) => t(s)));
      const translatedPlaceholder = await t('Ask something about Indian law...');
      if (isMounted) {
        setSuggestions(translatedSuggestions);
        setInputPlaceholder(translatedPlaceholder);
      }
    };
    translateAll();
    return () => {
      isMounted = false;
    };
  }, [language, t]);

  const sendMessage = (msg?: string) => {
    if (isThinking) return;
    const text = msg || inputText.trim();
    if (!text) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      language,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    triggerBotReply(text);
  };

  const apiUrl = import.meta.env.VITE_API_URL;



  const triggerBotReply = async (userMessage: string) => {
    setIsThinking(true);
    const thinkingMsg: Message = { id: 'typing', text: '', sender: 'typing' };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const userHistory = messages.filter((m) => m.sender === 'user').map((m) => m.text).slice(-5);
      const response = await fetch(`${apiUrl}/api/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          language: language,
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
          prev.map((m) => (m.id === botId ? { ...m, text: fullText.slice(0, i + 1) } : m))
        );
        i++;
      }
    }, 20);
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language || 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (isThinking) return;

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (!isRecording) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = language || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
        sendMessage(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };
  const localizedText = {
    headerTitle: "Legal Assistant",
    headerSubtitle: "Get reliable legal guidance from AI in real-time.",
    welcomeMessage: "Hello! How may I assist you today?",
  };
  // const [messages, setMessages] = useState<Message[]>([]);
  // Load chat history from sessionStorage on mount
// Load from sessionStorage on mount
// Restore from sessionStorage once on mount
useEffect(() => {
  const saved = sessionStorage.getItem('chatMessages');
  if (saved) {
    try {
      const parsed: Message[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
        console.log('✅ Restored messages from session:', parsed);
      }
    } catch (error) {
      console.error('❌ Failed to parse saved chat:', error);
    }
  }
}, []);

// Debounced save to sessionStorage on message updates
useEffect(() => {
  const timeout = setTimeout(() => {
    sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    console.log('✅ Final save to session:', messages);
  }, 500); // Save only after 500ms of inactivity

  return () => clearTimeout(timeout); // Prevent multiple rapid saves
}, [messages]);




return (
 <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-white to-[#f3e8ff] py-12 px-4">

    {/* Chat Header */}
    
  <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8"
    >
      <ChatHeader title={localizedText.headerTitle} subtitle={localizedText.headerSubtitle} />
    </motion.div>

    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <aside className="md:col-span-1 space-y-4">
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-3xl p-6 shadow-xl sticky top-8"
  >
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="text-blue-500 w-5 h-5" />
      <h2 className="text-base font-semibold text-gray-800 tracking-tight">
        Try asking
      </h2>
    </div>

    <div className="space-y-3">
      {suggestions.map((s, idx) => (
        <motion.button
          key={idx}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.03 }}
          className={`w-full px-4 py-2 text-sm text-left font-medium rounded-full border transition-all duration-300 shadow-sm
            ${
              isThinking
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100'
                : 'bg-white text-gray-800 hover:bg-blue-50 hover:text-blue-700 border-gray-200'
            }`}
          onClick={() => sendMessage(s)}
          disabled={isThinking}
        >
          {s}
        </motion.button>
      ))}
    </div>
  </motion.div>
</aside>


      {/* Chat Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="md:col-span-3 flex flex-col h-[500px] bg-white/70 backdrop-blur-xl border border-gray-300 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Chat Body */}
        <div ref={chatRef} className="flex-1 p-6 space-y-4 overflow-y-auto">
          <AnimatePresence initial={false}>
            {/* Welcome Message */}
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg shadow">
                  🤖
                </div>
                <div className="relative px-4 py-3 text-sm rounded-2xl shadow bg-blue-50/90 border border-blue-100 rounded-bl-none">
                  {localizedText.welcomeMessage}
                </div>
              </div>
            </motion.div>

            {/* Messages */}
            {messages.map((msg) =>
              msg.sender === 'typing' ? (
                <motion.div
                  key="thinking"
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl flex items-center gap-2 text-sm shadow">
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-150" />
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-300" />
                    </div>
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {msg.sender === 'bot' && (
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg shadow">
                        🤖
                      </div>
                    )}
                    <div
                      className={`relative group px-4 py-3 text-sm rounded-2xl transition-all duration-300 shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-gray-800 text-white rounded-br-none'
                          : 'bg-white/80 backdrop-blur-lg border border-blue-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {msg.text.split('\n').map((line, i) => (
                        <p
                          key={i}
                          className={`mb-1 whitespace-pre-wrap ${
                            line.trim().startsWith('-') ? 'pl-4 list-disc list-inside' : ''
                          }`}
                        >
                          {line}
                        </p>
                      ))}

                      {msg.sender === 'bot' && (
                        <button
                          onClick={() => speakText(msg.text)}
                          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full bg-white shadow hover:bg-blue-100"
                          title="Read aloud"
                        >
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M11 5L7 9H4v6h3l4 4V5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15.54 8.46a5 5 0 010 7.07m2.12-9.19a9 9 0 010 12.73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="w-9 h-9 rounded-full bg-gray-300 text-gray-900 flex items-center justify-center text-lg font-semibold shadow">
                        🙋
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t bg-white/60 backdrop-blur flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              className={`w-full px-4 py-3 pr-12 rounded-full text-sm border focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                isThinking
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'border-gray-300'
              }`}
              placeholder={inputPlaceholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isThinking}
            />
            <button
              onClick={toggleMic}
              disabled={isThinking}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                isRecording
                  ? 'text-red-600 animate-pulse drop-shadow-md'
                  : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.07 }}
            onClick={() => sendMessage()}
            disabled={!inputText.trim() || isThinking}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </motion.div>
    </div>
</div>
);






}


export default ChatInterface;
