// components/Chat/ChatHeader.tsx
import React from 'react';
import { Languages, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedLanguage, setSelectedLanguage }) => {
  const languages = [
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <FileText className="w-7 h-7 text-white" />
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Legal Assistant
            </h2>
            <p className="text-sm text-green-600 flex items-center font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Online • Ready to help
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Languages className="w-5 h-5 text-gray-500" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatHeader;
