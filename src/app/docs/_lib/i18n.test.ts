import { docsUrl, parseDocsPath, switchDocsLanguage } from './i18n';

describe('docs i18n helpers', () => {
  describe('docsUrl', () => {
    test('leaves the default language unprefixed', () => {
      expect(docsUrl([], 'en')).toBe('/docs');
      expect(docsUrl(['features', 'roster'], 'en')).toBe(
        '/docs/features/roster',
      );
    });

    test('prefixes other languages right after /docs', () => {
      expect(docsUrl([], 'vi')).toBe('/docs/vi');
      expect(docsUrl(['features'], 'vi')).toBe('/docs/vi/features');
    });

    test('defaults to the unprefixed form without a language', () => {
      expect(docsUrl(['overview'])).toBe('/docs/overview');
    });
  });

  describe('parseDocsPath', () => {
    test('returns null outside the docs', () => {
      expect(parseDocsPath('/dashboard')).toBeNull();
      expect(parseDocsPath('/documents')).toBeNull();
    });

    test('reads the default language from an unprefixed path', () => {
      expect(parseDocsPath('/docs')).toEqual({
        lang: 'en',
        slugs: [],
        explicit: false,
      });
      expect(parseDocsPath('/docs/features/roster')).toEqual({
        lang: 'en',
        slugs: ['features', 'roster'],
        explicit: false,
      });
    });

    test('reads an explicit language prefix', () => {
      expect(parseDocsPath('/docs/vi/features')).toEqual({
        lang: 'vi',
        slugs: ['features'],
        explicit: true,
      });
      expect(parseDocsPath('/docs/en')).toEqual({
        lang: 'en',
        slugs: [],
        explicit: true,
      });
    });
  });

  describe('switchDocsLanguage', () => {
    test('keeps the page while changing the language', () => {
      expect(switchDocsLanguage('/docs/features/roster', 'vi')).toBe(
        '/docs/vi/features/roster',
      );
      expect(switchDocsLanguage('/docs/vi/features/roster', 'en')).toBe(
        '/docs/features/roster',
      );
    });

    test('falls back to the docs root outside the docs', () => {
      expect(switchDocsLanguage('/dashboard', 'vi')).toBe('/docs/vi');
    });
  });
});
