import { cookies } from 'next/headers';

import { setLocale } from './locale';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));

describe('setLocale', () => {
  const set = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({ set } as never);
  });

  test('stores a supported locale for a year', async () => {
    await setLocale('vi');

    expect(set).toHaveBeenCalledWith('NEXT_LOCALE', 'vi', {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  test('ignores an unsupported locale', async () => {
    await setLocale('fr');

    expect(set).not.toHaveBeenCalled();
  });
});
