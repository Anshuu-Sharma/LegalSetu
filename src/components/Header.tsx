import React, { useRef, useEffect, useState } from 'react';
import { Scale, Menu, X, Sparkles, ChevronDown, Globe, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext'; // Remove .tsx for consistency
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

// Merge all props from both files
interface HeaderProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onGetStarted?: () => void;
  user?: any;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  activeSection,
  setActiveSection,
  onGetStarted,
  user,
  onLogout
}) => {
  const { language, setLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (isLanguageOpen || profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageOpen, profileOpen]);

  // Merge navigation from both files
  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'AI Chat', id: 'chat' },
    { name: 'Documents', id: 'documents' },
    { name: 'Case Laws', id: 'cases' }, // From File 1
    { name: 'About Us', id: 'about_us' }, // From File 2
    { name: 'Forms', id: 'forms' }
  ];

  // Helper to get display name or email
  const getUserLabel = () =>
    user
      ? user.displayName
        ? user.displayName
        : user.email
      : '';

  return (
    <header className="w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-2">
          <Scale className="text-blue-600" />
          <span className="font-bold text-lg">LegalBot AI</span>
          <span className="text-xs text-gray-400 ml-2">Powered by AI</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeSection === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              {/* Optionally wrap with LocalizedText if needed */}
              {item.name}
              {activeSection === item.id && (
                <motion.div
                  className="absolute left-1/2 -bottom-1 w-2 h-2 bg-blue-600 rounded-full"
                  layoutId="nav-underline"
                />
              )}
            </button>
          ))}

          {/* Language Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLanguageOpen((open) => !open)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 rounded-xl transition-colors font-medium"
            >
              <Globe className="mr-2 w-4 h-4" />
              {languages.find((lang) => lang.code === language)?.name || 'Select language'}
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            {isLanguageOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl z-10">
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

          {/* Profile/Logout or Get Started */}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center focus:outline-none"
                title={getUserLabel()}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full mr-2"
                  />
                ) : (
                  <UserCircle className="w-8 h-8 text-gray-400 mr-2" />
                )}
                <span className="text-sm font-medium">{getUserLabel()}</span>
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-xl z-10">
                  <div className="px-4 py-3 text-gray-700">{getUserLabel()}</div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout && onLogout();
                    }}
                    className="w-full px-4 py-3 text-center text-red-500 bg-white hover:bg-red-500 hover:text-white rounded-b-xl"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            onGetStarted && (
              <button
                onClick={onGetStarted}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            )
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-600 hover:text-blue-600 p-2 rounded-xl hover:bg-gray-50 transition-colors"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-4">
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
              {item.name}
            </button>
          ))}
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-2"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          {/* Mobile Profile/Logout or Get Started */}
          {user ? (
            <div className="mt-4 flex items-center space-x-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <UserCircle className="w-8 h-8 text-gray-400" />
              )}
              <span className="text-sm font-medium">{getUserLabel()}</span>
              <button
                onClick={onLogout}
                className="ml-auto px-4 py-2 text-red-500 bg-white hover:bg-red-500 hover:text-white rounded-xl"
              >
                Logout
              </button>
            </div>
          ) : (
            onGetStarted && (
              <button
                onClick={onGetStarted}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            )
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
