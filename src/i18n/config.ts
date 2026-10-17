export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** BCP 47 tags for `Intl`-based UI (Chakra date picker); both read `dd/mm/yyyy` */
export const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-GB',
  vi: 'vi-VN',
};

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

export const isLocale = (value: unknown): value is Locale =>
  LOCALES.includes(value as Locale);
