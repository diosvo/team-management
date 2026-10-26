import { z } from 'zod';

import { renderWithUI } from '@/test/utilities';

describe('ZodErrorMap', () => {
  const schema = z.string().min(6);

  afterEach(() => {
    z.config({ customError: undefined });
  });

  test.each([
    ['en', 'Be at least 6 characters long.'],
    ['vi', 'Tối thiểu 6 ký tự.'],
  ] as const)('localizes generic issues in %s', (locale, message) => {
    // `renderWithUI` mounts `<ZodErrorMap />` inside the intl provider
    renderWithUI(<div />, { locale });

    expect(schema.safeParse('abc').error?.issues[0].message).toBe(message);
  });
});
