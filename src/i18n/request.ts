import { cookies, headers } from 'next/headers';

import { toMerged } from 'es-toolkit';
import { getRequestConfig } from 'next-intl/server';

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import en from './messages/en';
import vi from './messages/vi';

async function resolveLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const language = (await headers()).get('accept-language') ?? '';
  return language.toLowerCase().startsWith('vi') ? 'vi' : DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  // English is the source of truth: missing Vietnamese keys fall back to it.
  const messages = locale === 'vi' ? toMerged(en, vi) : en;

  return { locale, messages, timeZone: 'Asia/Ho_Chi_Minh' };
});
