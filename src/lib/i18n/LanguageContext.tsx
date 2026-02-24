import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'alphabag_language';
/** 사용자가 한 번이라도 언어를 확정(방문/선택)했는지 여부 플래그 */
const LANGUAGE_SET_KEY = 'alphabag_lang_set';

/** navigator.languages[] 에서 지원 언어(ko/zh/ja/en) 첫 번째 매칭 반환 */
function detectSystemLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  const langs: readonly string[] =
    navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of langs) {
    const lc = l.toLowerCase();
    if (lc.startsWith('ko')) return 'ko';
    if (lc.startsWith('zh')) return 'zh';
    if (lc.startsWith('ja')) return 'ja';
    if (lc.startsWith('en')) return 'en';
  }
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const isReturningUser = localStorage.getItem(LANGUAGE_SET_KEY) === 'true';

      if (isReturningUser) {
        // 재방문: 사용자가 직접 선택한 언어 유지
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
        if (stored && (stored === 'en' || stored === 'zh' || stored === 'ko' || stored === 'ja')) {
          return stored;
        }
      }

      // 최초 방문: 브라우저/OS 시스템 언어 자동 적용
      const systemLang = detectSystemLanguage();
      if (systemLang) return systemLang;
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      localStorage.setItem(LANGUAGE_SET_KEY, 'true'); // 방문 확정 플래그
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

