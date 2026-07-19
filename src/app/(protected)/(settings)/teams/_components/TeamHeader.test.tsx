import { Mock } from 'vitest';

import { renderWithUI, screen } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import TeamHeader from './TeamHeader';
import { UpsertTeam } from './UpsertTeam';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('./UpsertTeam', () => ({
  UpsertTeam: { open: vi.fn() },
}));

describe('TeamHeader', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockOpen = UpsertTeam.open as unknown as Mock;

  const setup = (canCreate = false) => {
    mockUsePermissions.mockReturnValue({
      can: vi.fn(() => canCreate),
      isLoading: false,
    });

    return renderWithUI(<TeamHeader />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the page title', () => {
    setup();

    expect(screen.getByText('Teams')).toBeInTheDocument();
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

    expect(mockOpen).toHaveBeenCalledWith('add-team', {
      action: 'Add',
      item: { team_id: '' },
    });
  });
});
