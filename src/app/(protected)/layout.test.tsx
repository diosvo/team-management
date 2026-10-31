import { redirect } from 'next/navigation';

import { render, screen } from '@/test/utilities';

import { verifySession } from '@/actions/auth';
import { LOGIN_PATH } from '@/routes';

import ProtectedLayout from './layout';

vi.mock('@/actions/auth', () => ({ verifySession: vi.fn() }));

vi.mock('@/providers/session', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

vi.mock('./_components/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe('ProtectedLayout', () => {
  test('redirects to login when there is no session', async () => {
    vi.mocked(verifySession).mockResolvedValue(null);
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(
      ProtectedLayout({ children: <div>Content</div> }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith(LOGIN_PATH, 'replace');
  });

  test('renders the shell with session and children when authenticated', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-1' },
    } as never);

    render(await ProtectedLayout({ children: <div>Content</div> }));

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
