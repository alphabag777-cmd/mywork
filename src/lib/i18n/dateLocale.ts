/**
 * dateLocale.ts
 * Provides date-fns locale objects and locale-aware formatting helpers.
 * Usage:
 *   import { useDateLocale, fmtDate, fmtDateTime } from "@/lib/i18n/dateLocale";
 *   const locale = useDateLocale();
 *   fmtDate(ts, locale)   // "2024년 1월 5일"  (ko)
 *   fmtDateTime(ts, locale) // "2024/01/05 14:30"  (ja)
 */

import { format } from "date-fns";
import { enUS, zhCN, ko, ja } from "date-fns/locale";
import type { Locale } from "date-fns";
import { useLanguage } from "./LanguageContext";
import type { Language } from "./translations";

/** Map app language code → date-fns Locale */
const LOCALE_MAP: Record<Language, Locale> = {
  en: enUS,
  zh: zhCN,
  ko: ko,
  ja: ja,
};

/** Short date formats per language (no time) */
const DATE_FORMAT: Record<Language, string> = {
  en: "MMM d, yyyy",       // Jan 5, 2024
  zh: "yyyy年M月d日",       // 2024年1月5日
  ko: "yyyy년 M월 d일",     // 2024년 1월 5일
  ja: "yyyy/MM/dd",         // 2024/01/05
};

/** Date + time formats per language */
const DATETIME_FORMAT: Record<Language, string> = {
  en: "MMM d, yyyy p",     // Jan 5, 2024 2:30 PM
  zh: "yyyy年M月d日 HH:mm", // 2024年1月5日 14:30
  ko: "yyyy년 M월 d일 HH:mm", // 2024년 1월 5일 14:30
  ja: "yyyy/MM/dd HH:mm",   // 2024/01/05 14:30
};

/** Hook — returns current language's date-fns Locale */
export function useDateLocale(): Locale {
  const { language } = useLanguage();
  return LOCALE_MAP[language];
}

/** Hook — returns locale-aware format helpers */
export function useDateFormat() {
  const { language } = useLanguage();
  const locale = LOCALE_MAP[language];
  const dateFmt = DATE_FORMAT[language];
  const datetimeFmt = DATETIME_FORMAT[language];

  return {
    locale,
    /** Format a timestamp/Date as a short date string */
    fmtDate: (value: number | Date) => {
      try {
        return format(new Date(value), dateFmt, { locale });
      } catch {
        return "-";
      }
    },
    /** Format a timestamp/Date as a date+time string */
    fmtDateTime: (value: number | Date) => {
      try {
        return format(new Date(value), datetimeFmt, { locale });
      } catch {
        return "-";
      }
    },
  };
}

/** Pure helpers (no hook) — pass locale explicitly */
export function fmtDate(value: number | Date, lang: Language): string {
  try {
    return format(new Date(value), DATE_FORMAT[lang], { locale: LOCALE_MAP[lang] });
  } catch {
    return "-";
  }
}

export function fmtDateTime(value: number | Date, lang: Language): string {
  try {
    return format(new Date(value), DATETIME_FORMAT[lang], { locale: LOCALE_MAP[lang] });
  } catch {
    return "-";
  }
}
