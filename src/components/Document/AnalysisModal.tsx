import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, User } from 'lucide-react';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';

interface Analysis {
  summary: string;
  clauses: string[];
  risks: string[];
  suggestions: string[];
  fullText: string;
  _meta?: {
    pages: number;
    pageMetadata: Record<string, string>;
  };
}

interface Props {
  analysis: Analysis;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; color?: string }> = ({
  title,
  children,
  color = 'text-neutral-900',
}) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="mb-6"
  >
    <h3 className={`text-base font-semibold mb-3 ${color}`}>{title.toUpperCase()}</h3>
    <div className="text-sm leading-6 text-gray-800">{children}</div>
  </motion.section>
);

const AnalysisModal: React.FC<Props> = ({ analysis, onClose }) => {
  const [chatMode, setChatMode] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; timestamp: string }[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const timestamp = new Date().toLocaleTimeString();
    const userMessage = { role: 'user' as const, text: input, timestamp };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          fullText: analysis.fullText,
          metadata: analysis._meta || {},
        }),
      });
      const result = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: result.reply || '❌ Sorry, I could not process your question.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      console.error('Chat failed', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: '⚠️ Failed to get response. Try again later.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 overflow-hidden"
      >
        {/* Top Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setChatMode((prev) => !prev)}
            className="px-3 py-1 text-sm border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50"
          >
            {chatMode ? 'View Analysis' : 'Chat with Doc'}
          </button>
          <button
            onClick={() => setShowDocument((prev) => !prev)}
            className="px-3 py-1 text-sm border border-purple-200 text-purple-600 rounded-md hover:bg-purple-50"
          >
            {showDocument ? 'Hide Document' : 'View Document'}
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {chatMode ? '💬 Chat with Document' : '📄 Legal Document Analysis'}
        </h2>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Side: Chat or Analysis */}
          <div className="flex-1 min-h-[300px] max-h-[70vh] overflow-y-auto pr-1">
            {chatMode ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[50vh]">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`group relative flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'bot' && (
                        <div className="mr-2 bg-blue-100 p-2 rounded-full">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`relative max-w-[75%] px-4 py-2 text-sm rounded-xl shadow ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        {msg.role === 'bot' && i === messages.length - 1 ? (
                          <Typewriter words={[msg.text]} typeSpeed={20} cursor={false} />
                        ) : (
                          msg.text
                        )}
                        <div className="absolute -bottom-5 text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                          {msg.timestamp}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="ml-2 bg-gray-200 p-2 rounded-full">
                          <User className="w-4 h-4 text-gray-700" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask something about the document..."
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSend}
                    className="bg-blue-600 text-white px-4 py-2 text-sm rounded-xl hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Section title="📌 Summary">{analysis.summary}</Section>
                <Section title="📃 Clauses">
                  <ul className="list-disc pl-5 space-y-2">
                    {analysis.clauses.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </Section>
                <Section title="⚠️ Risks" color="text-red-600">
                  <ul className="list-disc pl-5 space-y-2">
                    {analysis.risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </Section>
                <Section title="✅ Suggestions" color="text-green-600">
                  <ul className="list-disc pl-5 space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </Section>
              </>
            )}
          </div>

          {/* Right Side: Document Viewer */}
          {showDocument && (
            <div className="w-full md:w-1/2 max-h-[70vh] overflow-y-auto border border-gray-200 rounded-xl p-4 text-sm bg-gray-50 text-gray-800 leading-6">
              <h3 className="text-base font-semibold mb-3">📖 Full Document</h3>
              <pre className="whitespace-pre-wrap">{analysis.fullText}</pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisModal;
