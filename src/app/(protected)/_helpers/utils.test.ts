import { createTranslator } from 'next-intl';

import { MESSAGES } from '@/test/utilities';

import { getYearsActive, navLabel } from './utils';

describe('getYearsActive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.each([
    ['en', 'over 2 years'],
    ['vi', 'hơn 2 năm'],
  ] as const)(
    'counts the years since the club was founded in %s',
    (locale, text) => {
      expect(getYearsActive(locale)).toBe(text);
    },
  );
});

describe('navLabel', () => {
  const t = (locale: 'en' | 'vi') =>
    createTranslator({
      locale,
      messages: MESSAGES[locale],
      namespace: 'shell.nav',
    });

  test.each([
    ['en', 'periodic-testing', 'Periodic Testing'],
    ['vi', 'periodic-testing', 'Kiểm tra định kỳ'],
    ['vi', 'roster', 'Đội hình'],
  ] as const)('labels a known segment in %s', (locale, segment, label) => {
    expect(navLabel(t(locale), segment)).toBe(label);
  });

  test('falls back to the title-cased segment for ids', () => {
    expect(navLabel(t('vi'), 'user-041')).toBe('User 041');
  });
});
