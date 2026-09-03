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

describe('ForgotPasswordPage', () => {
  const mockRequestPasswordReset = vi.mocked(authClient.requestPasswordReset);

  setupTestLifecycle();

  test('should be accessible', async () => {
    const { container } = renderWithUI(<ForgotPasswordPage />);

    await expectNoA11yViolations(container);
  });

  test('renders the forgot password form', () => {
    renderWithUI(<ForgotPasswordPage />);

    expect(
      screen.getByRole('heading', { name: /forgot your password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /send request password instruction/i,
      }),
    ).toBeInTheDocument();
  });

  test('renders back to sign in link', () => {
    renderWithUI(<ForgotPasswordPage />);

    const backLink = screen.getByRole('link', {
      name: /go back to sign in/i,
    });

    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', LOGIN_PATH);
  });

  test('submits form with valid email', async () => {
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      const { onSuccess } = authCallbacks(options);

      onSuccess?.();
    });

    const { user } = renderWithUI(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(
      screen.getByRole('button', {
        name: /send request password instruction/i,
      }),
    );

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          redirectTo: '/new-password',
        }),
        expect.any(Object),
      );
    });
  });

  test('displays success message on successful submission', async () => {
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      const { onSuccess, onResponse } = authCallbacks(options);

      onSuccess?.();
      onResponse?.();
    });

    const { user } = renderWithUI(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(
      screen.getByRole('button', {
        name: /send request password instruction/i,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /password reset instructions have been sent to your email/i,
        ),
      ).toBeInTheDocument();
    });
  });

  test('displays error message on failed submission', async () => {
    const errorMessage = 'User not found';
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      const { onError, onResponse } = authCallbacks(options);

      onError?.({ error: { message: errorMessage } });
      onResponse?.();
    });

    const { user } = renderWithUI(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), 'nonexistent@example.com');
    await user.click(
      screen.getByRole('button', {
        name: /send request password instruction/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('disables button during submission', async () => {
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      const { onRequest } = authCallbacks(options);

      onRequest?.();
    });

    const { user } = renderWithUI(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(
      screen.getByRole('button', {
        name: /send request password instruction/i,
      }),
    );

    await waitFor(() => {
      const button = screen.getByRole('button', {
        name: /sending/i,
      });
      expect(button).toBeDisabled();
    });
  });

  test('resets form after successful submission', async () => {
    mockRequestPasswordReset.mockImplementation((_data, options) => {
      const { onSuccess, onResponse } = authCallbacks(options);

      onSuccess?.();
      onResponse?.();
    });

    const { user } = renderWithUI(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

    await user.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');

    await user.click(
      screen.getByRole('button', {
        name: /send request password instruction/i,
      }),
    );

    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });
});
