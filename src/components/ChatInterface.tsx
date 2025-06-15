import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatHeader from './ChatHeader.tsx';
import { useTranslation } from '../contexts/TranslationContext';

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

  // Use the language and header from your TranslationContext
  const { language, headerTitle, headerSubtitle, t } = useTranslation();

  // Suggestions translated to current language
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [inputPlaceholder, setInputPlaceholder] = useState('Ask something about Indian law...');

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  // Translate suggestions and input placeholder on language change
  useEffect(() => {
    let isMounted = true;
    const translateAll = async () => {
      const translatedSuggestions = await Promise.all(
        defaultSuggestions.map((s) => t(s))
      );
      const translatedPlaceholder = await t('Ask something about Indian law...');
      if (isMounted) {
        setSuggestions(translatedSuggestions);
        setInputPlaceholder(translatedPlaceholder);
      }
    };
    translateAll();
    return () => { isMounted = false; };
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

      // Pass the current language to the backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          language: language, // <--- Pass selected language here
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
    utterance.lang = language || 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 max-w-3xl mx-auto">
      <ChatHeader />

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
            placeholder={inputPlaceholder}
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
