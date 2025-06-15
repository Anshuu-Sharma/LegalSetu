// Safe fallback without breaking TS
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type SpeechRecognition = typeof window.webkitSpeechRecognition;
type SpeechRecognitionEvent = Event & {
  results: {
    [index: number]: {
      0: { transcript: string };
    };
    length: number;
  };
};

import React, { useState, useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext.tsx';

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
  analysis?: Analysis;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; color?: string }> = ({
  title,
  children,
  color = 'text-neutral-900',
}) => (
  <div className="mb-6">
    <h3 className={`text-sm font-semibold mb-2 ${color}`}>{title.toUpperCase()}</h3>
    {children}
  </div>
);

const AnalysisModal: React.FC<Props> = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const [chatMode, setChatMode] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; timestamp: string }[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);

  const { t, language } = useTranslation();

  const [typingText, setTypingText] = useState('');
  const [ui, setUI] = useState({
    chatWithDoc: 'Chat with Doc',
    viewAnalysis: 'View Analysis',
    viewDoc: 'View Document',
    hideDoc: 'Hide Document',
    legalDocAnalysis: 'Legal Document Analysis',
    summary: 'Summary',
    clauses: 'Clauses',
    risks: 'Risks',
    suggestions: 'Suggestions',
    fullDocument: 'Full Document',
    analyzing: 'Analyzing...',
    analysisComplete: 'Analysis Complete',
    errorDuringAnalysis: 'Error during analysis.',
    askPlaceholder: 'Ask something about the document...',
    send: 'Send',
  });

  useEffect(() => {
    let mounted = true;
    const translateUI = async () => {
      const [
        chatWithDoc, viewAnalysis, viewDoc, hideDoc, legalDocAnalysis,
        summary, clauses, risks, suggestions, fullDocument,
        analyzing, analysisComplete, errorDuringAnalysis, askPlaceholder, send
      ] = await Promise.all([
        t('Chat with Doc'),
        t('View Analysis'),
        t('View Document'),
        t('Hide Document'),
        t('Legal Document Analysis'),
        t('Summary'),
        t('Clauses'),
        t('Risks'),
        t('Suggestions'),
        t('Full Document'),
        t('Analyzing...'),
        t('Analysis Complete'),
        t('Error during analysis.'),
        t('Ask something about the document...'),
        t('Send')
      ]);
      if (mounted) {
        setUI({
          chatWithDoc, viewAnalysis, viewDoc, hideDoc, legalDocAnalysis,
          summary, clauses, risks, suggestions, fullDocument,
          analyzing, analysisComplete, errorDuringAnalysis, askPlaceholder, send
        });
      }
    };
    translateUI();
    return () => { mounted = false; };
  }, [language, t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(transcript), 1);
    };

    recognitionRef.current = recognition;
  }, [language]);

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideInput?: string) => {
    const query = (overrideInput ?? input).trim();
    if (!query) return;
    const timestamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { role: 'user', text: query, timestamp }]);
    setInput('');
    setTypingText('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          fullText: analysis.fullText,
          metadata: analysis._meta || {},
          language,
        }),
      });
      const result = await res.json();
      const reply = result.reply || '❌ Sorry, I could not process your question.';

      // Simulated typing effect
      const words = reply.split(' ');
      let index = 0;
      const interval = setInterval(() => {
        setTypingText((prev) => prev + (index === 0 ? '' : ' ') + words[index]);
        index++;
        if (index >= words.length) {
          clearInterval(interval);
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: reply, timestamp: new Date().toLocaleTimeString() },
          ]);
          setTypingText('');
        }
      }, 80);
    } catch (err) {
      console.error('Chat failed', err);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: '⚠️ Failed to get response. Try again later.', timestamp: new Date().toLocaleTimeString() },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[80vh] flex divide-x relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex gap-3 mb-4">
            <button onClick={() => setChatMode((prev) => !prev)} className="px-3 py-1 text-sm border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50">
              {chatMode ? ui.viewAnalysis : ui.chatWithDoc}
            </button>
            <button onClick={() => setShowDocument((prev) => !prev)} className="px-3 py-1 text-sm border border-purple-200 text-purple-600 rounded-md hover:bg-purple-50">
              {showDocument ? ui.hideDoc : ui.viewDoc}
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-6">
            {chatMode ? `💬 ${ui.chatWithDoc}` : `📄 ${ui.legalDocAnalysis}`}
          </h2>

          {chatMode ? (
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-y-auto mb-4 pr-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`group relative max-w-[75%] px-4 py-2 rounded-xl ${
                      msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.text}
                      <div className="text-xs text-gray-400 mt-1 text-right">{msg.timestamp}</div>
                      {msg.role === 'bot' && (
                        <button
                          onClick={() => speakText(msg.text)}
                          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Listen"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {typingText && (
                  <div className="mb-3 flex justify-start">
                    <div className="max-w-[75%] px-4 py-2 rounded-xl bg-gray-100 text-gray-800">
                      {typingText}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={ui.askPlaceholder}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring focus:ring-blue-500"
                />
                <button
                  onClick={() => recognitionRef.current?.start()}
                  type="button"
                  className={`p-2 rounded-full border transition-all duration-200 ${
                    listening
                      ? 'bg-red-100 border-red-300 animate-pulse'
                      : 'bg-white border-gray-300 hover:bg-gray-100'
                  }`}
                  title="Voice Input"
                >
                  <Mic className={`h-5 w-5 ${listening ? 'text-red-500' : 'text-gray-600'}`} />
                </button>
                <button
                  onClick={() => handleSend()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  disabled={!input.trim()}
                >
                  {ui.send}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Section title={ui.summary}>
                <p className="text-gray-700">{analysis.summary}</p>
              </Section>
              <Section title={ui.clauses} color="text-blue-600">
                <ul className="list-disc pl-6">
                  {analysis.clauses.map((clause, i) => (
                    <li key={i} className="text-gray-700 mb-2">{clause}</li>
                  ))}
                </ul>
              </Section>
              <Section title={ui.risks} color="text-red-600">
                <ul className="list-disc pl-6">
                  {analysis.risks.map((risk, i) => (
                    <li key={i} className="text-gray-700 mb-2">{risk}</li>
                  ))}
                </ul>
              </Section>
              <Section title={ui.suggestions} color="text-green-600">
                <ul className="list-disc pl-6">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="text-gray-700 mb-2">{s}</li>
                  ))}
                </ul>
              </Section>
            </>
          )}
        </div>

        {showDocument && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">📖 {ui.fullDocument}</h3>
            <div className="text-gray-700 whitespace-pre-wrap">
              {analysis.fullText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisModal;
