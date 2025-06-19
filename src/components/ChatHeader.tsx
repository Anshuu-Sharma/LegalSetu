import React from 'react';
import { Languages, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext.tsx';
import LocalizedText from './LocalizedText.tsx';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, subtitle }) => {
  const { language, setLanguage } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'as', name: 'অসমীয়া' },
    { code: 'ur', name: 'اُردُو' }
  ];

  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 mb-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Title + Icon */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              </div>
            </motion.div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <LocalizedText text={title} />
              </h2>
              <p className="text-sm text-green-600 flex items-center font-medium mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                <LocalizedText text={subtitle} />
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Languages className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
