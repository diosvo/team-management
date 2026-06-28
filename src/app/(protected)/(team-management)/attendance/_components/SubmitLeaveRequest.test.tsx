import { axe } from 'jest-axe';
import { Mock } from 'vitest';

import { MOCK_USER } from '@/test/mocks/user';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import { submitLeave } from '@/actions/attendance';
import authClient from '@/lib/auth-client';

import SubmitLeaveRequest from './SubmitLeaveRequest';

vi.mock('@/lib/auth-client', () => ({
  default: { useSession: vi.fn() },
}));

vi.mock('@/actions/attendance', () => ({
  submitLeave: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

describe('SubmitLeaveRequest', () => {
  const mockSubmitLeave = vi.mocked(submitLeave);

  const setup = () => {
    (authClient.useSession as Mock).mockReturnValue({
      data: { user: MOCK_USER },
    });

    return renderWithUI(<SubmitLeaveRequest trigger={<button>Open</button>} />);
  };

  const open = async (user: ReturnType<typeof setup>['user']) => {
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByText('Submit Leave Request');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitLeave.mockResolvedValue({ success: true, message: 'Submitted' });
  });

  test('should be accessible', async () => {
    const { container } = setup();

    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  test('renders the trigger and keeps the dialog closed initially', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByText('Submit Leave Request')).not.toBeInTheDocument();
  });

  test('opens the dialog with the date and reason fields', async () => {
    const { user } = setup();

    await open(user);

    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Reason')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Reason for leave...'),
    ).toBeInTheDocument();
  });

  test('submits the request for the current user', async () => {
    const { user } = setup();

    await open(user);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => expect(mockSubmitLeave).toHaveBeenCalledTimes(1));
    expect(mockSubmitLeave).toHaveBeenCalledWith(
      expect.objectContaining({ player_id: MOCK_USER.id }),
    );
  });
});
