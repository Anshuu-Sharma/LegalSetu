import React, { useRef, useEffect, useState } from 'react';
import { Scale, Menu, X, Sparkles, ChevronDown, Globe, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext'; 
import LocalizedText from './LocalizedText';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ta', name: 'தমিழ்' },
  { code: 'mr', name: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'অসমীয়া' },
  { code: 'ur', name: 'اُردُو' }
];

interface HeaderProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onGetStarted?: () => void;
  user?: {
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    uid: string;
  } | null;
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

  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'AdvoTalk', id: 'advocate-chat' },
    { name: 'Neeti', id: 'chat' },
    { name: 'Document Analysis', id: 'documents' },
    { name: 'Constitution', id: 'cases' }, 
    { name: 'Find Advocate', id: 'advocate' },
    { name: 'Form Assistant', id: 'forms' },
    { name: 'Advocate Portal', id: 'advocate-portal' },
    // { name: 'About Us', id: 'about_us' },
  ];

  const getUserLabel = () =>
    user
      ? user.displayName
        ? user.displayName
        : user.email
      : '';

  // Robust profile image with fallback and icon
  const ProfileImage = ({
    photoURL,
    alt,
    className
  }: {
    photoURL?: string | null;
    alt: string;
    className?: string;
  }) => {
    const [imgSrc, setImgSrc] = useState(photoURL || '/default-profile.png');
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
      setImgSrc(photoURL || '/default-profile.png');
      setImgError(false);
    }, [photoURL]);

    if (imgError || !imgSrc) {
      return <UserCircle className={className || "w-8 h-8 text-gray-400"} />;
    }

    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => {
          if (imgSrc !== '/default-profile.png') {
            setImgSrc('/default-profile.png');
          } else {
            setImgError(true);
          }
        }}
      />
    );
  };

  return (
  <motion.header
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
  >
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-3"
      >
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-3 rounded-2xl shadow-lg">
          <Scale className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
          LegalSetu
        </h1>
      </motion.div>

      {/* Desktop Nav */}
      <nav className="hidden navcut:flex items-center space-x-2">
        <br />
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
      </nav>

      {/* Controls Section */}
      <div className="flex items-center space-x-2">
        {/* Language Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsLanguageOpen((open) => !open)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 rounded-xl transition-colors font-medium"
          >
            <Globe className="mr-2 w-4 h-4" />
            <span className="hidden sm:inline">
              {languages.find((lang) => lang.code === language)?.name || 'Select language'}
            </span>
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

        {/* Profile or Get Started */}
        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center focus:outline-none"
              title={getUserLabel() ?? undefined}
            >
              <ProfileImage
                photoURL={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="hidden sm:block text-sm font-medium">{getUserLabel()}</span>
              <ChevronDown className="ml-1 w-4 h-4" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-xl z-10">
                <div className="text-center px-4 py-3 text-gray-700">{getUserLabel()}</div>
                <hr className="text-gray-500" />
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout && onLogout();
                  }}
                  className="w-full px-4 py-3 text-center text-red-500 bg-white hover:bg-red-500 hover:text-white rounded-b-xl duration-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          onGetStarted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className="hidden sm:inline-block ml-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <LocalizedText text="Get Started" />
            </motion.button>
          )
        )}

        {/* Mobile Toggle */}
        <button
          className="navcut:hidden text-gray-600 hover:text-blue-600 p-2 rounded-xl hover:bg-gray-50 transition-colors"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </div>

    {/* Mobile Menu */}
    {mobileMenuOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-lg rounded-b-2xl px-4 pt-2 pb-4 space-y-3"
      >
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
            <LocalizedText text={item.name} />
          </button>
        ))}

        {/* Language Selector */}
        <div className="pt-2">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
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

        {/* Mobile Profile/Logout or Get Started */}
        {user ? (
          <div className="mt-4 flex items-center space-x-2">
            <ProfileImage
              photoURL={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
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
              <LocalizedText text="Get Started" />
            </button>
          )
        )}
      </motion.div>
    )}
  </motion.header>
);

};

export default Header;