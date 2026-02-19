/**
 * Translation utility for dynamic content from admin panel
 * Uses Google Translate API for translating Korean content to other languages
 */

import { Language } from './i18n/translations';

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>();

// Detect if text contains Korean characters
export function isKorean(text: string): boolean {
  if (!text) return false;
  return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
}

// Detect language of text
export function detectLanguage(text: string): 'ko' | 'en' | 'zh' | 'unknown' {
  if (!text) return 'unknown';
  if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text)) return 'ko';
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return 'unknown';
}

/**
 * Translate text using Google Translate API
 * Uses the free Google Translate web API
 */
async function translateText(
  text: string,
  targetLang: 'en' | 'zh' | 'ko'
): Promise<string> {
  if (!text || !text.trim()) return text;

  // Check cache first
  const cacheKey = `${text}|${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Use Google Translate web API (free, unofficial)
    const sourceLang = detectLanguage(text);
    
    // If source is already target language, return as is
    if (sourceLang === targetLang || sourceLang === 'unknown') {
      translationCache.set(cacheKey, text);
      return text;
    }

    // Limit text length to avoid issues
    const textToTranslate = text.length > 5000 ? text.substring(0, 5000) : text;

    // Use Google Translate API endpoint (free version)
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('Translation API error:', response.statusText);
      return text; // Return original text on error
    }

    const data = await response.json();
    let translatedText = text;
    
    // Parse the response - it's an array of arrays
    if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      translatedText = data[0]
        .map((item: any[]) => item[0] || '')
        .join('')
        .trim();
    }

    // If translation failed, return original
    if (!translatedText || translatedText === text) {
      return text;
    }

    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // On error, cache the original text to avoid repeated failures
    translationCache.set(cacheKey, text);
    return text; // Return original text on error
  }
}

/**
 * Translate text based on current language.
 * Translates ANY language → currentLanguage when they differ.
 * (Previously only Korean→other was supported.)
 */
export async function translateContent(
  text: string,
  currentLanguage: Language
): Promise<string> {
  if (!text || !text.trim()) return text;

  const sourceLang = detectLanguage(text);

  // Already in the target language or undetectable – no translation needed
  if (sourceLang === 'unknown' || sourceLang === currentLanguage) {
    return text;
  }

  return await translateText(text, currentLanguage);
}

/**
 * Translate multiple texts at once (batch translation)
 */
export async function translateMultiple(
  texts: string[],
  currentLanguage: Language
): Promise<string[]> {
  return Promise.all(
    texts.map((text) => translateContent(text, currentLanguage))
  );
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

