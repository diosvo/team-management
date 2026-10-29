'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { i18nProvider } from 'fumadocs-ui/i18n';
import { RootProvider } from 'fumadocs-ui/provider/next';

import { switchDocsLanguage, type Language } from '../_lib/i18n';
import { translations } from '../_lib/translations';
import SearchDialog from './search';

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
