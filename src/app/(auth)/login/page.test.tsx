import { Mock } from 'vitest';

import { renderWithUI, screen, waitFor } from '@/test/utilities';

import authClient from '@/lib/auth-client';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

import LoginPage from './page';

vi.mock('@/lib/auth-client', () => ({
  default: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

describe('LoginPage', () => {
  const mockSignIn = authClient.signIn.email as unknown as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the login form', () => {
    renderWithUI(<LoginPage />);

    expect(
      screen.getByRole('heading', { name: /sign in to your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test('renders forgot password link', () => {
    renderWithUI(<LoginPage />);

    const forgotPasswordLink = screen.getByRole('link', {
      name: /forgot your password/i,
    });

    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });

  test('submits form with valid credentials', async () => {
    mockSignIn.mockImplementation((data, { onResponse }) => {
      onResponse?.();
    });

    const { user } = renderWithUI(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
          callbackURL: DEFAULT_LOGIN_REDIRECT,
        }),
        expect.any(Object),
      );
    });
  });

  test('displays error message on failed login', async () => {
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockImplementation((data, { onError, onResponse }) => {
      onError?.({ error: { message: errorMessage } });
      onResponse?.();
    });

    const { user } = renderWithUI(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getAllByLabelText(/password/i)[0], 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('disables form inputs during submission', async () => {
    mockSignIn.mockImplementation((data, { onRequest }) => {
      onRequest?.();
    });

    const { user } = renderWithUI(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getAllByLabelText(/password/i)[0], 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getAllByLabelText(/password/i)[0]).toBeDisabled();
    });
  });

  test('validates required fields', async () => {
    const { user } = renderWithUI(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });
});
