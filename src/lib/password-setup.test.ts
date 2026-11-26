import auth from '@/lib/auth';

import { PASSWORD_SETUP_PATH, sendPasswordSetup } from './password-setup';

vi.mock('@/lib/auth', () => ({
  default: { api: { requestPasswordReset: vi.fn() } },
}));

describe('sendPasswordSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('requests a reset link that lands on the new-password page', async () => {
    await sendPasswordSetup('linh@example.com');

    expect(auth.api.requestPasswordReset).toHaveBeenCalledWith({
      body: { email: 'linh@example.com', redirectTo: '/new-password' },
    });
    expect(PASSWORD_SETUP_PATH).toBe('/new-password');
  });

  test('never mails a placeholder address', async () => {
    await expect(sendPasswordSetup('x@no-email.invalid')).rejects.toThrow(
      'No deliverable email',
    );
    expect(auth.api.requestPasswordReset).not.toHaveBeenCalled();
  });

  test('lets a failed request reach the caller', async () => {
    vi.mocked(auth.api.requestPasswordReset).mockRejectedValueOnce(
      new Error('smtp down'),
    );

    await expect(sendPasswordSetup('linh@example.com')).rejects.toThrow(
      'smtp down',
    );
  });
});
