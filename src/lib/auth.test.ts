import { sendEmail } from '@/lib/resend';

import ResetPassword from '@/app/(auth)/_components/ResetPassword';
import { isCaptain } from '@/db/player';

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

vi.mock('better-auth/plugins', () => ({
  // Expose the session callback so the test can call it directly.
  customSession: vi.fn((fn) => ({ id: 'custom-session', fn })),
}));

vi.mock('@better-auth/infra', () => ({
  dash: vi.fn(() => ({ id: 'dash' })),
}));

vi.mock('@/drizzle', () => ({ default: { id: 'db' } }));

vi.mock('@/db/player', () => ({ isCaptain: vi.fn() }));

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
type SessionInput = { user: { id: string }; session: { id: string } };

const config = auth as unknown as {
  trustedOrigins: Array<string>;
  user: { additionalFields: Record<string, unknown> };
  plugins: Array<{
    id: string;
    fn?: (input: SessionInput) => Promise<{
      user: { id: string; is_captain: boolean };
      session: { id: string };
    }>;
  }>;
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

  describe('custom session', () => {
    const plugin = () =>
      config.plugins.find(({ id }) => id === 'custom-session')!;

    test('does not declare is_captain as a user column', () => {
      expect(config.user.additionalFields).not.toHaveProperty('is_captain');
    });

    test('keeps nextCookies as the last plugin', () => {
      expect(config.plugins.at(-1)?.id).toBe('next-cookies');
    });

    test.each([true, false])(
      'reads is_captain from the player row (%s)',
      async (captain) => {
        vi.mocked(isCaptain).mockResolvedValue(captain);
        const input = { user: { id: 'user-1' }, session: { id: 's-1' } };

        const result = await plugin().fn!(input);

        expect(isCaptain).toHaveBeenCalledWith('user-1');
        expect(result).toEqual({
          user: { id: 'user-1', is_captain: captain },
          session: { id: 's-1' },
        });
      },
    );
  });
});
