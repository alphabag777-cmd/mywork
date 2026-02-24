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
      // 1순위: 사용자가 직접 저장한 언어 설정
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (stored && (stored === 'en' || stored === 'zh' || stored === 'ko' || stored === 'ja')) {
        return stored;
      }
      // 2순위: 브라우저/OS 시스템 언어 (navigator.languages 배열 전체 순회)
      const langs: readonly string[] =
        navigator.languages?.length ? navigator.languages : [navigator.language];
      for (const l of langs) {
        const lc = l.toLowerCase();
        if (lc.startsWith('ko')) return 'ko';
        if (lc.startsWith('zh')) return 'zh';
        if (lc.startsWith('ja')) return 'ja';
        if (lc.startsWith('en')) return 'en';
      }
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

