import {
  createPermissionsMock,
  renderWithUI,
  screen,
  setupTestLifecycle,
} from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import MatchHeader from './MatchHeader';
import { UpsertMatch } from './UpsertMatch';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('./UpsertMatch', () => ({
  UpsertMatch: { open: vi.fn() },
}));

describe('MatchHeader', () => {
  const mockUsePermissions = vi.mocked(usePermissions);
  const mockOpen = vi.mocked(UpsertMatch.open);

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue(
      createPermissionsMock({ can: () => canCreate }),
    );

    return renderWithUI(<MatchHeader />);
  };

  setupTestLifecycle();

  test('renders the page title', () => {
    setup();

    expect(screen.getByText('Matches')).toBeInTheDocument();
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

    expect(mockOpen).toHaveBeenCalledWith('add-match', {
      action: 'Add',
      item: { match_id: '' },
    });
  });
});
