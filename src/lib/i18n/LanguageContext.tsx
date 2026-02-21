import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'alphabag_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (stored && (stored === 'en' || stored === 'zh' || stored === 'ko' || stored === 'ja')) {
        return stored;
      }
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) return 'zh';
      if (browserLang.startsWith('ko')) return 'ko';
      if (browserLang.startsWith('ja')) return 'ja';
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

