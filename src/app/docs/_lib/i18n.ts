import { defineI18n } from 'fumadocs-core/i18n';

import { docsRoute } from './shared';

export const i18n = defineI18n({
  defaultLanguage: 'en',
  languages: ['en', 'vi'],
  // The default language has no prefix: `/docs/...` is English,
  // `/docs/vi/...` is Vietnamese. See `src/proxy.ts` for the rewrite.
  hideLocale: 'default-locale',
});

export type Language = (typeof i18n.languages)[number];

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === 'string' &&
    (i18n.languages as Array<string>).includes(value)
  );
}

/**
 * Builds a public docs URL for a page.
 *
 * The default language is unprefixed, other languages sit right after
 * `/docs` so the docs stay self-contained under one route segment.
 */
export function docsUrl(slugs: Array<string>, lang?: string) {
  const localeSegment = lang && lang !== i18n.defaultLanguage ? lang : null;

  return (
    '/' +
    [...docsRoute.split('/'), localeSegment, ...slugs]
      .filter((segment): segment is string => !!segment)
      .join('/')
  );
}

/**
 * Splits a `/docs/...` pathname into its language and remaining slugs.
 * Returns `null` for pathnames outside the docs.
 */
export function parseDocsPath(pathname: string) {
  if (pathname !== docsRoute && !pathname.startsWith(`${docsRoute}/`)) {
    return null;
  }

  const slugs = pathname.slice(docsRoute.length).split('/').filter(Boolean);
  const [first, ...rest] = slugs;

  if (isLanguage(first)) {
    return { lang: first, slugs: rest, explicit: true as const };
  }

  return { lang: i18n.defaultLanguage, slugs, explicit: false as const };
}

/** Rewrites a docs pathname to the same page in another language. */
export function switchDocsLanguage(pathname: string, lang: string) {
  const parsed = parseDocsPath(pathname);
  if (!parsed) return docsUrl([], lang);

  return docsUrl(parsed.slugs, lang);
}
