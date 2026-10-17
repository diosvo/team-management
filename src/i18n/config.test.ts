import { isLocale, LOCALES } from './config';

describe('isLocale', () => {
  test.each(LOCALES)('accepts %s', (locale) => {
    expect(isLocale(locale)).toBe(true);
  });

  test.each(['fr', 'EN', 'vi-VN', '', undefined, null, 1])(
    'rejects %s',
    (value) => {
      expect(isLocale(value)).toBe(false);
    },
  );
});
