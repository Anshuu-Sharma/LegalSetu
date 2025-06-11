import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import ChatInterface from './components/ChatInterface';
import DocumentUpload from './components/DocumentUpload';
import Footer from './components/Footer';

// List of all supported languages (as in Header)
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
  { code: 'sa', name: 'संस्कृतम्' },
  { code: 'ks', name: 'कॉशुर' },
  { code: 'ne', name: 'नेपाली' },
  { code: 'sd', name: 'सिन्धी' },
  { code: 'doi', name: 'डोगरी' },
  { code: 'mni', name: 'ꯃꯤꯇꯩꯂꯣꯟ' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ur', name: 'اُردُو' },
  { code: 'brx', name: 'बड़ो' },
  { code: 'kok', name: 'कोंकणी' },
  { code: 'lus', name: 'Mizo ṭawng' }
];

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default to English

  // Handler for language change
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // Optionally: Add translation/i18n logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />

      {activeSection === 'home' && (
        <>
          <Hero setActiveSection={setActiveSection} selectedLanguage={selectedLanguage} />
          <Features selectedLanguage={selectedLanguage} />
        </>
      )}

      {activeSection === 'chat' && <ChatInterface selectedLanguage={selectedLanguage} />}
      {activeSection === 'documents' && <DocumentUpload selectedLanguage={selectedLanguage} />}
      
      <Footer selectedLanguage={selectedLanguage} />
    </div>
  );
}

export default App;
