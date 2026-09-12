import {
  authCallbacks,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import authClient from '@/lib/auth-client';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

import type { LoginValues } from '@/schemas/auth';
import LoginPage from './page';

vi.mock('@/lib/auth-client', () => ({
  default: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

const VALID_EMAIL = 'test@example.com';
const VALID_PASSWORD = 'password123';

describe('LoginPage', () => {
  const mockSignIn = vi.mocked(authClient.signIn.email);

  const mockResponse = (
    status: number,
    headers: Record<string, string> = {},
  ) => ({
    status,
    headers: { get: (name: string) => headers[name] },
  });

  /** Resolves the request without an error. */
  const mockSuccess = () =>
    mockSignIn.mockImplementation((data) => {
      authCallbacks(data).onResponse?.();
    });

  /** Leaves the request in flight so the submitting state can be asserted. */
  const mockPending = () =>
    mockSignIn.mockImplementation((data) => {
      authCallbacks(data).onRequest?.();
    });

  const mockFailure = (
    message: string,
    status = 401,
    headers?: Record<string, string>,
  ) =>
    mockSignIn.mockImplementation((data) => {
      const { onError, onResponse } = authCallbacks(data);

      onError?.({
        error: { message },
        response: mockResponse(status, headers),
      });
      onResponse?.();
    });

  const setup = () => {
    const { container, user } = renderWithUI(<LoginPage />);

    const email = screen.getByLabelText(/email/i);
    // The password input shares its label with the visibility toggle.
    const password = screen.getAllByLabelText(/password/i)[0];
    const signIn = screen.getByRole('button', { name: /sign in/i });

    const fill = async ({
      email: nextEmail = VALID_EMAIL,
      password: nextPassword = VALID_PASSWORD,
    }: Partial<LoginValues> = {}) => {
      await user.clear(email);
      if (nextEmail) await user.type(email, nextEmail);

      await user.clear(password);
      if (nextPassword) await user.type(password, nextPassword);
    };

    const submit = async (credentials?: Partial<LoginValues>) => {
      await fill(credentials);
      await user.click(signIn);
    };

    return { container, user, email, password, signIn, fill, submit };
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the login form', () => {
    // `setup` throws if any of the fields are missing.
    const { email, password, signIn } = setup();

    expect(
      screen.getByRole('heading', { name: /sign in to your account/i }),
    ).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(signIn).toBeInTheDocument();
  });

  test('renders forgot password link', () => {
    setup();

    expect(
      screen.getByRole('link', { name: /forgot your password/i }),
    ).toHaveAttribute('href', '/forgot-password');
  });

  test('submits form with valid credentials', async () => {
    mockSuccess();

    const { submit } = setup();

    await submit();

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          email: VALID_EMAIL,
          password: VALID_PASSWORD,
          callbackURL: DEFAULT_LOGIN_REDIRECT,
        }),
      ),
    );
  });

  test('displays error message on failed login', async () => {
    mockFailure('Invalid credentials');

    const { submit } = setup();

    await submit({ password: 'wrongpassword' });

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  test('disables sign in after a 401 until a credential is edited', async () => {
    mockFailure('Invalid credentials');

    const { user, password, signIn, submit } = setup();

    await submit({ password: 'wrongpassword' });

    await waitFor(() => expect(signIn).toBeDisabled());

    await user.type(password, '!');

    await waitFor(() => expect(signIn).toBeEnabled());
  });

  test('shows the retry time when rate limited', async () => {
    mockFailure('Too many requests', 429, { 'X-Retry-After': '60' });

    const { submit } = setup();

    await submit();

    expect(
      // `HH:mm:ss`, computed from the `X-Retry-After` header.
      await screen.findByText(
        /rate limit exceeded\. retry at \d{2}:\d{2}:\d{2}/i,
      ),
    ).toBeInTheDocument();
  });

  test('disables form inputs during submission', async () => {
    mockPending();

    const { email, password, submit } = setup();

    await submit();

    await waitFor(() => {
      expect(email).toBeDisabled();
      expect(password).toBeDisabled();
    });
  });

  test('keeps sign in disabled until both fields are valid', async () => {
    const { user, password, signIn, fill } = setup();

    expect(signIn).toBeDisabled();

    await fill({ email: 'not-an-email' });
    expect(signIn).toBeDisabled();

    // Shorter than the 8 characters the schema requires.
    await fill({ password: 'short' });
    expect(signIn).toBeDisabled();

    await user.type(password, 'er123');

    await waitFor(() => expect(signIn).toBeEnabled());
  });

  test('does not submit an empty form', async () => {
    const { user, signIn } = setup();

    await user.click(signIn);

    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
