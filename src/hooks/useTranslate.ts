import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { translateContent, detectLanguage } from '@/lib/translator';

/**
 * Hook to translate dynamic content from admin panel.
 * Translates ANY language → current UI language when they differ.
 *
 * ⚠️ 무한루프 방지: translations Map을 useRef로 관리하여
 *    translate 함수 참조가 재생성되지 않도록 함.
 */
export function useTranslate() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  // Map을 ref로 관리 → setState 없이 캐시 갱신 → translate 재생성 안 됨
  const translationsRef = useRef<Map<string, string>>(new Map());

  const translate = useCallback(
    async (text: string): Promise<string> => {
      if (!text || !text.trim()) return text;

      const sourceLang = detectLanguage(text);

      // Already in target language or undetectable
      if (sourceLang === 'unknown' || sourceLang === language) return text;

      const cacheKey = `${text}|${language}`;
      if (translationsRef.current.has(cacheKey)) {
        return translationsRef.current.get(cacheKey)!;
      }

      setLoading(true);
      try {
        const translated = await translateContent(text, language);
        translationsRef.current.set(cacheKey, translated);
        return translated;
      } catch (error) {
        console.error('Translation error:', error);
        return text;
      } finally {
        setLoading(false);
      }
    },
    [language] // translations를 의존성에서 제거 → 무한루프 방지
  );

  const translateSync = useCallback(
    (text: string): string => {
      if (!text || !text.trim()) return text;
      const sourceLang = detectLanguage(text);
      if (sourceLang === 'unknown' || sourceLang === language) return text;
      const cacheKey = `${text}|${language}`;
      return translationsRef.current.get(cacheKey) || text;
    },
    [language] // translations를 의존성에서 제거
  );

  return { translate, translateSync, isLoading: loading };
}

/**
 * Hook to translate an object with multiple text fields
 */
export function useTranslateObject<T extends Record<string, any>>() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const translationsRef = useRef<Map<string, string>>(new Map());

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
            if (translationsRef.current.has(cacheKey)) {
              (translated as any)[field] = translationsRef.current.get(cacheKey)!;
              return;
            }

            const translatedValue = await translateContent(value, language);
            translationsRef.current.set(cacheKey, translatedValue);
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
    [language] // translations를 의존성에서 제거
  );

  return { translateObject, isLoading: loading };
}
