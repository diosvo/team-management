'use client';

import type { PropsWithChildren } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { RootProvider } from 'fumadocs-ui/provider/next';

import SearchDialog from './search';

import { type Language, switchDocsLanguage } from '../_lib/i18n';
import { translations } from '../_lib/translations';

/**
 * Fumadocs root provider bound to the current docs language.
 *
 * The default language switcher assumes the locale is the first URL segment
 * (`/vi/docs`); ours sits after `/docs`, so the switch is handled here.
 */
export function DocsProvider({
  lang,
  children,
}: PropsWithChildren<{ lang: Language }>) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <RootProvider
      theme={{ enabled: false }}
      search={{ SearchDialog }}
      i18n={{
        ...i18nProvider(translations, lang),
        onLocaleChange: (locale) =>
          router.push(switchDocsLanguage(pathname, locale)),
      }}
    >
      {children}
    </RootProvider>
  );
}
