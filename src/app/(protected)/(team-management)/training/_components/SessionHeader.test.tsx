import {
  createPermissionsMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import SessionHeader from './SessionHeader';
import { UpsertSession } from './UpsertSession';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('./UpsertSession', () => ({
  UpsertSession: { open: vi.fn() },
}));

describe('SessionHeader', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockOpen = vi.mocked(UpsertSession.open);

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ can: () => canCreate }),
    );

    return renderWithUI(<SessionHeader />);
  };

  setupTestLifecycle();

  test('renders the page title', () => {
    setup();

    expect(screen.getByText('Training Sessions')).toBeInTheDocument();
  });

  test('renders the new session button when the user can create', () => {
    setup(true);

    expect(
      screen.getByRole('button', { name: /new session/i }),
    ).toBeInTheDocument();
  });

  test('hides the new session button when the user cannot create', () => {
    setup(false);

    expect(
      screen.queryByRole('button', { name: /new session/i }),
    ).not.toBeInTheDocument();
  });

  test('opens the dialog in create mode when the button is clicked', async () => {
    const { user } = setup(true);

    await user.click(screen.getByRole('button', { name: /new session/i }));

    expect(mockOpen).toHaveBeenCalledWith('new-session', {
      action: 'Create',
      item: { session_id: '' },
    });
  });
});
