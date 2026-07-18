import * as nuqs from 'nuqs';
import { Mock } from 'vitest';

import { toaster } from '@/components/ui/toaster';

import { MOCK_AWAY_TEAM, MOCK_TEAM } from '@/test/mocks/team';
import { renderWithUI, screen, waitFor } from '@/test/utilities';

import usePermissions from '@/hooks/use-permissions';

import { removeTeam } from '@/actions/team';
import { Team } from '@/drizzle/schema';

import { useTeamLogo } from '@/hooks/use-image';
import TeamTable from './TeamTable';
import { UpsertTeam } from './UpsertTeam';

vi.mock('@/hooks/use-permissions', () => ({
  default: vi.fn(),
}));

vi.mock('@/hooks/use-image', () => ({
  useTeamLogo: vi.fn(),
}));

vi.mock('@/actions/team', () => ({
  removeTeam: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}));

vi.mock('./UpsertTeam', () => ({
  UpsertTeam: { open: vi.fn(), Viewport: () => null },
}));

describe('TeamTable', () => {
  const mockUsePermissions = usePermissions as unknown as Mock;
  const mockUseTeamLogo = useTeamLogo as unknown as Mock;
  const mockRemoveTeam = removeTeam as unknown as Mock;
  const mockOpen = UpsertTeam.open as unknown as Mock;

  const setup = ({
    teams = [MOCK_TEAM, MOCK_AWAY_TEAM],
    can = () => false,
    params = {},
  }: Partial<{
    teams: Array<Team>;
    can: (resource: string, action: string) => boolean;
    params: Record<string, unknown>;
  }> = {}) => {
    mockUsePermissions.mockReturnValue({ can });
    mockUseTeamLogo.mockReturnValue({ data: null, isLoading: false });
    (nuqs.useQueryStates as unknown as Mock).mockReturnValue([
      { page: 1, q: '', ...params },
      vi.fn(),
    ]);

    return renderWithUI(<TeamTable teams={teams} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a row for each team', () => {
    setup();

    expect(screen.getByText(MOCK_TEAM.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_AWAY_TEAM.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TEAM.email!)).toBeInTheDocument();
  });

  test('renders the column headers', () => {
    setup();

    ['Name', 'Email', 'Established', 'Last Updated'].forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('shows the empty state when there are no teams', () => {
    setup({ teams: [] });

    expect(screen.getByText('No teams found')).toBeInTheDocument();
  });

  test('filters the teams by the search query', () => {
    setup({ params: { q: 'saigon' } });

    // HighlightText splits the matched substring into its own node.
    expect(screen.getByText('Saigon', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(MOCK_AWAY_TEAM.name)).not.toBeInTheDocument();
  });

  test('opens the dialog in update mode when a row is clicked', async () => {
    const { user } = setup({ can: (_, action) => action === 'edit' });

    await user.click(screen.getByText(MOCK_TEAM.name));

    expect(mockOpen).toHaveBeenCalledWith('update-team', {
      action: 'Update',
      item: MOCK_TEAM,
    });
  });

  test('does not open the dialog when the user cannot edit', async () => {
    const { user } = setup({ can: () => false });

    await user.click(screen.getByText(MOCK_TEAM.name));

    expect(mockOpen).not.toHaveBeenCalled();
  });

  describe('selection', () => {
    const canDelete = (_: string, action: string) => action === 'delete';

    test('deletes the selected teams and reports success', async () => {
      mockRemoveTeam.mockResolvedValue({ success: true });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        const ids = mockRemoveTeam.mock.calls.map(([id]) => id);
        expect(ids).toEqual(
          expect.arrayContaining([MOCK_TEAM.team_id, MOCK_AWAY_TEAM.team_id]),
        );
      });

      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });

    test('warns when some deletions fail', async () => {
      mockRemoveTeam
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, message: 'nope' });

      const { user } = setup({ can: canDelete });

      await user.click(
        screen.getByRole('checkbox', { name: 'Select all rows' }),
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(toaster.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'warning' }),
        );
      });
    });
  });
});
