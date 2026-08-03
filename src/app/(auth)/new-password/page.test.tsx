import { Mock } from 'vitest';

import { renderWithUI, screen, waitFor } from '@/test/utilities';

import authClient from '@/lib/auth-client';
import { LOGIN_PATH } from '@/routes';

import NewPasswordPage from './page';

const mockPush = vi.fn();

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');

  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
    useSearchParams: () => ({
      get: vi.fn((key: string) => (key === 'token' ? 'test-token-123' : null)),
    }),
  };
});

vi.mock('@/lib/auth-client', () => ({
  default: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    success: vi.fn(),
  },
}));

describe('NewPasswordPage', () => {
  const mockResetPassword = authClient.resetPassword as unknown as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the new password form', () => {
    renderWithUI(<NewPasswordPage />);

    expect(
      screen.getByRole('heading', { name: /create a new password/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  test('renders back to sign in link', () => {
    renderWithUI(<NewPasswordPage />);

    const backLink = screen.getByRole('link', {
      name: /go back to sign in/i,
    });

    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', LOGIN_PATH);
  });

  test('displays all password validation rules', () => {
    renderWithUI(<NewPasswordPage />);

    expect(
      screen.getByText(/be between 8 and 128 characters long/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contain at least one letter/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contain at least one number/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contain at least one special character/i),
    ).toBeInTheDocument();
  });

  test('validates password strength and enables submit button', async () => {
    const { user } = renderWithUI(<NewPasswordPage />);

    const passwordInput = screen.getAllByLabelText(/password/i)[0];
    const submitButton = screen.getByRole('button', { name: /submit/i });

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Type a weak password
    await user.type(passwordInput, 'weak');
    expect(submitButton).toBeDisabled();

    // Type a strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPass123!');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('submits form with valid password', async () => {
    mockResetPassword.mockImplementation((data, { onSuccess }) => {
      onSuccess?.();
    });

    const { user } = renderWithUI(<NewPasswordPage />);

    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          newPassword: 'ValidPass123!',
          token: 'test-token-123',
        }),
        expect.any(Object),
      );
    });
  });

  test('displays error message on failed submission', async () => {
    const errorMessage = 'Invalid or expired token';
    mockResetPassword.mockImplementation((data, { onError, onResponse }) => {
      onError?.({ error: { message: errorMessage } });
      onResponse?.();
    });

    const { user } = renderWithUI(<NewPasswordPage />);

    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('redirects to login page on successful password reset', async () => {
    mockResetPassword.mockImplementation((data, { onSuccess, onResponse }) => {
      onSuccess?.();
      onResponse?.();
    });

    const { user } = renderWithUI(<NewPasswordPage />);

    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(LOGIN_PATH);
    });
  });

  test('disables form inputs during submission', async () => {
    mockResetPassword.mockImplementation((data, { onRequest }) => {
      onRequest?.();
    });

    const { user } = renderWithUI(<NewPasswordPage />);

    await user.type(screen.getAllByLabelText(/password/i)[0], 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getAllByLabelText(/password/i)[0]).toBeDisabled();
      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });
  });

  test('validates each password rule independently', async () => {
    const { user } = renderWithUI(<NewPasswordPage />);

    const passwordInput = screen.getAllByLabelText(/password/i)[0];

    // Test: too short
    await user.type(passwordInput, 'Ab1!');
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

    // Test: missing number
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password!');
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

    // Test: missing special character
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123');
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

    // Test: missing letter
    await user.clear(passwordInput);
    await user.type(passwordInput, '12345678!');
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

    // Test: valid password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'ValidPass123!');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /submit/i }),
      ).not.toBeDisabled();
    });
  });
});
