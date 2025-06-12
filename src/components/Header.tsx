import React, { useRef, useEffect } from 'react';
import { Scale, Menu, X, Sparkles, ChevronDown, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext';
import LocalizedText from './LocalizedText';

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
  { code: 'ne', name: 'नेपाली' },
  { code: 'ur', name: 'اُردُو' }
];


interface HeaderProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, setActiveSection }) => {
  const { language, setLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    if (isLanguageOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageOpen]);

  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'AI Chat', id: 'chat' },
    { name: 'Documents', id: 'documents' },
    { name: 'Case Laws', id: 'cases' },
    { name: 'Forms', id: 'forms' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Branding */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-3 rounded-2xl shadow-lg">
              <Scale className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                LegalBot AI
              </h1>
              <p className="text-xs text-gray-500 font-medium">Powered by AI</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveSection(item.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeSection === item.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {/* UPDATED: Wrap with LocalizedText */}
                <LocalizedText text={item.name} />
                {activeSection === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-50 rounded-xl border border-blue-200"
                    style={{ zIndex: -1 }}
                  />
                )}
              </motion.button>
            ))}

            {/* Language Dropdown */}
            <div className="relative ml-4" ref={dropdownRef}>
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 rounded-xl transition-colors font-medium"
              >
                <Globe className="w-5 h-5 mr-2" />
                {languages.find(lang => lang.code === language)?.name || 'Select language'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-56 max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-200/50 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-sm text-left ${
                        language === lang.code
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      } transition-colors rounded-xl`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="ml-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <LocalizedText text="Get Started" />
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-blue-600 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden border-t border-gray-200/50 bg-white/90 backdrop-blur-xl rounded-b-2xl"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {/* UPDATED: Wrap with LocalizedText */}
                  <LocalizedText text={item.name} />
                </button>
              ))}
              <div className="px-4 py-3">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <LocalizedText text="Select Language:" />
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg">
                <LocalizedText text="Get Started" />
              </button>
            </div>
          </motion.div>
        )}
      </nav>
    </motion.header>
  );
};

export default Header;
