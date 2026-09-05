import {
  createPermissionsMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import LeagueHeader from './LeagueHeader';
import { UpsertLeague } from './UpsertLeague';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('./UpsertLeague', () => ({
  UpsertLeague: { open: vi.fn() },
}));

describe('LeagueHeader', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockOpen = vi.mocked(UpsertLeague.open);

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ can: () => canCreate }),
    );

    return renderWithUI(<LeagueHeader />);
  };

  setupTestLifecycle();

  test('renders the page title', () => {
    setup();

    expect(screen.getByText('Leagues')).toBeInTheDocument();
  });

  test('renders the add button when the user can create', () => {
    setup(true);

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  test('hides the add button when the user cannot create', () => {
    setup(false);

    expect(
      screen.queryByRole('button', { name: /add/i }),
    ).not.toBeInTheDocument();
  });

  test('opens the dialog in add mode when the add button is clicked', async () => {
    const { user } = setup(true);

    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(mockOpen).toHaveBeenCalledWith('add-league', {
      action: 'Add',
      item: { league_id: '' },
    });
  });
});
