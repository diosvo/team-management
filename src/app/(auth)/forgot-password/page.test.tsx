import {
  authCallbacks,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  setupTestLifecycle,
  waitFor,
} from '@/test/utilities';

import authClient from '@/lib/auth-client';
import { LOGIN_PATH } from '@/routes';

import ForgotPasswordPage from './page';

vi.mock('@/lib/auth-client', () => ({
  default: {
    requestPasswordReset: vi.fn(),
  },
}));

const VALID_EMAIL = 'test@example.com';
const SUBMIT_LABEL = /send request password instruction/i;

describe('ForgotPasswordPage', () => {
  const mockRequestPasswordReset = vi.mocked(authClient.requestPasswordReset);

  /** Resolves the request successfully. */
  const mockSuccess = () =>
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      const { onSuccess, onResponse } = authCallbacks(options);

      onSuccess?.();
      onResponse?.();
    });

  /** Leaves the request in flight so the submitting state can be asserted. */
  const mockPending = () =>
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      authCallbacks(options).onRequest?.();
    });

  const mockFailure = (message: string) =>
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      const { onError, onResponse } = authCallbacks(options);

      onError?.({ error: { message } });
      onResponse?.();
    });

  const setup = () => {
    const { container, user } = renderWithUI(<ForgotPasswordPage />);

    const email = screen.getByLabelText(/email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

    const submit = async (value = VALID_EMAIL) => {
      await user.clear(email);
      if (value) await user.type(email, value);
      await user.click(submitButton);
    };

    return { container, user, email, submitButton, submit };
  };

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = setup();

    await expectNoA11yViolations(container);
  });

  test('renders the forgot password form', () => {
    // `setup` throws if the email field or submit button is missing.
    const { email, submitButton } = setup();

    expect(
      screen.getByRole('heading', { name: /forgot your password/i }),
    ).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  test('renders back to sign in link', () => {
    setup();

    expect(
      screen.getByRole('link', { name: /go back to sign in/i }),
    ).toHaveAttribute('href', LOGIN_PATH);
  });

  test('submits form with valid email', async () => {
    mockSuccess();

    const { submit } = setup();

    await submit();

    await waitFor(() =>
      expect(mockRequestPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          email: VALID_EMAIL,
          redirectTo: '/new-password',
        }),
        expect.any(Object),
      ),
    );
  });

  test('displays success message on successful submission', async () => {
    mockSuccess();

    const { submit } = setup();

    await submit();

    expect(
      await screen.findByText(
        /password reset instructions have been sent to your email/i,
      ),
    ).toBeInTheDocument();
  });

  test('displays error message on failed submission', async () => {
    mockFailure('User not found');

    const { submit } = setup();

    await submit('nonexistent@example.com');

    expect(await screen.findByText('User not found')).toBeInTheDocument();
  });

  test('disables button during submission', async () => {
    mockPending();

    const { submitButton, submit } = setup();

    await submit();

    // The same button, relabelled while the request is in flight.
    expect(await screen.findByRole('button', { name: /sending/i })).toBe(
      submitButton,
    );
    expect(submitButton).toBeDisabled();
  });

  test('resets form after successful submission', async () => {
    mockSuccess();

    const { email, submit } = setup();

    await submit();

    expect(mockRequestPasswordReset).toHaveBeenCalled();

    await waitFor(() => expect(email).toHaveValue(''));
  });
});
