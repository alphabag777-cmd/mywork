import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translateContent, detectLanguage } from '@/lib/translator';

/**
 * Hook to translate dynamic content from admin panel.
 * Translates ANY language → current UI language when they differ.
 */
export function useTranslate() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  const translate = useCallback(
    async (text: string): Promise<string> => {
      if (!text || !text.trim()) return text;

      const sourceLang = detectLanguage(text);

      // Already in target language or undetectable
      if (sourceLang === 'unknown' || sourceLang === language) return text;

      const cacheKey = `${text}|${language}`;
      if (translations.has(cacheKey)) {
        return translations.get(cacheKey)!;
      }

      setLoading(true);
      try {
        const translated = await translateContent(text, language);
        setTranslations((prev) => new Map(prev.set(cacheKey, translated)));
        return translated;
      } catch (error) {
        console.error('Translation error:', error);
        return text;
      } finally {
        setLoading(false);
      }
    },
    [language, translations]
  );

  const translateSync = useCallback(
    (text: string): string => {
      if (!text || !text.trim()) return text;
      const sourceLang = detectLanguage(text);
      if (sourceLang === 'unknown' || sourceLang === language) return text;
      const cacheKey = `${text}|${language}`;
      return translations.get(cacheKey) || text;
    },
    [language, translations]
  );

  return { translate, translateSync, isLoading: loading };
}

/**
 * Hook to translate an object with multiple text fields
 */
export function useTranslateObject<T extends Record<string, any>>() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  const translateObject = useCallback(
    async <K extends keyof T>(obj: T, fields: K[]): Promise<T> => {
      setLoading(true);
      try {
        const translated = { ...obj };

        await Promise.all(
          fields.map(async (field) => {
            const value = obj[field];
            if (typeof value !== 'string' || !value.trim()) return;

            const sourceLang = detectLanguage(value);
            if (sourceLang === 'unknown' || sourceLang === language) return;

            const cacheKey = `${value}|${language}`;
            if (translations.has(cacheKey)) {
              (translated as any)[field] = translations.get(cacheKey)!;
              return;
            }

            const translatedValue = await translateContent(value, language);
            setTranslations((prev) => new Map(prev.set(cacheKey, translatedValue)));
            (translated as any)[field] = translatedValue;
          })
        );

        return translated;
      } catch (error) {
        console.error('Translation error:', error);
        return obj;
      } finally {
        setLoading(false);
      }
    },
    [language, translations]
  );

  return { translateObject, isLoading: loading };
}


