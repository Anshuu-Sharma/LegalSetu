import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => Promise<string>;
}

const TranslationContext = createContext<TranslationContextType>({
  language: 'en',
  setLanguage: () => {},
  t: async (text: string) => text,
});

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize language from localStorage (persist across refresh)
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'en';
    }
    return 'en';
  });

  // 2. Update localStorage whenever language changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', language);
    }
  }, [language]);

  // 3. Memoized translation function (auto-updates on language change)
  const t = useCallback(async (text: string) => {
    if (language === 'en') return text;
    try {
      const res = await fetch('http://localhost:3001/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: language }),
      });
      const data = await res.json();
      return data.translation || text;
    } catch {
      return text;
    }
  }, [language]);

  // 4. Memoize context value for performance
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, t]);

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
