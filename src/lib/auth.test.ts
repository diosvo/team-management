import { sendEmail } from '@/lib/resend';

import ResetPassword from '@/app/(auth)/_components/ResetPassword';

import auth from './auth';

vi.mock('better-auth/minimal', () => ({
  // Return the config so we can introspect and exercise its callbacks.
  betterAuth: vi.fn((config) => config),
}));

vi.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: vi.fn(() => ({ id: 'adapter' })),
}));

vi.mock('better-auth/next-js', () => ({
  nextCookies: vi.fn(() => ({ id: 'next-cookies' })),
}));

vi.mock('@/drizzle', () => ({ default: { id: 'db' } }));

vi.mock('@/lib/resend', () => ({ sendEmail: vi.fn() }));

vi.mock('@/app/(auth)/_components/ResetPassword', () => ({
  default: vi.fn(() => '<p>reset</p>'),
}));

vi.mock('@env', () => ({
  default: {
    DEV_URL: 'http://localhost:3000',
    PRODUCTION_URL: 'https://sgr-portal.vercel.app',
  },
}));

// `betterAuth` is mocked to return the raw config; view it as such for assertions.
const config = auth as unknown as {
  trustedOrigins: Array<string>;
  emailAndPassword: {
    enabled: boolean;
    requireEmailVerification: boolean;
    sendResetPassword: (input: {
      user: { email: string };
      url: string;
    }) => Promise<void>;
  };
};

describe('auth config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('trusts the dev and production origins', () => {
    expect(config.trustedOrigins).toEqual([
      'http://localhost:3000',
      'https://sgr-portal.vercel.app',
    ]);
  });

  test('enables email/password without verification', () => {
    expect(config.emailAndPassword.enabled).toBe(true);
    expect(config.emailAndPassword.requireEmailVerification).toBe(false);
  });

  describe('sendResetPassword', () => {
    const URL = 'https://sgr-portal.vercel.app/reset?token=abc';

    test('derives the name from the email and sends the reset email', async () => {
      await config.emailAndPassword.sendResetPassword({
        user: { email: 'jane.doe@example.com' },
        url: URL,
      });

      expect(ResetPassword).toHaveBeenCalledWith({
        name: 'jane.doe',
        url: URL,
      });
      expect(sendEmail).toHaveBeenCalledWith({
        to: 'jane.doe@example.com',
        subject: 'Create a new password',
        html: '<p>reset</p>',
      });
    });
  });
});
