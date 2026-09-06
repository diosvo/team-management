import { MOCK_SESSION_USER } from '@/test/mocks/user';
import {
  createSessionMock,
  createToasterMock,
  expectNoA11yViolations,
  renderWithUI,
  screen,
  waitFor,
} from '@/test/utilities';

import { submitLeave } from '@/actions/attendance';

import { useSessionContext } from '@/providers/session';

import SubmitLeaveRequest from './SubmitLeaveRequest';

vi.mock('@/providers/session', () => ({
  useSessionContext: vi.fn(),
}));

vi.mock('@/actions/attendance', () => ({
  submitLeave: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => createToasterMock());

describe('SubmitLeaveRequest', () => {
  const mockSubmitLeave = vi.mocked(submitLeave);

  const setup = () => {
    vi.mocked(useSessionContext).mockReturnValue(
      createSessionMock({ user: MOCK_SESSION_USER }),
    );

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

    await expectNoA11yViolations(container);
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
      expect.objectContaining({ player_id: MOCK_SESSION_USER.id }),
    );
  });
});
